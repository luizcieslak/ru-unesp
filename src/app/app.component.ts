import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

//pages going into sidemenu.
import { AjudaPage } from '../pages/ajuda/ajuda';
import { HomePage } from '../pages/home/home';
import { RefeicaoListPage } from '../pages/refeicao-list/refeicao-list';
import { TransferenciaPage } from '../pages/transferencia/transferencia';

import { LoginPage } from '../pages/login/login';

import { AuthService } from '../providers/auth-service';

import { AngularFire, FirebaseObjectObservable } from 'angularfire2';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = LoginPage; //Change this for setting the rootPage.

  pages: Array<{title: string, component: any}>;

  user: FirebaseObjectObservable<any>;
  name: string;
  saldo: Number;

  constructor(public platform: Platform, public statusBar: StatusBar, 
    public splashScreen: SplashScreen, private _auth: AuthService,
    public af: AngularFire, public events: Events) {
    this.initializeApp();
    
    this.events.subscribe('login',(() => { this.onLoginSuccess() }));

    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'Refeições', component: RefeicaoListPage },
      { title: 'Transferência', component: TransferenciaPage },
      { title: 'Ajuda', component: AjudaPage },
    ];

  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  onLoginSuccess(): void{
    //get logged user
    console.log("uid " + this._auth.uid);
    this.user = this.af.database.object('/users/'+this._auth.uid);  
    
    this.user.subscribe( snapshot => {
      this.name = snapshot.name; //name is coming with double quotes
      this.saldo = snapshot.saldo;
    }, error => { console.log('Error',error) });
  }
}
