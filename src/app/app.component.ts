import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

//pages going into sidemenu.
import { AjudaPage } from '../pages/ajuda/ajuda';
import { HomePage } from '../pages/home/home';
import { RefeicaoListPage } from '../pages/refeicao-list/refeicao-list';
import { LoginPage } from '../pages/login/login';
import { ProfilePage } from '../pages/profile/profile';

import { FirebaseObjectObservable } from 'angularfire2/database';
import { UserService } from '../providers/user-service';
import { AuthService } from '../providers/auth-service';

import { Push, PushObject, PushOptions } from '@ionic-native/push';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = LoginPage; //Change this for setting the rootPage.

  pages: Array<{ title: string, component: any, icon: string }>;

  //information in sidemenu header
  user: FirebaseObjectObservable<any>;
  name: string;
  saldo: Number;
  profilePicture: any; //gravatar profile pic


  constructor(public platform: Platform, public statusBar: StatusBar,
    public splashScreen: SplashScreen, public _user: UserService,
    public events: Events, private _auth: AuthService,
    public push: Push) {
    this.initializeApp();

    //Escutar pelo evento 'login' criado na LoginPage.
    this.events.subscribe('login', (() => { this.onLoginSuccess() })); //Se achou, executar onLoginSuccess()

    this.pages = [
      { title: 'Home', component: HomePage, icon: 'home' },
      { title: 'Refeições', component: RefeicaoListPage, icon: 'restaurant' },
      { title: 'Ajuda', component: AjudaPage, icon: 'help' },
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

    // to check if we have permission
    this.push.hasPermission()
      .then((res: any) => {

        if (res.isEnabled) {
          console.log('We have permission to send push notifications');
        } else {
          console.log('We do not have permission to send push notifications');
        }

      });

    // to initialize push notifications
    const options: PushOptions = {
      android: {
        senderID: '103998911185'
      },
      ios: {
        alert: 'true',
        badge: true,
        sound: 'false'
      },
      windows: {},
      browser: {
        pushServiceURL: 'http://push.api.phonegap.com/v1/push'
      }
    };

    const pushObject: PushObject = this.push.init(options);

    pushObject.on('notification').subscribe((notification: any) => console.log('Received a notification',notification));

    pushObject.on('registration').subscribe((registration: any) => console.log('Device registered',registration));

    pushObject.on('error').subscribe(error => console.log('Error with Push plugin',error));

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
    this.user = this._user.userObservable();
    this.profilePicture = this._user.gravatarLink();
  }

  /**
   * Desloga o usuário.
   */
  signOut(): void {
    this._auth.signOut()
      .then(_ => this.nav.setRoot(LoginPage))
      .catch(reason => console.log('error in AppComponent#signout()', reason));
  }

  /**
   * Vai para a Profile Page
   */
  profilePage() {
    this.nav.setRoot(ProfilePage);
  }
}
