import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../core/interfaces/user';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { LearnDialogComponent } from '../shared/components/learn-dialog/learn-dialog.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
  imagePath: string = environment.imagePath;
  isActive: boolean[] = [true, false, false];
  user: User = {} as User;

  constructor(
    public dialog: MatDialog,
    private toastr: ToastrService
    ) {}
  
  ngOnInit() {
    let storedUser: string | null = localStorage.getItem('user');
    if (storedUser !== null) {
      this.user = JSON.parse(storedUser);
    } else {
      const randomString = uuidv4().substring(0,4);
      this.user.username = `User#${randomString}`;
      this.user.victories = {
        game: ['motus', 'flag'],
        gold: [0, 0],
        silver: [0, 0]
      };
      localStorage.setItem('user', JSON.stringify(this.user));
    }    
  }

  trigger(gameIndex: number) {
    this.isActive.fill(false);
    this.isActive[gameIndex] = true;
  }

  openConfirmationDialog() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteAccount();
      }
    })
  }

  openLearnDialog() {
    this.dialog.open(LearnDialogComponent);
  }

  changeName() {
    if (this.user.username.length > 10) {
      this.toastr.error("Username too long", "ACCOUNT", {
        positionClass: "toast-bottom-center" 
      });
    }
    else if (this.user.username.length < 5) {
      this.toastr.error("Username too short", "ACCOUNT", {
        positionClass: "toast-bottom-center" 
      });
    }
    else {
      localStorage.setItem('user', JSON.stringify(this.user));
      this.toastr.info("Account modified", "ACCOUNT", {
        positionClass: "toast-bottom-center" 
      });
    }
  }

  deleteAccount() {
    localStorage.removeItem('user');
    this.ngOnInit();
    this.toastr.info("Account deleted", "ACCOUNT", {
      positionClass: "toast-bottom-center" 
    });
  }
}
