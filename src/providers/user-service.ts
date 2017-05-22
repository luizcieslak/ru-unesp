import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

import { AuthService } from '../providers/auth-service';

@Injectable()
export class UserService {

  user: FirebaseObjectObservable<any>;
  data: any;


  constructor(public afDB: AngularFireDatabase, private _auth: AuthService ) {
  }

  /**
   * Function called after AuthService.signUp() to store user's additional info.
   */
  postSignup(uid: string, data): firebase.Promise<any>{
    this.user = this.afDB.object('users/'+uid);
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

  /**
   * @returns true if user is set by setUser().
   */
  get active(): boolean{
    return this.user !== null;
  }

  get saldo(): number{
    return this.active? this.data.saldo : null;
  }

  get veg(): boolean{
    return this.active? this.data.veg : null;
  }

  setUser(uid: string){
    this.user = this.afDB.object('users/'+uid);
    this.user.subscribe( snapshot => {
        this.data = snapshot;
    })
  }

}
