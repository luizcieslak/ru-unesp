import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase';

//importing angular auth items
import { AuthProviders, AngularFireAuth, FirebaseAuthState, AuthMethods } from 'angularfire2';

@Injectable()
export class AuthService {

  private authState: FirebaseAuthState;

  constructor(public auth$: AngularFireAuth) {
    this.authState = auth$.getAuth();

    auth$.subscribe((state: FirebaseAuthState) => {
      this.authState = state;
    });
  }

  get autenthicated(): boolean{
    return this.authState !== null;
  }

  get uid(): string{
    return this.authState !== null? this.authState.auth.uid : null;
  }

  // signInWithFacebook(): firebase.Promise<FirebaseAuthState>{
  //   return this.auth$.login({
  //     provider: AuthProviders.Facebook,
  //     method: AuthMethods.Popup
  //   })
  // }

  signInWithEmail(email: string, password: string): firebase.Promise<FirebaseAuthState>{
    return this.auth$.login({
      email: email,
      password: password
    },{
      provider: AuthProviders.Password,
      method: AuthMethods.Password
    })
  }

  signOut(): void{
    this.auth$.logout();
  }

  displayEmail(): string{
    if(this.authState != null){
      return this.authState.auth.email;
    }else{
      return null;
    }
  }
  
  signUp(email: string, password: string): firebase.Promise<FirebaseAuthState>{
    return this.auth$.createUser({
      email: email,
      password: password
    });
  }

  resetPassword(email: string): firebase.Promise<FirebaseAuthState>{
    return firebase.auth().sendPasswordResetEmail(email);
  }

}
