import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { UserService } from '../../providers/user-service';

import { IonicPage } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage {

  //information in sidemenu header
  user: FirebaseObjectObservable<any>;
  profilePicture: any; //gravatar profile pic
  history: FirebaseListObservable<any>;

  constructor(public navCtrl: NavController, private _user: UserService) {
    //Retrieve data
    this.user = this._user.userObservable();
    this.profilePicture = this._user.gravatarLink();
    this.history = this._user.lastFiveHistory();
  }

  gotoHistory(): void {
    this.navCtrl.push('HistoryPage');
  }

}
