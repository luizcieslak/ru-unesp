import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { EmailValidator } from '../../validators/email';
import { RaValidator } from '../../validators/ra';
import { matchingPasswords } from '../../validators/matching-passwords';

import { LoginPage } from '../login/login';

import { AuthService } from '../../providers/auth-service';
import { UserService } from '../../providers/user-service';


/*
  Generated class for the Signup page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
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
    private formBuilder: FormBuilder, private _auth: AuthService,
    private _user: UserService) {

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

  signUp(): void{
    this.submitAttempt = true;
    if(this.signupForm.valid){
      //create a user using AuthService
      this._auth.signUp(this.signupForm.value.email, this.signupForm.value.password)
        //then, call onSignUpSuccess
        .then(() => this.onSignUpSuccess() )
        //if there is an error, display to the user.
        .catch(error => this.signupError = error.message);

      //go to login page after all.
      //this.navCtrl.push(LoginPage);
    }else{
      console.log("signupForm is not valid.");
    }
  }

  onSignUpSuccess(): void{
    this._user.postSignup(this._auth.uid,this.signupForm.value); //store the additional info (name, RA) into the database
    this.navCtrl.push(LoginPage); //go to login page after all.
  }

}
