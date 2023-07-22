import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appRouter } from './app.router';
import { PageModule } from './page/page.module';
import { FlagModule } from './games/letters/flag/flag.module';
import { MotusModule } from './games/letters/motus/motus.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { MeliMeloModule } from './games/letters/melimelo/melimelo.module';
import { PriceModule } from './games/digits/price/price.module';

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
    MeliMeloModule,
    PriceModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
