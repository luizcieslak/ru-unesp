import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

//new imports
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  //event fired before page is loaded. Checks if the user is authenticated.
  ionViewCanEnter() {
    return this.afAuth.authState;
  }

  //user from auth
  user: any;
  currentUser: any;

  constructor(public navCtrl: NavController, private afAuth: AngularFireAuth) {

    afAuth.authState.subscribe(user => {
        if (!user) {
          this.user = null;        
          return;
        }
        this.user = user; 
        this.currentUser = afAuth.auth.currentUser;     
      });
  }

}
