import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { EmailValidator } from '../../validators/email';
import { RaValidator } from '../../validators/ra';
import { matchingPasswords } from '../../validators/matching-passwords';

import { LoginPage } from '../login/login';

import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html'
})
export class SignupPage {
  
  //A FormGroup is a collection of FormControls, which is inputed in html.
  private signupForm: FormGroup;

  //Boolean variable that stores if user tries to submit the form.
  private submitAttempt: boolean;

  //String variable that stores the server error in a failed signin.
  private signupError: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, 
    private formBuilder: FormBuilder, private afAuth: AngularFireAuth,
    public afDB: AngularFireDatabase) {

      //Create FormBuilder with your inputs and their Validators.
      this.signupForm = this.formBuilder.group({
        email: ['', Validators.compose([ Validators.required, EmailValidator.isValid ]) ],
        name: ['', Validators.compose([Validators.required, Validators.maxLength(30)])],
        ra: ['', Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(9), RaValidator.isValid,])],
        password: ['', Validators.compose([Validators.required, Validators.minLength(6)])],
        confirmPass: ['', Validators.required],
        veg: ['false', Validators.required]
      },{validator: matchingPasswords('password','confirmPass')});

    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SignupPage');
  }

  /**
   * Cria uma conta com email e senha caso o formulário for válido.
   */
  signUp(): void{
    this.submitAttempt = true;
    if(this.signupForm.valid){
      //create a user using AuthService
      this.afAuth.auth.createUserWithEmailAndPassword(this.signupForm.value.email, this.signupForm.value.password)
        //then, call onSignUpSuccess
        .then(() => this.onSignUpSuccess() )
        //if there is an error, display to the user.
        .catch(error => this.signupError = error.message);

      //go to login page after all.
      //this.navCtrl.push(LoginPage);
    }else{
      console.log('signupForm is not valid.');
    }
  }

  /**
   * Executa funções após o signUp().
   */
  onSignUpSuccess(): void{
    this.postSignup(this.afAuth.auth.currentUser.uid,this.signupForm.value) //store the additional info (name, RA) into the database
      .then( () => this.onPostSignUpSuccess() )
      .catch( error => { console.log('error on postSignup()',error.message); });
    
  }

  /**
   * Armazena os outros dados do usuário na árvore /users/
   */
  postSignup(uid: string, data): firebase.Promise<any>{
    let user: FirebaseObjectObservable<any>;
    user = this.afDB.object(`users/${uid}`);
    return user.set(({
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
   * Desloga o usuário após a criação (O login após signup é padrão do Firebase).
   */
  onPostSignUpSuccess(): void{
    console.log('onPostSignUpSuccess()');
    this.afAuth.auth.signOut();
    this.navCtrl.push(LoginPage);
  }

}
