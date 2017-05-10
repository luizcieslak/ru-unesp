import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AuthService } from '../../providers/auth-service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  //event fired before page is loaded. Checks if the user is authenticated.
  ionViewCanEnter() {
    return this._auth.autenthicated;
  }

  constructor(public navCtrl: NavController, private _auth: AuthService) {

  }

}
