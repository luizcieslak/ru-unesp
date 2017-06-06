import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Loading } from 'ionic-angular';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { RefeicaoDetailPage } from '../refeicao-detail/refeicao-detail';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

import { TimeService } from '../../providers/time-service';
import { RefeicaoService } from '../../providers/refeicao-service';

@Component({
  selector: 'page-refeicao-list',
  templateUrl: 'refeicao-list.html'
})
export class RefeicaoListPage {

  refeicoes: FirebaseListObservable<any>; //refeicoes array.
  loading: Loading;                       //loading component.

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public loadingCtrl: LoadingController, public afDB: AngularFireDatabase,
    public time: TimeService, public _refeicao: RefeicaoService) {

      //create present the loading
      this.loading = this.loadingCtrl.create();
      this.loading.present();
      
      //Pegar a lista de refeições de maneira assíncrona
      this.refeicoes = this._refeicao.nextRefeicoes();

      //Assim que os dados forem carregados, fechar o loading component.
      this.refeicoes.subscribe( snapshots => {
        snapshots.forEach(snapshot => {
          snapshot.isAllowed = this.time.isAllowed(snapshot.timestamp);
          console.log(moment(snapshot.timestamp).format('LLLL'), snapshot.isAllowed);
        });
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
