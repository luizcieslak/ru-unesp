import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase';

import { AuthService } from '../providers/auth-service';

@Injectable()
export class UserService {

  user: FirebaseObjectObservable<any>;

  constructor(public af: AngularFire, private _auth: AuthService ) {
  }

  /**
   * Function called after AuthService.signUp() to store user's additional info.
   */
  postSignup(uid: string, data): firebase.Promise<any>{
    this.user = this.af.database.object('users/'+uid);
    return this.user.set(({
      name: data.name,
      ra: data.ra,
      email: data.email,
      saldo: 0,
      refeicoes: {},
      veg: data.veg,
      created_at: firebase.database.ServerValue.TIMESTAMP,
      updated_at: firebase.database.ServerValue.TIMESTAMP
    }));
  }

}
