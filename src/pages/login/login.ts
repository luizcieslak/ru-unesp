import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { EmailValidator } from '../../validators/email';

import { HomePage } from '../home/home';
import { SignupPage } from '../signup/signup';

/*
  Generated class for the Login page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  //A FormGroup is a collection of FormControls, which is inputed in html.
  private loginForm: FormGroup;

  //Boolean variable that stores if user tries to submit the form.
  private submitAttempt: boolean;

  //String variable that stores the server error in a failed signin.
  private loginError: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, 
    public alertCtrl: AlertController, private formBuilder: FormBuilder) {

      //Create FormBuilder with your inputs and their Validators.
      this.loginForm = this.formBuilder.group({
        email: ['', Validators.compose([ Validators.required, EmailValidator.isValid ]) ],
        password: ['', Validators.required]
      });

    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  login(): void {
    this.submitAttempt = true;
    if(this.loginForm.valid){
      //form is valid, go to home page
      this.navCtrl.setRoot(HomePage);
    }else{
      console.log("loginForm is not valid.");
    }
  }

  recoverPass(): void{
  }

  help(): void{
    let help = this.alertCtrl.create({
      title: 'Ajuda',
      subTitle: 'AJUDA LUCIANO',
      buttons: ['OK']
    });
    help.present();
  }

  signup(): void{
    this.navCtrl.push(SignupPage);
  }




}
