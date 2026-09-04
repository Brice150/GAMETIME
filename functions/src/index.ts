import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  DocumentData,
  DocumentReference,
  FieldValue,
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
  WriteBatch,
} from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  onDocumentCreated,
  onDocumentDeleted,
} from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';

initializeApp();

setGlobalOptions({ region: 'europe-west1' });

const db = getFirestore();
const auth = getAuth();

// Copie de src/assets/data/goals.ts : la recompense doit etre decidee ici,
// pas par le client.
const GOALS: { target: number; reward: number }[] = [
  { target: 10, reward: 1 },
  { target: 25, reward: 2 },
  { target: 50, reward: 3 },
  { target: 100, reward: 5 },
  { target: 300, reward: 8 },
  { target: 600, reward: 10 },
  { target: 1000, reward: 20 },
  { target: 2000, reward: 20 },
  { target: 3000, reward: 20 },
  { target: 4000, reward: 20 },
  { target: 5000, reward: 50 },
  { target: 6000, reward: 20 },
  { target: 7000, reward: 20 },
  { target: 8000, reward: 20 },
  { target: 9000, reward: 20 },
  { target: 10000, reward: 100 },
];

// Doit suivre le catalogue du client (src/assets/data/games.ts) : cette
// liste ne borne que le jeu passe a `claimGoal`, les medailles etant comptees
// par jeu.
const GAME_KEYS = [
  'drapeaux',
  'marques',
  'motus',
  'anagrammes',
  'capitales',
  'gentiles',
  'elements',
  'emojis',
];

// Marge de tolerance sur le chrono envoye par le client : le temps mesure
// localement demarre a l'affichage de la question, donc apres le lancement
// de la room.
const DURATION_TOLERANCE_MS = 5000;
const STALE_ROOM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface Stat {
  gameName: string;
  medalsNumber: number;
  lastSuccessRetrieved: number;
}

/**
 * Comparaison des reponses : la casse et les accents ne comptent pas, le
 * client saisissant sans accent.
 */
function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase();
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return null;
}

function requireUid(authData: { uid?: string } | undefined): string {
  const uid = authData?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'Connexion requise.');
  }

  return uid;
}

async function findPlayerByUserId(
  userId: string,
): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  const snapshot = await db
    .collection('players')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0];
}

/**
 * Enregistre le resultat d'une manche. C'est la seule voie d'attribution
 * d'une medaille de partie : le client ne peut plus ecrire `stats` lui-meme.
 *
 * Le client envoie le mot saisi, pas un verdict : c'est ici qu'il est compare
 * au mot de la manche. Sur parole, il suffisait d'appeler cette fonction avec
 * `won: true` pour remplir son compteur sans jouer.
 *
 * Verifie aussi que la manche soumise est bien la suivante, ce qui empeche de
 * rejouer la meme ou d'en sauter.
 */
