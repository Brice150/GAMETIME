import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MainInputComponent } from "./components/main-input/main-input.component";
import { HeaderComponent } from "./components/header/header.component";

@NgModule({
    declarations: [MainInputComponent, HeaderComponent],
    imports: [
        CommonModule
    ],
    exports: [MainInputComponent, HeaderComponent]
})
export class SharedModule {}