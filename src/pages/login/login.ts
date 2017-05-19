import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController, Events} from 'ionic-angular';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { EmailValidator } from '../../validators/email';

import { HomePage } from '../home/home';
import { SignupPage } from '../signup/signup';

//new imports
import { AngularFireAuth } from 'angularfire2/auth';

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
    public alertCtrl: AlertController, private formBuilder: FormBuilder,
    public toastCtrl: ToastController, public events: Events, private afAuth: AngularFireAuth) {

      //Create FormBuilder with your inputs and their Validators.
      this.loginForm = this.formBuilder.group({
        email: ['', Validators.compose([ Validators.required, EmailValidator.isValid ]) ],
        password: ['', Validators.required]
      });
    }

  ionViewDidLoad() {
    console.log('LoginPage auth? '+ this.afAuth.authState);
  }

  login(): void {
    this.submitAttempt = true;
    if(this.loginForm.valid){

      this.afAuth.auth.signInWithEmailAndPassword(this.loginForm.value.email,this.loginForm.value.password)
        .then(() => this.onLoginSuccess())  //if login is sucessfull, go to home page
        .catch(error => { this.loginError = error.message }); //else, show the error.
      // this.afAuth.auth.signInWithEmailAndPassword(this.loginForm.value.email,this.loginForm.value.password)
      //   .then(() => this.onLoginSuccess())  //if login is sucessfull, go to home page
      //   .catch(error => { this.loginError = error.message }); //else, show the error.
      

        
    }else{
      console.log("loginForm is not valid.");
    }
  }

  onLoginSuccess(): void{
    this.events.publish('login'); //create an event called 'login'
    this.navCtrl.setRoot(HomePage); //goes to home page.
  }
  
  resetPass(): void{
    let prompt = this.alertCtrl.create({
        title: 'Esqueceu a senha?',
        message: "Digite seu email para podermos resetar sua senha.",
        inputs: [
          {
            name: 'email',
            placeholder: 'Email'
          },
        ],
        buttons: [
          {
            text: 'Cancel',
            handler: data => {
              console.log('Cancel clicked on forgotPassword()');
            }
          },
          {
            text: 'Enviar',
            handler: data => {
              this.afAuth.auth.sendPasswordResetEmail(data.email)
                .then(() => { this.onResetSuccess(data.email); })
                .catch(error => { this.onResetFailure(error.message); });           
            }
          }
        ]
      });
    prompt.present();
  }

  onResetSuccess(email: string): void{
    let toast = this.toastCtrl.create({
      message: 'Email enviado para ' + email,
      duration: 3000
    });
    toast.present();
  }

  onResetFailure(error: string){
    let toast = this.toastCtrl.create({
      message: error,
      duration: 3000
    });
    toast.present();
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

  fastLogin(): void{
    this.afAuth.auth.signInWithEmailAndPassword("cieslakluiz@gmail.com","123456")
      .then(() => this.onLoginSuccess())  //if login is sucessfull, go to home page
      .catch(error => { this.loginError = error.message }); //else, show the error.
  }

  vegLogin(): void{
    this.afAuth.auth.signInWithEmailAndPassword("luiz_cieslak@hotmail.com","luizveg")
      .then(() => this.onLoginSuccess())  //if login is sucessfull, go to home page
      .catch(error => { this.loginError = error.message }); //else, show the error.
  }




}
