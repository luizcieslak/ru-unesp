import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Loading, AlertController} from 'ionic-angular';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { RefeicaoDetailPage } from '../refeicao-detail/refeicao-detail';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

import { TimeService } from '../../providers/time-service';
import { RefeicaoService } from '../../providers/refeicao-service';
import { UserService } from '../../providers/user-service';

import { HomePage } from '../home/home';

@Component({
  selector: 'page-refeicao-list',
  templateUrl: 'refeicao-list.html'
})
export class RefeicaoListPage {

  refeicoes: FirebaseListObservable<any>; //refeicoes array.
  loading: Loading;                       //loading component.
  empty: boolean;
  canBuy: Array<boolean> = []; 
  canQueue: Array<boolean> = []; 
  message: Array<string> = [];
  boughtOrQueued: Array<boolean> = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public loadingCtrl: LoadingController, public afDB: AngularFireDatabase,
    public time: TimeService, public _refeicao: RefeicaoService,
    public _user: UserService, public alertCtrl: AlertController) {

      //create present the loading
      this.loading = this.loadingCtrl.create();
      this.loading.present();
      
      //Pegar a lista de refeições de maneira assíncrona
      this.refeicoes = this._refeicao.nextRefeicoes();

      //Assim que os dados forem carregados, fechar o loading component.
      this.refeicoes.subscribe( snapshots => {
        //checar se o array snapshots é vazio
        this.empty = snapshots.length == 0;
        //para cada refeicao, verificar se pode comprar e pode entrar na fila
        snapshots.forEach( (snapshot,index)  => {

          //iniciar as variaveis canBuy e canQueue
          const obs1 = this._user.canBuy(snapshot);
          obs1.subscribe(result =>{

            //Se result for uma string, então ocorreu algum problema
            if (typeof result === 'string' || result instanceof String){
              this.canBuy[index] = false;
              this.message[index] = result as string; 
            }else{
              this.canBuy[index] = result;
            }

            const obs2 = this._user.canQueue(snapshot);
            obs2.subscribe(result => {
              //Se result for uma string, então ocorreu algum problema
              if (typeof result === 'string' || result instanceof String){
                this.canQueue[index] = false;
                this.message[index] = result as string;
              }else{
                this.canQueue[index] = result;
              }

              this.boughtOrQueued[index] = this.message[index] == 'Comprado' || this.message[index] == 'Entrou na fila';
              console.log(moment(snapshot.timestamp).calendar(),'canBuy?',this.canBuy[index],'canQueue?', this.canQueue[index]);
            })
          })

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

  /**
   * Função pré book() que pergunta se o usuário confirma a reserva.
   */
  confirmBook(refeicao: any): void{
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

  book(refeicao: any): void{
    this._user.isVeg()
      .then(snapshot =>{
        this._refeicao.book(refeicao, snapshot.val())
          .then(_ => {
            //Mostrar mensagem de confirmação.
            //Não seria melhor um toast?
            let alert = this.alertCtrl.create({ //AlertController para a compra realizada com sucesso.
                  title: 'Sucesso',
                  subTitle: 'Compra realizada com sucesso!',
                  buttons: [{ 
                    text: 'OK',
                    handler: _ => {
                      this.navCtrl.setRoot(HomePage); //redirecionar o usuário para a HomePage
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
    confirmQueue(refeicao: any): void{
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
    queue(refeicao: any): void{
      this._refeicao.queue(refeicao)
        .then(_ => {
          let alert = this.alertCtrl.create({ //AlertController para a compra realizada com sucesso.
              title: 'Sucesso',
              subTitle: 'Você entrou na fila!',
              buttons: [{ 
                text: 'OK',
                handler: _ => {
                    this.navCtrl.setRoot(HomePage); //redirecionar o usuário para a HomePage
                }
              }]
          });
          alert.present();
        })
        .catch(error => console.log('error in queue()', error));
    }

}
