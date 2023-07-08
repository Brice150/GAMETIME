import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appRouter } from './app.router';
import { PageModule } from './page/page.module';
import { FlagModule } from './games/flag/flag.module';
import { MotusModule } from './games/motus/motus.module';
import { MultiModule } from './games/multi/multi.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    appRouter,
    PageModule,
    MotusModule,
    FlagModule,
    MultiModule,
    BrowserAnimationsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
