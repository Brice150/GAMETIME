import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AppComponent } from './app.component';
import { appRouter } from './app.router';
import { CalculModule } from './games/digits/calcul/calcul.module';
import { PriceModule } from './games/digits/price/price.module';
import { FlagModule } from './games/letters/flag/flag.module';
import { MeliMeloModule } from './games/letters/melimelo/melimelo.module';
import { MotusModule } from './games/letters/motus/motus.module';
import { PageModule } from './page/page.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    appRouter,
    PageModule,
    MotusModule,
    FlagModule,
    MeliMeloModule,
    PriceModule,
    CalculModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
