import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

//new imports
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  //event fired before page is loaded. Checks if the user is authenticated.
  ionViewCanEnter() {
    return this.auth !== null;
  }

  //user from auth
  auth: any;
  user: any;

  constructor(public navCtrl: NavController, private afAuth: AngularFireAuth,
  public afDB: AngularFireDatabase) {

    afAuth.authState.subscribe(auth => {
        if (!auth) {
          this.auth = null;        
          return;
        }
        this.auth = auth;    
    });
    
    this.user = this.afDB.object('/users/'+this.afAuth.auth.currentUser.uid);  
    
  }

}
