import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {
  combineLatest,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { ExcludedUserQuestions } from '../interfaces/excluded-user-questions';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class ExcludedQuestionsService {
  firestore = inject(Firestore);
  userService = inject(UserService);
  excludedQuestionsCollection = collection(
    this.firestore,
    'excluded-questions'
  );

  getExcludedQuestions(): Observable<ExcludedUserQuestions[]> {
    const userId = this.userService.auth.currentUser?.uid;
    const excludedQuestionsCollection = query(
      collection(this.firestore, 'excluded-questions'),
      where('userId', '==', userId)
    );
    return collectionData(excludedQuestionsCollection, {
      idField: 'id',
    }) as Observable<ExcludedUserQuestions[]>;
  }

  addOrUpdateExcludedQuestions(descriptions: string[]): Observable<void> {
    const userId = this.userService.auth.currentUser?.uid;
    if (!userId) {
      return of(undefined);
    }

    const userQuery = query(
      this.excludedQuestionsCollection,
      where('userId', '==', userId)
    );

    return from(getDocs(userQuery)).pipe(
      switchMap((snapshot) => {
        if (snapshot.empty) {
          const uniqueDescriptions = Array.from(new Set(descriptions)).slice(
            -30
          );

          const newDocRef = doc(this.excludedQuestionsCollection);
          return from(
            setDoc(newDocRef, {
              userId,
              descriptions: uniqueDescriptions,
            })
          );
        } else {
          const existingDoc = snapshot.docs[0];
          const existingRef = doc(
            this.firestore,
            `excluded-questions/${existingDoc.id}`
          );
          const existingData = existingDoc.data() as ExcludedUserQuestions;

          const combined = [
            ...(existingData.descriptions || []),
            ...descriptions,
          ];

          const uniqueDescriptions = combined.filter(
            (item, index) => combined.indexOf(item) === index
          );

          const last30 = uniqueDescriptions.slice(-30);

          return from(updateDoc(existingRef, { descriptions: last30 }));
        }
      })
    );
  }

  deleteUserExcludedQuestions(): Observable<void> {
    const excludedQuestionsQuery = query(
      this.excludedQuestionsCollection,
      where('userId', '==', this.userService.auth.currentUser?.uid)
    );

    return collectionData(excludedQuestionsQuery, { idField: 'id' }).pipe(
      take(1),
      switchMap((excludedQuestions: any[]) => {
        if (excludedQuestions.length === 0) {
          return of(undefined);
        }

        const deleteRequests = excludedQuestions.map(
          (excludedQuestions: ExcludedUserQuestions) => {
            const excludedQuestionsDoc = doc(
              this.firestore,
              `excluded-questions/${excludedQuestions.id}`
            );
            return deleteDoc(excludedQuestionsDoc);
          }
        );

        return combineLatest(deleteRequests);
      }),
      map(() => undefined)
    );
  }
}
