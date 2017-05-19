import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { AngularFire, FirebaseObjectObservable } from 'angularfire2';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

/*
  Generated class for the RefeicaoDetail page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-refeicao-detail',
  templateUrl: 'refeicao-detail.html'
})
export class RefeicaoDetailPage {

  refeicao: any; //refeicao sent via NavParams
  timeLeft: string; //time left until the end of reservation.

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.refeicao = this.navParams.get('refeicao');

    //moment tests
    this.timeLeft = moment(this.refeicao.timestamp).fromNow();
    console.log(moment().to(moment('20170518T1950'))); //comparing time
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoDetailPage');
  }

}