export const submitRound = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const { roomId, stepIndex, answer, durationMs } = request.data ?? {};

  if (typeof roomId !== 'string' || !roomId) {
    throw new HttpsError('invalid-argument', 'Room manquante.');
  }
  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    throw new HttpsError('invalid-argument', 'Manche invalide.');
  }
  if (typeof answer !== 'string' || answer.length > 64) {
    throw new HttpsError('invalid-argument', 'Reponse invalide.');
  }

  return db.runTransaction(async (transaction) => {
    const roomRef = db.doc(`rooms/${roomId}`);
    const roomSnapshot = await transaction.get(roomRef);

    if (!roomSnapshot.exists) {
      throw new HttpsError('not-found', 'Room introuvable.');
    }

    const room = roomSnapshot.data()!;

    if (room['isStarted'] !== true) {
      throw new HttpsError('failed-precondition', "La partie n'est pas lancee.");
    }
    if (!((room['playerIds'] as string[]) ?? []).includes(uid)) {
      throw new HttpsError('permission-denied', 'Vous n etes pas dans cette room.');
    }

    const responses = (room['responses'] as string[]) ?? [];

    if (stepIndex >= responses.length) {
      throw new HttpsError('invalid-argument', 'Manche hors partie.');
    }

    const won =
      normalizeAnswer(answer) === normalizeAnswer(responses[stepIndex]);

    const playerQuery = db
      .collection('players')
      .where('userId', '==', uid)
      .limit(1);
    const playerSnapshot = await transaction.get(playerQuery);

    if (playerSnapshot.empty) {
      throw new HttpsError('not-found', 'Joueur introuvable.');
    }

    const playerDoc = playerSnapshot.docs[0];
    const player = playerDoc.data();
    const wins = (player['currentRoomWins'] as boolean[]) ?? [];

    if (wins.length !== stepIndex) {
      throw new HttpsError(
        'failed-precondition',
        'Cette manche est deja enregistree.',
      );
    }

    const updatedWins = [...wins, won];
    const gameName = room['gameName'] as string;
    const currentStats = (player['stats'] as Stat[]) ?? [];

    // Les fiches ne portent que les compteurs des jeux deja pratiques : celui
    // du jeu en cours nait ici. Sans cette creation, un jeu ajoute apres la
    // fiche n'attribuait aucune medaille, sans erreur visible.
    const knownStats = currentStats.some((stat) => stat.gameName === gameName)
      ? currentStats
      : [
          ...currentStats,
          { gameName, medalsNumber: 0, lastSuccessRetrieved: 0 },
        ];

    const stats = knownStats.map((stat) =>
      won && stat.gameName === gameName
        ? { ...stat, medalsNumber: (stat.medalsNumber ?? 0) + 1 }
        : stat,
    );

    const update: Record<string, unknown> = {
      currentRoomWins: updatedWins,
      stats,
    };

    if (updatedWins.length === responses.length) {
      // Le chrono vient du client (il demarre a l'affichage de la question),
      // mais il ne peut pas etre inferieur au temps ecoule depuis le
      // lancement de la room.
      const startDate = toDate(room['startDate']);
      const elapsedMs = startDate
        ? Math.max(0, Date.now() - startDate.getTime())
        : null;
      const reported =
        typeof durationMs === 'number' && durationMs >= 0 ? durationMs : null;

      update['finishDate'] = FieldValue.serverTimestamp();
      update['durationMs'] =
        elapsedMs === null
          ? reported
          : reported === null
            ? elapsedMs
            : Math.min(reported, elapsedMs + DURATION_TOLERANCE_MS);
      update['isReady'] = true;
    }

    transaction.update(playerDoc.ref, update);

    const gameStat = stats.find((stat) => stat.gameName === gameName);

    return {
      won,
      currentRoomWins: updatedWins,
      finished: updatedWins.length === responses.length,
      medalsNumber: gameStat?.medalsNumber ?? 0,
    };
  });
});

/**
 * Recupere la recompense d'un succes. Le palier et la recompense sont lus
 * dans la table serveur, pas dans la requete.
 */
export const claimGoal = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const { gameName, target } = request.data ?? {};

  if (typeof gameName !== 'string' || !GAME_KEYS.includes(gameName)) {
    throw new HttpsError('invalid-argument', 'Jeu inconnu.');
  }

  const goal = GOALS.find((item) => item.target === target);

  if (!goal) {
    throw new HttpsError('invalid-argument', 'Palier inconnu.');
  }

  return db.runTransaction(async (transaction) => {
    const playerQuery = db
      .collection('players')
      .where('userId', '==', uid)
      .limit(1);
    const playerSnapshot = await transaction.get(playerQuery);

    if (playerSnapshot.empty) {
      throw new HttpsError('not-found', 'Joueur introuvable.');
    }

    const playerDoc = playerSnapshot.docs[0];
    const stats = ((playerDoc.data()['stats'] as Stat[]) ?? []).map((stat) => ({
      ...stat,
    }));
    const stat = stats.find((item) => item.gameName === gameName);

    if (!stat) {
      throw new HttpsError('failed-precondition', 'Statistique absente.');
    }
    if ((stat.medalsNumber ?? 0) < goal.target) {
      throw new HttpsError('failed-precondition', 'Palier non atteint.');
    }
    if ((stat.lastSuccessRetrieved ?? 0) >= goal.target) {
      throw new HttpsError('failed-precondition', 'Succes deja recupere.');
    }

    stat.lastSuccessRetrieved = goal.target;
    stat.medalsNumber = (stat.medalsNumber ?? 0) + goal.reward;

    transaction.update(playerDoc.ref, { stats });

    return { reward: goal.reward, medalsNumber: stat.medalsNumber };
  });
});

const FRIEND_ACTIONS = ['send', 'cancel', 'accept', 'decline', 'remove'];

function acceptFriendship(
  batch: WriteBatch,
  meRef: DocumentReference,
  targetRef: DocumentReference,
  uid: string,
  targetUserId: string,
): void {
  batch.update(meRef, {
    friendIds: FieldValue.arrayUnion(targetUserId),
    friendRequestIds: FieldValue.arrayRemove(targetUserId),
  });
  batch.update(targetRef, {
    friendIds: FieldValue.arrayUnion(uid),
    friendRequestIds: FieldValue.arrayRemove(uid),
  });
}

