import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { WordInputComponent } from "./components/word-input/word-input.component";
import { HeaderComponent } from "./components/header/header.component";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { ConfirmationDialogComponent } from "./components/confirmation-dialog/confirmation-dialog.component";
import { LearnDialogComponent } from "./components/learn-dialog/learn-dialog.component";
import { MatExpansionModule } from '@angular/material/expansion';
import { NumberInputComponent } from "./components/number-input/number-input.component";

@NgModule({
    declarations: [WordInputComponent, NumberInputComponent, HeaderComponent, ConfirmationDialogComponent, LearnDialogComponent],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatDialogModule,
        MatExpansionModule
    ],
    exports: [WordInputComponent, NumberInputComponent, HeaderComponent, ConfirmationDialogComponent, LearnDialogComponent]
})
export class SharedModule {}