import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MainInputComponent } from "./components/main-input/main-input.component";
import { HeaderComponent } from "./components/header/header.component";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

@NgModule({
    declarations: [MainInputComponent, HeaderComponent],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule
    ],
    exports: [MainInputComponent, HeaderComponent]
})
export class SharedModule {}