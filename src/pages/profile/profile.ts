import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { UserService } from '../../providers/user-service';

import { IonicPage } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage {

  //information in sidemenu header
  user: Promise<any>;
  profilePicture: any; //gravatar profile pic
  history: Promise<any>;

  constructor(public navCtrl: NavController, private _user: UserService) {
    //Retrieve data
    this.user = this._user.userPromise();
    this.history = this._user.lastFiveHistory();

    this._user.getProfilePic()
      .then(link => {
        this.profilePicture = link;
      })
      .catch(reason => console.log(reason));
  }

  gotoHistory(): void {
    this.navCtrl.push('HistoryPage');
  }

}
