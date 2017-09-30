import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';

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

//Angular http
import { HttpModule } from '@angular/http';

//Parallax Header
import { ParallaxHeader } from '../components/parallax-header/parallax-header';

import { FCM } from '@ionic-native/fcm';

import { PipesModule } from '../pipes/pipes.module';
import { ConnectivityService } from '../providers/connectivity-service';

import { Network } from '@ionic-native/network';

@NgModule({
  declarations: [
    MyApp,
    ParallaxHeader
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(FirebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    HttpModule,
    PipesModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    RefeicaoService,
    UserService,
    AuthService,
    TimeService,
    FCM,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Network,
    ConnectivityService
  ]
})
export class AppModule { }
