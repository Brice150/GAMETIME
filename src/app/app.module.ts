import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appRouter } from './app.router';
import { PageModule } from './page/page.module';
import { HangmanModule } from './games/hangman/hangman.module';
import { FlagModule } from './games/flag/flag.module';
import { DefinitionModule } from './games/definition/definition.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    appRouter,
    PageModule,
    HangmanModule,
    FlagModule,
    DefinitionModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
