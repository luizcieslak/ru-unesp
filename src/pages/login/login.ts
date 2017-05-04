import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';

import { HomePage } from '../home/home';

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

  constructor(public navCtrl: NavController, public navParams: NavParams, 
    public alertCtrl: AlertController) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  login(): void {
    this.navCtrl.setRoot(HomePage);
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




}
