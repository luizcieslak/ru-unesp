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

import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';

//gravatar requires a MD5 hash of user's email address.
import md5 from 'crypto-md5';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = LoginPage; //Change this for setting the rootPage.

  pages: Array<{title: string, component: any, icon: string}>;

  //information in sidemenu header
  user: FirebaseObjectObservable<any>;
  name: string;
  saldo: Number;
  profilePicture: any; //gravatar profile pic


  constructor(public platform: Platform, public statusBar: StatusBar, 
    public splashScreen: SplashScreen, private afAuth: AngularFireAuth,
    public afDB: AngularFireDatabase, public events: Events) {
    this.initializeApp();
    
    //Escutar pelo evento 'login' criado na LoginPage.
    this.events.subscribe('login',(() => { this.onLoginSuccess() })); //Se achou, executar onLoginSuccess()

    this.pages = [
      { title: 'Home', component: HomePage, icon: 'home' },
      { title: 'Refeições', component: RefeicaoListPage, icon: 'restaurant' },
      { title: 'Transferência', component: TransferenciaPage, icon: 'swap' },
      { title: 'Ajuda', component: AjudaPage, icon: 'help' },
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

  /**
   * Pega a imagem do usuário no Gravatar.
   */
  onLoginSuccess(): void{ //get logged user
    this.user = this.afDB.object('/users/'+this.afAuth.auth.currentUser.uid);  
    this.profilePicture = "https://www.gravatar.com/avatar/" + md5(this.afAuth.auth.currentUser.email.toLowerCase(), 'hex');
  }

  /**
   * Desloga o usuário.
   */
  signOut(): void{
    this.afAuth.auth.signOut();
    this.nav.setRoot(LoginPage);
  }
}
