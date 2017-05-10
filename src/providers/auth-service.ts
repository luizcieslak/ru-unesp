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

  /**
   * @returns true if user is authenticated.
   */
  get autenthicated(): boolean{
    return this.authState !== null;
  }

  /**
   * @returns user's uid.
   */
  get uid(): string{
    return this.authState !== null? this.authState.auth.uid : null;
  }

  // signInWithFacebook(): firebase.Promise<FirebaseAuthState>{
  //   return this.auth$.login({
  //     provider: AuthProviders.Facebook,
  //     method: AuthMethods.Popup
  //   })
  // }

  /**
   * Sign in into Firebase using Email.
   * @returns Firebase Promise.
   */
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
  
  /**
   * Sign up into Firebase using Email.
   * @returns Firebase Promise.
   */
  signUp(email: string, password: string): firebase.Promise<FirebaseAuthState>{
    return this.auth$.createUser({
      email: email,
      password: password
    });
  }

  /**
   * Reset user's password using Firebase mail system.
   * @returns Firebase Promise.
   */
  resetPassword(email: string): firebase.Promise<FirebaseAuthState>{
    return firebase.auth().sendPasswordResetEmail(email);
  }

}
