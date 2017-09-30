import { Injectable } from '@angular/core';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

//importing angular auth items
import { AngularFireAuth } from 'angularfire2/auth';

@Injectable()
export class AuthService {

  constructor(private afAuth: AngularFireAuth) {
    
  }

  /**
   * @returns true if user is authenticated.
   */
  autenthicated(): boolean {
    return this.afAuth.authState !== null;
  }

  async user(): Promise<firebase.User> {
    return await this.afAuth.authState.take(1).toPromise();
  }
  
  /**
   * @returns user's uid.
   */
  async uid(): Promise<string>{
    const user:firebase.User = await this.user();
    return user.uid;
  }

  async email(): Promise<string>{
    const user:firebase.User = await this.user();
    return user.email;
  }

  /**
   * Persist user's login by checking if there is someting in authState 
   * or if there is a user token store in native storage.
   */
  persistLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afAuth.authState.subscribe(auth => {
        if (auth !== null) {
          resolve('user already logged in');
        }
        else {
          reject('no user found.')
        }
      })
    })
  }

  /**
   * Sign in into Firebase using Email.
   * @returns Firebase Promise.
   */
  signInWithEmail(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {

      //Sign in with email
      this.afAuth.auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          resolve(true);
        })
        .catch(reason => reject(reason));
    })

  }

  signOut(): firebase.Promise<any> {
    return this.afAuth.auth.signOut();
  }

  /**
   * Sign up into Firebase using Email.
   * @returns Firebase Promise.
   */
  signUp(email: string, password: string): firebase.Promise<any> {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password);
  }

  /**
   * Reset user's password using Firebase mail system.
   * @returns Firebase Promise.
   */
  resetPassword(email: string): firebase.Promise<any> {
    return this.afAuth.auth.sendPasswordResetEmail(email);
  }

}