/**
 * Toutes les ecritures d'amitie passent ici. Les regles Firestore ne peuvent
 * pas verifier qu'une demande a bien ete acceptee des deux cotes : laissees au
 * client, elles permettaient a n'importe quel compte de s'ajouter dans les
 * amis d'un autre, ou de vider sa liste.
 */
export const manageFriendship = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const { action, targetUserId } = request.data ?? {};

  if (typeof action !== 'string' || !FRIEND_ACTIONS.includes(action)) {
    throw new HttpsError('invalid-argument', 'Action inconnue.');
  }

  if (
    typeof targetUserId !== 'string' ||
    !targetUserId ||
    targetUserId === uid
  ) {
    throw new HttpsError('invalid-argument', 'Joueur invalide.');
  }

  const [me, target] = await Promise.all([
    findPlayerByUserId(uid),
    findPlayerByUserId(targetUserId),
  ]);

  if (!me || !target) {
    throw new HttpsError('not-found', 'Joueur introuvable.');
  }

  const myRequests = (me.data()['friendRequestIds'] as string[]) ?? [];
  const batch = db.batch();

  switch (action) {
    case 'send':
      // Demande croisee : inutile de faire valider une seconde fois.
      if (myRequests.includes(targetUserId)) {
        acceptFriendship(batch, me.ref, target.ref, uid, targetUserId);
      } else {
        batch.update(target.ref, {
          friendRequestIds: FieldValue.arrayUnion(uid),
        });
      }
      break;
    case 'cancel':
      batch.update(target.ref, {
        friendRequestIds: FieldValue.arrayRemove(uid),
      });
      break;
    case 'accept':
      if (!myRequests.includes(targetUserId)) {
        throw new HttpsError(
          'failed-precondition',
          'Aucune demande de ce joueur.',
        );
      }
      acceptFriendship(batch, me.ref, target.ref, uid, targetUserId);
      break;
    case 'decline':
      batch.update(me.ref, {
        friendRequestIds: FieldValue.arrayRemove(targetUserId),
      });
      break;
    case 'remove':
      batch.update(me.ref, { friendIds: FieldValue.arrayRemove(targetUserId) });
      batch.update(target.ref, { friendIds: FieldValue.arrayRemove(uid) });
      break;
  }

  await batch.commit();

  return { ok: true };
});

/**
 * Reprise de la progression d'un compte invite vers un compte definitif.
 *
 * L'appel arrive alors que l'on est deja authentifie avec le compte
 * definitif : la preuve de possession du compte invite est le jeton
 * d'identification recupere avant le changement de compte.
 */
export const linkGuestAccount = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const { guestIdToken } = request.data ?? {};

  if (typeof guestIdToken !== 'string' || !guestIdToken) {
    throw new HttpsError('invalid-argument', 'Jeton du compte invite manquant.');
  }

  const decoded = await auth.verifyIdToken(guestIdToken, true).catch(() => {
    throw new HttpsError('permission-denied', 'Jeton du compte invite invalide.');
  });

  if (decoded.firebase?.sign_in_provider !== 'anonymous') {
    throw new HttpsError(
      'permission-denied',
      "Le compte d'origine n'est pas un compte invite.",
    );
  }

  const guestUid = decoded.uid;

  if (guestUid === uid) {
    return { migrated: false };
  }

  const [guestPlayer, targetPlayer] = await Promise.all([
    findPlayerByUserId(guestUid),
    findPlayerByUserId(uid),
  ]);

  if (guestPlayer) {
    if (!targetPlayer) {
      await guestPlayer.ref.update({ userId: uid });
    } else {
      const guestStats = (guestPlayer.data()['stats'] as Stat[]) ?? [];
      const targetStats = (targetPlayer.data()['stats'] as Stat[]) ?? [];
      const byGame = new Map<string, Stat>();

      targetStats.forEach((stat) => byGame.set(stat.gameName, { ...stat }));
      guestStats.forEach((stat) => {
        const existing = byGame.get(stat.gameName);
        byGame.set(stat.gameName, {
          gameName: stat.gameName,
          medalsNumber: Math.max(
            existing?.medalsNumber ?? 0,
            stat.medalsNumber ?? 0,
          ),
          lastSuccessRetrieved: Math.max(
            existing?.lastSuccessRetrieved ?? 0,
            stat.lastSuccessRetrieved ?? 0,
          ),
        });
      });

      await targetPlayer.ref.update({
        stats: Array.from(byGame.values()),
        isAdmin:
          targetPlayer.data()['isAdmin'] === true ||
          guestPlayer.data()['isAdmin'] === true,
      });
      await guestPlayer.ref.delete();
    }
  }

  await migrateRooms(guestUid, uid);

  await auth.deleteUser(guestUid).catch((error) => {
    logger.warn(`Compte invite ${guestUid} non supprime`, error);
  });

  return { migrated: true };
});

