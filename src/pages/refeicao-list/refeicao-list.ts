import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Loading } from 'ionic-angular';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { RefeicaoDetailPage } from '../refeicao-detail/refeicao-detail';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

/*
  Generated class for the RefeicaoList page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-refeicao-list',
  templateUrl: 'refeicao-list.html'
})
export class RefeicaoListPage {

  refeicoes: FirebaseListObservable<any>; //refeicoes array.
  loading: Loading;                   //loading component.

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public loadingCtrl: LoadingController, public afDB: AngularFireDatabase) {

      //create present the loading
      this.loading = this.loadingCtrl.create();
      this.loading.present();
      
      //get the song array in a async operation.
      this.refeicoes = afDB.list('/refeicoes',{
        query:{
          orderByChild: 'timestamp'
        }
      });

      //subscribe to end loading after data is loaded.
      this.refeicoes.subscribe( snapshot => {
        this.loading.dismiss();
      });

    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoListPage');
  }

  gotoDetails(refeicao):void {
    this.navCtrl.push(RefeicaoDetailPage,{
      refeicao: refeicao
    })
  }

}
