import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController, Events } from 'ionic-angular';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { EmailValidator } from '../../validators/email';

import { HomePage } from '../home/home';
import { SignupPage } from '../signup/signup';

//new imports
import { AngularFireAuth } from 'angularfire2/auth';

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
      email: ['', Validators.compose([Validators.required, EmailValidator.isValid])],
      password: ['', Validators.required]
    });


    //TODO: Persistir login do usuário
    afAuth.authState.subscribe(auth => {
      auth === null ? console.log('no auth') : this.onLoginSuccess();
    })

  }

  /**
   * Fazer o login do usuário se o formulário for válido.
   */
  login(): void {
    this.submitAttempt = true;
    if (this.loginForm.valid) {

      this.afAuth.auth.signInWithEmailAndPassword(this.loginForm.value.email, this.loginForm.value.password)
        .then(() => this.onLoginSuccess())  //  Se o login deu certo, executar onLoginSuccess
        .catch(error => { this.loginError = error.message }); //se não, mostre o erro. 

    } else {
      console.log("loginForm is not valid.");
    }
  }

  /**
   * Executa as funções após o login.
   */
  onLoginSuccess(): void {
    this.events.publish('login'); //Criar um evento chamado 'login' para o sidemenu.
    this.navCtrl.setRoot(HomePage); //Ir para HomePage.
  }

  /**
   * Envia um email para resetar a senha do usuário.
   */
  resetPass(): void {
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

  /**
   * Mostra um Toast caso a resetPass() tenha sido sucedida.
   */
  onResetSuccess(email: string): void {
    let toast = this.toastCtrl.create({
      message: 'Email enviado para ' + email,
      duration: 3000
    });
    toast.present();
  }

  /**
   * Mostra um Toast caso a resetPass() tenha falhado.
   */
  onResetFailure(error: string) {
    let toast = this.toastCtrl.create({
      message: error,
      duration: 3000
    });
    toast.present();
  }

  /**
   * Alert que mostra ajuda antes do login.
   */
  help(): void {
    let help = this.alertCtrl.create({
      title: 'Ajuda',
      subTitle: 'Este aplicativo é o aplicativo para compra de refeições do RU da UNESP Bauru. Para entrar, digite seu email e senha previamente cadastrados. Caso não tenha cadastro, vá ate a DTAd do campus para realizar o cadastro.',
      buttons: ['OK']
    });
    help.present();
  }

  /**
   * Vai para a página de signup
   */
  signup(): void {
    this.navCtrl.push(SignupPage);
  }

  //função para o desenvolvimento
  fastLogin(): void {
    this.afAuth.auth.signInWithEmailAndPassword("cieslakluiz@gmail.com", "123456")
      .then(() => this.onLoginSuccess())  //if login is sucessfull, go to home page
      .catch(error => { this.loginError = error.message }); //else, show the error.
  }

  //função para o desenvolvimento
  vegLogin(): void {
    this.afAuth.auth.signInWithEmailAndPassword("luiz_cieslak@hotmail.com", "luizveg")
      .then(() => this.onLoginSuccess())  //if login is sucessfull, go to home page
      .catch(error => { this.loginError = error.message }); //else, show the error.
  }

}