async function migrateRooms(guestUid: string, targetUid: string): Promise<void> {
  const [ownedRooms, joinedRooms] = await Promise.all([
    db.collection('rooms').where('userId', '==', guestUid).get(),
    db.collection('rooms').where('playerIds', 'array-contains', guestUid).get(),
  ]);

  const batch = db.batch();

  ownedRooms.docs.forEach((roomDoc) =>
    batch.update(roomDoc.ref, { userId: targetUid }),
  );

  joinedRooms.docs.forEach((roomDoc) => {
    const playerIds = (roomDoc.data()['playerIds'] as string[]) ?? [];
    const replaced = Array.from(
      new Set(playerIds.map((id) => (id === guestUid ? targetUid : id))),
    );
    batch.update(roomDoc.ref, { playerIds: replaced });
  });

  await batch.commit();
}

/**
 * Notification push d'invitation. L'ecoute Firestore de l'application ne
 * couvre que l'onglet ouvert : ici la notification part meme si le
 * destinataire a ferme Game Time.
 */
export const notifyInvitation = onDocumentCreated(
  'invitations/{invitationId}',
  async (event) => {
    const invitation = event.data?.data();

    if (!invitation) {
      return;
    }

    const toUserId = invitation['toUserId'] as string | undefined;

    if (!toUserId) {
      return;
    }

    const tokensSnapshot = await db
      .collection('fcmTokens')
      .where('userId', '==', toUserId)
      .get();
    const tokens = tokensSnapshot.docs.map((tokenDoc) => tokenDoc.id);

    if (!tokens.length) {
      return;
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'Game Time',
        body: `${invitation['fromUsername']} vous invite dans la room ${invitation['roomCode']}`,
      },
      data: {
        link: `/room/${invitation['roomId']}`,
      },
      webpush: {
        fcmOptions: {
          link: `/room/${invitation['roomId']}`,
        },
      },
    });

    // On ne supprime que les jetons definitivement morts : un echec reseau
    // ne doit pas desabonner un appareil valide.
    const deadTokenCodes = [
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument',
      'messaging/invalid-registration-token',
    ];

    const deadTokenDocs = response.responses
      .map((result, index) =>
        !result.success &&
        deadTokenCodes.includes(result.error?.code ?? '')
          ? tokensSnapshot.docs[index]
          : null,
      )
      .filter((tokenDoc) => tokenDoc !== null);

    await Promise.all(deadTokenDocs.map((tokenDoc) => tokenDoc.ref.delete()));
  },
);

/**
 * Une room supprimee laisse des invitations mortes et des joueurs bloques sur
 * un ecran de resultats : le menage est fait ici, quelle que soit la facon
 * dont la room a disparu.
 */
export const onRoomDeleted = onDocumentDeleted(
  'rooms/{roomId}',
  async (event) => {
    const roomId = event.params.roomId;
    const playerIds = (event.data?.data()['playerIds'] as string[]) ?? [];

    const invitations = await db
      .collection('invitations')
      .where('roomId', '==', roomId)
      .get();

    const batch = db.batch();
    invitations.docs.forEach((invitationDoc) => batch.delete(invitationDoc.ref));

    for (const chunk of chunkArray(playerIds, 30)) {
      const players = await db
        .collection('players')
        .where('userId', 'in', chunk)
        .get();

      players.docs.forEach((playerDoc) =>
        batch.update(playerDoc.ref, {
          currentRoomWins: [],
          finishDate: null,
          durationMs: null,
          isReady: false,
          currentRoundProgress: null,
          vote: null,
        }),
      );
    }

    await batch.commit();
  },
);

/**
 * Personne ne supprime une room dont l'hote a simplement ferme l'onglet.
 */
export const cleanupStaleRooms = onSchedule('every 24 hours', async () => {
  const cutoff = Date.now() - STALE_ROOM_MAX_AGE_MS;
  const rooms = await db.collection('rooms').get();

  const staleRooms = rooms.docs.filter((roomDoc) => {
    const data = roomDoc.data();
    const reference =
      toDate(data['lastActivityAt']) ??
      toDate(data['createdAt']) ??
      toDate(data['startDate']);

    return !!reference && reference.getTime() < cutoff;
  });

  if (!staleRooms.length) {
    logger.info('Aucune room inactive.');
    return;
  }

  // La suppression declenche `onRoomDeleted`, qui fait le reste du menage.
  await Promise.all(staleRooms.map((roomDoc) => roomDoc.ref.delete()));
  logger.info(`${staleRooms.length} rooms inactives supprimees.`);
});

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
