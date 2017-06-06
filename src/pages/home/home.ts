import { Component } from '@angular/core';
import { NavController, LoadingController, Loading, AlertController } from 'ionic-angular';

import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

import { TimeService } from '../../providers/time-service';
import { RefeicaoService } from '../../providers/refeicao-service';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

import * as Rx from 'rxjs/Rx';

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

  queueKey: Array<any>;
  queueRefeicoes: Array<any> = [];

  constructor(public navCtrl: NavController, private afAuth: AngularFireAuth,
  public afDB: AngularFireDatabase, public loadingCtrl: LoadingController,
  public alertCtrl: AlertController, public time: TimeService, public refeicao: RefeicaoService) {

    //create and present the loading
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    
    //Observable do Usuário
    this.user = this.afDB.object('/users/'+this.afAuth.auth.currentUser.uid);
    this.user.subscribe( user =>{
      if(user.refeicoes){
        //pegar as chaves da árvore refeicoes, as quais foram compradas pelo usuário.
        this.refeicoesKey = Object.keys(user.refeicoes); 
        //Resetar o array caso haja alguma atualização.
        this.refeicoes = [];
        this.refeicoesKey.forEach(key => { //então, para cada chave
          let refeicaoObservable = this.afDB.object('/refeicoes/'+ key); //pegar outras informações da refeição
          refeicaoObservable.subscribe(refeicao => {
            this.refeicoes.push(refeicao); //e dar um push para o array.
          })
        })

        //repetir o mesmo processo para as refeições na lista de espera
        this.queueKey = Object.keys(user.queue);
        this.queueKey.forEach(key => {
          let refeicaoObservable = this.afDB.object('/refeicoes/'+ key);
          refeicaoObservable.subscribe(refeicao => {
            this.queueRefeicoes.push(refeicao);
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

  confirmRemove(refeicao: any): void{
    let confirm = this.alertCtrl.create({
      title: 'Confirmar Desistência',
      message: 'Tem certeza que deseja desistir desta refeição? Seu saldo será reembolsado.',
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Sim',
          handler: () => {
            this.remove(refeicao);
          }
        }
      ]
    });
    confirm.present();
  }

  /**
   * Remove o usuário da refeição, reembolsando-o.
   * @param {any} refeicao A refeição selecionada.
   */
  remove(refeicao: any){
    console.log('refeicao key', refeicao.$key);
    //verificar se está dentro do tempo
    if(this.time.isAllowed(refeicao.timestamp)){
      //Remover o usuário da refeição
      const refeicaoUsers = this.afDB.list('/refeicoes/'+ refeicao.$key +'/users');

      //Remover a refeição do usuário
      const userRefeicoes = this.afDB.list('/users/'+this.afAuth.auth.currentUser.uid+'/refeicoes/');

      //Adicionar uma vaga na refeicao
      const vagas = firebase.database().ref('/refeicoes/'+ refeicao.$key +'/vagas').transaction(vagas => vagas + 1);

      refeicaoUsers.subscribe(_ => {
        refeicaoUsers.remove(this.afAuth.auth.currentUser.uid);

        userRefeicoes.subscribe(_ => {
          userRefeicoes.remove(refeicao.$key);
          vagas
            .then(_ => console.log('remove sucessfull'))
            .catch(error => console.log('error in remove()',error));
        });

      });

      
    }else{
      let alert = this.alertCtrl.create({
        title: 'Tempo Esgotado',
        subTitle: 'O tempo para realizar esta operação está esgotado.',
        buttons: ['OK']
      });
      alert.present();
    }
  }

  /**
   * Janela de confirmação da transferência de refeições, que mostra uma lista das próximas refeições
   * @param refeicao refeição escolhida no DOM.
   */
  confirmTransfer(refeicao: any): void{
    let choose = this.alertCtrl.create();
    choose.setTitle('Próximas refeições');
    choose.setSubTitle('Escolha uma data para a transferência');

    choose.addButton('Cancel');
    choose.addButton({
      text: 'OK',
      handler: data => {
        this.transfer(refeicao, data)
      }
    });

    const observable = this.refeicao.nextRefeicoes();
    observable.subscribe( refeicoes => {
      refeicoes.forEach( refeicao => {
        choose.addInput({
          type: 'radio',
          label: moment(refeicao.timestamp).calendar(),
          value: refeicao.$key,
        });
      })
      choose.present();
    })
  }

  /**
   * Tenta transferir a vaga do usuário entre uma refeição e outra.
   * @param {any} refeicao A refeição de origem.
   * @param {string} dest A chave da refeição de destino.
   */
  transfer(refeicao: any, dest: string){

  }

  /**
   * Remove o usuário da fila, reembolsando-o.
   * @param {any} refeicao A refeição selecionada.
   */
  removeQueue(refeicao: any){

  }


}
