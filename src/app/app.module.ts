import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';

//app pages
import { AjudaPage } from '../pages/ajuda/ajuda';
import { HomePage } from '../pages/home/home';
import { RefeicaoListPage } from '../pages/refeicao-list/refeicao-list';
import { RefeicaoDetailPage } from '../pages/refeicao-detail/refeicao-detail';
import { TransferenciaPage } from '../pages/transferencia/transferencia';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

//firebase
import { FirebaseConfig } from "../firebase-config";
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

//providers
import { AuthService } from "../providers/auth-service";
import { UserService } from "../providers/user-service";
import { RefeicaoService } from "../providers/refeicao-service";
import { TimeService } from '../providers/time-service';

//using moment as pipe
import { FormatPipe } from '../pipes/format-pipe';
import { FromNowPipe } from '../pipes/from-now-pipe';
import { TitleCasePipe } from '../pipes/title-case-pipe';

//Angular http
import { HttpModule } from '@angular/http';

@NgModule({
  declarations: [
    MyApp,
    AjudaPage,
    HomePage,
    RefeicaoListPage,
    RefeicaoDetailPage,
    TransferenciaPage,
    LoginPage,
    SignupPage,
    FormatPipe,
    TitleCasePipe,
    FromNowPipe
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(FirebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AjudaPage,
    HomePage,
    RefeicaoListPage,
    RefeicaoDetailPage,
    TransferenciaPage,
    LoginPage,
    SignupPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    RefeicaoService,
    UserService,
    AuthService,
    TimeService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
