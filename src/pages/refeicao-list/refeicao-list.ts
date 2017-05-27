import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Loading } from 'ionic-angular';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { RefeicaoDetailPage } from '../refeicao-detail/refeicao-detail';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

@Component({
  selector: 'page-refeicao-list',
  templateUrl: 'refeicao-list.html'
})
export class RefeicaoListPage {

  refeicoes: FirebaseListObservable<any>; //refeicoes array.
  loading: Loading;                       //loading component.

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public loadingCtrl: LoadingController, public afDB: AngularFireDatabase) {

      //create present the loading
      this.loading = this.loadingCtrl.create();
      this.loading.present();
      
      //Pegar a lista de refeições de maneira assíncrona
      this.refeicoes = afDB.list('/refeicoes',{
        query:{
          orderByChild: 'timestamp'
        }
      });

      //Assim que os dados forem carregados, fechgar o loading component.
      this.refeicoes.subscribe( snapshot => {
        this.loading.dismiss();
      });

    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoListPage');
  }

  /**
   * Ir para a refeicao-detail page com a refeição escolhida.
   * @param {any} refeicao A refeição escolhida
   */
  gotoDetails(refeicao: any): void {
    this.navCtrl.push(RefeicaoDetailPage,{
      refeicao: refeicao
    })
  }

}
