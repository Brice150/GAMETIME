import { inject, Injectable } from '@angular/core';
import { deleteUser } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  userService = inject(UserService);

  deleteProfile(): Observable<void> {
    const currentUser = this.userService.auth.currentUser;

    if (!currentUser) {
      return from(Promise.reject('User not logged in'));
    }

    const promise = deleteUser(currentUser);

    return from(promise);
  }
}
