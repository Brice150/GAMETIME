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
import { AiTheme } from '../interfaces/ai-theme';

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

  addOrUpdateExcludedQuestions(
    categoryFilter: number,
    descriptions: string[]
  ): Observable<void> {
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
          const unique = Array.from(new Set(descriptions)).slice(-30);

          const newDocRef = doc(this.excludedQuestionsCollection);
          return from(
            setDoc(newDocRef, {
              userId,
              themes: [
                {
                  categoryFilter,
                  descriptions: unique,
                },
              ],
            })
          );
        } else {
          const existingDoc = snapshot.docs[0];
          const existingRef = doc(
            this.firestore,
            `excluded-questions/${existingDoc.id}`
          );
          const existingData = existingDoc.data() as ExcludedUserQuestions;

          const themes = existingData.themes ?? [];
          const idx = themes.findIndex(
            (t) => t.categoryFilter === categoryFilter
          );

          if (idx === -1) {
            const newTheme: AiTheme = {
              categoryFilter,
              descriptions: Array.from(new Set(descriptions)).slice(-30),
            };
            themes.push(newTheme);
          } else {
            const combined = [
              ...(themes[idx].descriptions ?? []),
              ...descriptions,
            ];
            const unique = Array.from(new Set(combined)).slice(-30);
            themes[idx] = { ...themes[idx], descriptions: unique };
          }

          return from(updateDoc(existingRef, { themes }));
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
