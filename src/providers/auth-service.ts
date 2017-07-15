import { Injectable } from '@angular/core';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

//importing angular auth items
import { AngularFireAuth } from 'angularfire2/auth';

@Injectable()
export class AuthService {

  displayName: string;

  constructor(private afAuth: AngularFireAuth) {
    afAuth.authState.subscribe(user => {
      if (!user) {
        this.displayName = null;        
        return;
      }
      this.displayName = user.displayName;      
    });
  }

  /**
   * @returns true if user is authenticated.
   */
  get autenthicated(): boolean{
    return this.afAuth.authState !== null;
  }

  /**
   * @returns user's uid.
   */
  get uid(): string{
    return this.afAuth.authState !== null? this.afAuth.auth.currentUser.uid : null;
  }

  /**
   * @returns user's email.
   */
  get email(): string{
    return this.afAuth.authState !== null? this.afAuth.auth.currentUser.email : null;
  }

  /**
   * Sign in into Firebase using Email.
   * @returns Firebase Promise.
   */
  signInWithEmail(email: string, password: string): firebase.Promise<any>{
    return this.afAuth.auth.signInWithEmailAndPassword(email,password);
  }

  signOut(): firebase.Promise<any>{
    return this.afAuth.auth.signOut();
  }
  
  /**
   * Sign up into Firebase using Email.
   * @returns Firebase Promise.
   */
  signUp(email: string, password: string): firebase.Promise<any>{
    return this.afAuth.auth.createUserWithEmailAndPassword(email,password);
  }

  /**
   * Reset user's password using Firebase mail system.
   * @returns Firebase Promise.
   */
  resetPassword(email: string): firebase.Promise<any>{
    return this.afAuth.auth.sendPasswordResetEmail(email);
  }

}
