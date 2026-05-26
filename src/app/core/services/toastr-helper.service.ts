import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class ToastrHelperService {
  private toastr = inject(ToastrService);

  private readonly BASE_OPTIONS = {
    positionClass: 'toast-bottom-center',
  };

  error(message: string): void {
    this.toastr.error(message, 'Erreur', {
      ...this.BASE_OPTIONS,
      toastClass: 'ngx-toastr custom error',
    });
  }

  info(message: string, title: string): void {
    this.toastr.info(message, title, {
      ...this.BASE_OPTIONS,
      toastClass: 'ngx-toastr custom info',
    });
  }
}
