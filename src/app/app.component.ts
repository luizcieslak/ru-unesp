import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { UserService } from '../providers/user-service';
import { AuthService } from '../providers/auth-service';

import { FCM } from '@ionic-native/fcm';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: string = 'LoginPage'; //Change this for setting the rootPage.

  pages: Array<{ title: string, component: string, icon: string }>;

  //information in sidemenu header
  user: Promise<any>;
  name: string;
  saldo: Number;
  profilePicture: any; //gravatar profile pic


  constructor(public platform: Platform, public statusBar: StatusBar,
    public splashScreen: SplashScreen, public _user: UserService,
    public events: Events, private _auth: AuthService,
    private fcm: FCM) {
    this.initializeApp();

    //Escutar pelo evento 'login' criado na LoginPage.
    this.events.subscribe('login', (() => { this.onLoginSuccess() })); //Se achou, executar onLoginSuccess()

    this.pages = [
      { title: 'Home', component: 'HomePage', icon: 'home' },
      { title: 'Refeições', component: 'RefeicaoListPage', icon: 'restaurant' },
      { title: 'Ajuda', component: 'AjudaPage', icon: 'help' },
    ];

  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.pushSetup();
    });
  }

  pushSetup(): void {
    if (typeof this.fcm != 'undefined') {

      this.fcm.getToken().then(token => {
        console.log('getToken()',token);
        //Registrar o token
        this._user.registerNotificationToken(token)
          .then(_ => console.log('token registered on db.'))
          .catch(reason => console.log('Error when registering token on db.',reason));
      })

      this.fcm.onNotification().subscribe(data => {
        if (data.wasTapped) {
          console.log("Received in background", data);
        } else {
          console.log("Received in foreground", data);
        };
      })

      this.fcm.onTokenRefresh().subscribe(token => {
        console.log('onTokenRefresh',token);
        //Registrar o token
        this._user.registerNotificationToken(token)
          .then(_ => console.log('token registered on db.'))
          .catch(reason => console.log('Error when registering token on db.',reason));
      })

    }
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  /**
   * Pega a imagem do usuário no Gravatar.
   */
  onLoginSuccess(): void { //get logged user
    this.user = this._user.userPromise();
    this._user.getProfilePic()
      .then(link =>{
        this.profilePicture = link;
      })
      .catch(reason => console.log(reason));
  }

  /**
   * Desloga o usuário.
   */
  signOut(): void {
    this._auth.signOut()
      .then(_ => this.nav.setRoot('LoginPage'))
      .catch(reason => console.log('error in AppComponent#signout()', reason));
  }

  /**
   * Vai para a Profile Page
   */
  profilePage() {
    this.nav.setRoot('ProfilePage');
  }
}
