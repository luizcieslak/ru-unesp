import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading, ToastController} from 'ionic-angular';

import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

import { HomePage } from '../home/home';

import { UserService } from '../../providers/user-service';
import { RefeicaoService } from '../../providers/refeicao-service';

@Component({
  selector: 'page-refeicao-detail',
  templateUrl: 'refeicao-detail.html'
})
export class RefeicaoDetailPage {

  buttonMsg = 'Reservar';
  buttonQueueMsg = 'Entrar na fila de espera';

  loading: Loading; //loading component.

  refeicaoParams: any; //refeicao sent via NavParams

  canBuy: boolean; //Variável que guarda se o usuário pode comprar esta refeição. (usada no botão)
  canQueue: boolean; //Variável que guarda se o usuário pode entrar na fila de espera. (usada no botão)

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public afDB:AngularFireDatabase, public alertCtrl: AlertController, 
    public loadingCtrl: LoadingController, public toastCtrl: ToastController, 
    public _user: UserService, public _refeicao: RefeicaoService) {

    //create and present the loading
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    
    //Pegar a refeição enviada por NavParams
    this.refeicaoParams = this.navParams.get('refeicao');

    this._refeicao.subtractVagas(this.refeicaoParams)
      .then(ok => console.log(ok))
      .catch(reason => console.log('error',reason));

    //iniciar as variaveis canBuy e canQueue
    const obs1 = this._user.canBuy(this.refeicaoParams);
    obs1.subscribe(result =>{
      console.log('canBuy?', result);
      //Se result for uma string, então ocorreu algum problema
      if (typeof result === 'string' || result instanceof String){
        this.canBuy = false;
        this.buttonMsg = result as string;
      }else{
        this.canBuy = result;
      }

      const obs2 = this._user.canQueue(this.refeicaoParams);
      obs2.subscribe(result => {
        console.log('canQueue?', result);
        //Se result for uma string, então ocorreu algum problema
        if (typeof result === 'string' || result instanceof String){
          this.canQueue = false;
          this.buttonQueueMsg = result as string;
        //Se canBuy = true, canQueue = false
        }else{
          this.canQueue = result;
        }

        //Dispensar o Loadind Component
        this.loading.dismiss();
      })

    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoDetailPage');
  }

  /**
   * Função pré book() que pergunta se o usuário confirma a reserva.
   */
  confirmBook(): void{
    let confirm = this.alertCtrl.create({
      title: 'Confirmar Reserva',
      message: 'Tem certeza que deseja reservar esta refeição? Seu saldo será debitado.',
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Sim',
          handler: () => {
            this.book();
          }
        }
      ]
    });
    confirm.present();
  }

  book(): void{
    this._user.isVeg()
      .then(snapshot =>{
        this._refeicao.book(this.refeicaoParams, snapshot.val())
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
    confirmQueue(): void{
      let confirm = this.alertCtrl.create({
        title: 'Confirmar entrada na fila',
        message: 'Tem certeza que deseja entrar na fila? Seu saldo será debitado e te avisaremos caso você consiga uma vaga. Se não conseguir, seu saldo será reembolsado.',
        buttons: [
          {
            text: 'Cancelar',
          },
          {
            text: 'Sim',
            handler: () => {
              this.queue();
            }
          }
        ]
      });
      confirm.present();
    }

    /**
     * Coloca o usuário na fila de espera.
     */
    queue(): void{
      this._refeicao.queue(this.refeicaoParams)
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
