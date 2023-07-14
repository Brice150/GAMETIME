import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appRouter } from './app.router';
import { PageModule } from './page/page.module';
import { FlagModule } from './games/flag/flag.module';
import { MotusModule } from './games/motus/motus.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

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
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
