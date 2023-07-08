import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MainInputComponent } from "./components/main-input/main-input.component";
import { HeaderComponent } from "./components/header/header.component";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { ConfirmationDialogComponent } from "./components/confirmation-dialog/confirmation-dialog.component";
import { LearnDialogComponent } from "./components/learn-dialog/learn-dialog.component";

@NgModule({
    declarations: [MainInputComponent, HeaderComponent, ConfirmationDialogComponent, LearnDialogComponent],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatDialogModule
    ],
    exports: [MainInputComponent, HeaderComponent, ConfirmationDialogComponent, LearnDialogComponent]
})
export class SharedModule {}