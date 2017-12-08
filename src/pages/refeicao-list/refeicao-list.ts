import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Loading, AlertController } from 'ionic-angular';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { Observable } from "rxjs/Rx";

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

import { TimeService } from '../../providers/time-service';
import { RefeicaoService } from '../../providers/refeicao-service';
import { UserService } from '../../providers/user-service';

import { FCM } from '@ionic-native/fcm';

import { IonicPage } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-refeicao-list',
  templateUrl: 'refeicao-list.html'
})
export class RefeicaoListPage {

  // Flags para a paginação - não está em uso
  //canGoForward: boolean;
  //canGoBack: boolean = false;

  refeicoes: FirebaseListObservable<any>; //refeicoes array.

  canBuy: Array<boolean> = [];
  canQueue: Array<boolean> = [];
  message: Array<string> = [];
  boughtOrQueued: Array<boolean> = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public loadingCtrl: LoadingController, public afDB: AngularFireDatabase,
    public time: TimeService, public _refeicao: RefeicaoService,
    public _user: UserService, public alertCtrl: AlertController,
    private fcm: FCM) {

    // buscar a próxima página de refeições assim que a página carregar
    //this.nextPage(true);

    this.refeicoes = this._refeicao.nextRefeicoes();
    this.refeicoes.subscribe(snapshots => {
        //para cada refeicao, verificar se pode comprar e pode entrar na fila
        snapshots.forEach((snapshot, index) => {
          this.checkAvailability(snapshot, index);
        });
      })
  }

  /**
   * Ir para a refeicao-detail page com a refeição escolhida.
   * @param {any} refeicao A refeição escolhida
   */
  gotoDetails(refeicao: any): void {
    this.navCtrl.push('RefeicaoDetailPage', {
      refeicao: refeicao
    })
  }

  /**
   * Função pré book() que pergunta se o usuário confirma a reserva.
   */
  confirmBook(refeicao: any): void {
    let confirm = this.alertCtrl.create({
      title: 'Confirmar Reserva',
      message: `Tem certeza que deseja reservar a refeicao de ${moment(refeicao.timestamp).format(`L`)}? Seu saldo será debitado.`,
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Sim',
          handler: () => {
            this.book(refeicao);
          }
        }
      ]
    });
    confirm.present();
  }

  book(refeicao: any): void {
    this._user.isVeg()
      .then(snapshot => {
        this._refeicao.book(refeicao, snapshot.val())
          .then(_ => {
            //TODO: Subscribe no tópico da refeição (FCM)
            this.fcm.subscribeToTopic(refeicao.timestamp)
            //Adicionar transação no histórico
            this._user.addHistory('compra', `Refeição do dia ${moment(refeicao.timestamp).format('L')}`);
            //Mostrar mensagem de confirmação.
            //Não seria melhor um toast?
            let alert = this.alertCtrl.create({ //AlertController para a compra realizada com sucesso.
              title: 'Sucesso',
              subTitle: 'Compra realizada com sucesso!',
              buttons: [{
                text: 'OK',
                handler: _ => {
                  this.navCtrl.setRoot('HomePage'); //redirecionar o usuário para a HomePage
                }
              }]
            });
            alert.present();
          })
          .catch(reason => {
            let alert = this.alertCtrl.create({
              title: 'Erro',
              subTitle: reason.message,
              buttons: ['OK']
            })
            alert.present();
          });
      })
  }

  /**
   * Função pré queue() que confirma a entrada do usuário na fila de espera.
   */
  confirmQueue(refeicao: any): void {
    let confirm = this.alertCtrl.create({
      title: 'Confirmar entrada na fila',
      message: `Tem certeza que deseja entrar na fila da refeição do dia ${moment(refeicao.timestamp).format(`L`)}? Seu saldo será debitado e te avisaremos caso você consiga uma vaga. Se não conseguir, seu saldo será reembolsado.`,
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Sim',
          handler: () => {
            this.queue(refeicao);
          }
        }
      ]
    });
    confirm.present();
  }

  /**
   * Coloca o usuário na fila de espera.
   */
  queue(refeicao: any): void {
    this._refeicao.queue(refeicao)
      .then(_ => {
        //Adicionar transação no histórico
        this._user.addHistory('compra', `Entrou na fila da refeição do dia ${moment(refeicao.timestamp).format('L')}`);
        let alert = this.alertCtrl.create({ //AlertController para a compra realizada com sucesso.
          title: 'Sucesso',
          subTitle: 'Você entrou na fila!',
          buttons: [{
            text: 'OK',
            handler: _ => {
              this.navCtrl.setRoot('HomePage'); //redirecionar o usuário para a HomePage
            }
          }]
        });
        alert.present();
      })
      .catch(error => console.log('error in queue()', error));
  }

  /**
   * Retorna a próxima página do sistema de paginação
   * @param firstPage booleando contendo a informação se é a primeira página.
   */
  // nextPage(firstPage?: boolean): void {
  //   //LoadingContoller para mostrar uma mensagem enquanto carrega os dados.
  //   const loading = this.loadingCtrl.create({
  //     content: 'Carregando...'
  //   });
  //   loading.present();

  //   //Pegar a lista de refeições de maneira assíncrona
  //   if (firstPage) {
  //     this.refeicoes = this._refeicao.nextPage(true); //true para a flag firstPage
  //   } else {
  //     //Se não for a primeira página, o usuário pode voltar para a página anterior
  //     this.canGoBack = true;
  //     this.refeicoes = this._refeicao.nextPage();
  //   }

  //   //Verificar a resposta da Promise do nextPage()
  //   this.refeicoes
  //     .then(snapshots => {
  //       //Atualizar as flags
  //       //Isso é realizado aqui porque só temos certeza que todas as operações
  //       //assíncronas foram realizadas no bloco then().
  //       this.canGoForward = this._refeicao.canGoForward();

  //       //para cada refeicao, verificar se pode comprar e pode entrar na fila
  //       snapshots.forEach((snapshot, index) => {
  //         this.checkAvailability(snapshot, index);
  //       });

  //       //Dismiss no LoadingController após tudo ser carregado
  //       loading.dismiss();
  //     });

  // }

  /**
   * Busca pela página anterior pelo sistema de paginação, coordenado por cursores.
   */
  // previousPage(): void {
  //   const loading = this.loadingCtrl.create({
  //     content: 'Carregando...'
  //   });
  //   loading.present();

  //   //Pegar a lista de refeições de maneira assíncrona
  //   this.refeicoes = this._refeicao.previousPage();

  //   this.refeicoes.then(snapshots => {

  //     //Atualizar as flags
  //     //Isso é realizado aqui porque só temos certeza que todas as operações
  //     //assíncronas foram realizadas no bloco then().
  //     this.canGoForward = this._refeicao.canGoForward();
  //     this.canGoBack = this._refeicao.canGoBack();

  //     //para cada refeicao, verificar se pode comprar e pode entrar na fila
  //     snapshots.forEach((snapshot, index) => {
  //       this.checkAvailability(snapshot, index);
  //     });

  //     //Dismiss no LoadingController após tudo ser carregado
  //     loading.dismiss();
  //   });
  // }

  checkAvailability(snapshot: any, index: number) {
    //iniciar as variaveis canBuy e canQueue
    const obs1 = this._user.canBuy(snapshot);
    obs1.subscribe(result => {

      //Se result for uma string, então ocorreu algum problema
      if (typeof result === 'string' || result instanceof String) {
        this.canBuy[index] = false;
        this.message[index] = result as string;
      } else {
        this.canBuy[index] = result;
      }

      const obs2 = this._user.canQueue(snapshot);
      obs2.subscribe(result => {
        //Se result for uma string, então ocorreu algum problema
        if (typeof result === 'string' || result instanceof String) {
          this.canQueue[index] = false;
          this.message[index] = result as string;
        } else {
          this.canQueue[index] = result;
        }

        this.boughtOrQueued[index] = this.message[index] == 'Comprado' || this.message[index] == 'Entrou na fila';
        console.log(moment(snapshot.timestamp).calendar(), 'canBuy?', this.canBuy[index], 'canQueue?', this.canQueue[index]);
      })
    })
  }

}
