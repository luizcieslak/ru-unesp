import { Component } from '@angular/core';
import { NavController, LoadingController, Loading, ActionSheetController } from 'ionic-angular';

import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  loading: Loading; //loading component.
  shownGroup = null; //Variável para a accordion list.

  user: FirebaseObjectObservable<any>;
  refeicoesKey: Array<any>;
  refeicoes: Array<any> = [];

  constructor(public navCtrl: NavController, private afAuth: AngularFireAuth,
  public afDB: AngularFireDatabase, public loadingCtrl: LoadingController,
  public actionSheetCtrl: ActionSheetController) {

    //create and present the loading
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    
    this.user = this.afDB.object('/users/'+this.afAuth.auth.currentUser.uid); //pegar o usuário
    this.user.subscribe( user =>{ //depois de carregado, 
      if(user.refeicoes){
        this.refeicoesKey = Object.keys(user.refeicoes); //pegar as chaves da árvore refeicoes, as quais foram compradas pelo usuário.
        this.refeicoesKey.forEach(key => { //então, para cada chave
          let refeicaoObservable = this.afDB.object('/refeicoes/'+ key); //pegar outras informações da refeição
          refeicaoObservable.subscribe(refeicao => {
            this.refeicoes.push(refeicao); //e dar um push para o array.
          })
        })
      }

      this.loading.dismiss(); //Descartar o Loading component após tudo ser carregado.
    })

    
  }

  /**
   * Alterna o estado de um item da accordion list.
   * @param {Number} group O index do item da lista
  */
  toggleGroup(group) {
      if (this.isGroupShown(group)) {
          this.shownGroup = null;
      } else {
          this.shownGroup = group;
      }
  }

  /**
   * Checa se o grupo recebido está ativado.
   * @param {Number} group O index do item da lista.
  */
  isGroupShown(group): boolean {
      return this.shownGroup === group;
  };

  /**
   * Remove o usuário da refeição, reembolsando-o.
   * @param {any} refeicao A refeição selecionada.
   */
  remove(refeicao: any){

  }

  /**
   * Transfere a compra do usuário para outra refeição.
   * @param {any} refeicao A refeição selecionada.
   */
  transfer(refeicao: any){

  }



}
