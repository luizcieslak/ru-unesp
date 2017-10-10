import { Component } from '@angular/core';
import { NavController, LoadingController, Loading, AlertController, Platform, Events } from 'ionic-angular';

import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

import { TimeService } from '../../providers/time-service';
import { RefeicaoService } from '../../providers/refeicao-service';
import { AuthService } from '../../providers/auth-service';
import { UserService } from '../../providers/user-service';

import { Observable, Subscription } from "rxjs/Rx";

import { FCM } from '@ionic-native/fcm';

import { ConnectivityService } from '../../providers/connectivity-service'

import { IonicPage } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  loading: Loading; //loading component.
  shownGroup = null; //Variável para a accordion list.

  user: FirebaseObjectObservable<any>;
  userSub: Subscription;
  isVeg: boolean;
  refeicoes: Observable<Array<{}>>;
  queueRefeicoes: Observable<Array<{}>>;

  constructor(public navCtrl: NavController, private _auth: AuthService,
    public afDB: AngularFireDatabase, public loadingCtrl: LoadingController,
    public alertCtrl: AlertController, public time: TimeService,
    public _refeicao: RefeicaoService, public _user: UserService,
    private fcm: FCM, private _conn: ConnectivityService,
    private platform: Platform, private events: Events) {

      this.checkConn();
      //if the user is in this page, this means that we need to retrive the profilePic.
      this.events.publish('login');
  }

  /**
   * Checks user's connection to internet in order to load the data.
   */
  checkConn(): void {
    if (this._conn.isOnline()) {
      this.retrieveInfo()
        .then(_ => 'home.ts info loaded')
        .catch(reason => console.log('retrieveInfo(): ', reason))
    } else {
      this.connAlert();
    }
  }

  /**
   * Alert Controller display a connectivity error.
   */
  connAlert(): void {
    let confirm = this.alertCtrl.create({
      title: 'Erro na conexão',
      message: 'Você está sem conexão. Verifique sua conectividade e tente novamente',
      buttons: [
        {
          text: 'Sair do app',
          handler: () => {
            this.platform.exitApp();
          }
        },
        {
          text: 'Tentar novamente',
          handler: () => {
            this.checkConn();
          }
        }
      ],
      enableBackdropDismiss: false
    });
    confirm.present();
  }

  async retrieveInfo(): Promise<any> {
    //Observable do Usuário
    const uid = await this._auth.uid();
    this.user = this.afDB.object(`/users/${uid}`);
    this.userSub = this.user.subscribe(user => {
      this.isVeg = user.veg;
      if (user.refeicoes) {
        this.refeicoes = Observable.of(user.refeicoes)
          .map(obj => {
            let arr = [];
            Object.keys(obj).forEach((key) => {
              //get an Observable containing the info for each key in user.refeicoes object.
              arr.push(this.afDB.object(`refeicoes/${key}`));
            })

            //zip() all Observables in the array
            let zip = Observable.zip(...arr);
            return zip;
          })
          //use switchMap() to flatten the Observables
          .switchMap(val => val)
          //Filter and sort the data.
          .map(data => {
            data = data.filter(refeicao => {
              return refeicao['timestamp'] > moment().valueOf()
            });

            data.sort((a, b) => {
              return a['timestamp'] < b['timestamp'] ? -1 : 1;
            })
            return data;
          })
      }
      //repetir o mesmo processo para as refeições na lista de espera
      if (user.queue) {
        this.queueRefeicoes = Observable.of(user.queue)
          .map(obj => {
            let arr = [];
            Object.keys(obj).forEach((key) => {
              //get an Observable containing the info for each key in user.refeicoes object.
              arr.push(this.afDB.object(`refeicoes/${key}`));
            })

            //zip() all Observables in the array
            let zip = Observable.zip(...arr);
            return zip;
          })
          //use switchMap() to flatten the Observables
          .switchMap(val => val)
          //Filter and sort the data.
          .map(data => {
            data = data.filter(refeicao => {
              return refeicao['timestamp'] > moment().valueOf()
            });

            data.sort((a, b) => {
              return a['timestamp'] < b['timestamp'] ? -1 : 1;
            })
            return data;
          })
      }

    })
    return 1;
  }

  ionViewDidLeave() {
    //this is giving a infinite loop in Loading component
    //this.userSub.unsubscribe(); 
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

  confirmRemove(refeicao: any): void {
    let confirm = this.alertCtrl.create({
      title: 'Confirmar Desistência',
      message: `Tem certeza que deseja desistir da refeição de ${moment(refeicao.timestamp).format(`L`)}? Seu saldo será reembolsado.`,
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
  remove(refeicao: any): void {
    this._refeicao.remove(refeicao, this.isVeg)
      .then(_ => {
        //Unsubscribe no tópico da refeição (FCM)
        //TODO: verificar se funciona no ionic serve
        this.fcm.unsubscribeFromTopic(refeicao.timestamp);
        //Adicionar transação no histórico
        this._user.addHistory('desistência', `Desistiu da refeição do dia ${moment(refeicao.timestamp).format('L')}`);
        let alert = this.alertCtrl.create({
          title: 'Sucesso',
          subTitle: 'Você removeu esta refeição. Seu saldo será reembolsado.',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.navCtrl.setRoot('HomePage');
            }
          }]
        });
        alert.present();
      })
      .catch(reason => {
        console.log('error in remove()', reason)
        if (!reason) {
          let alert = this.alertCtrl.create({
            title: 'Erro',
            subTitle: 'Não é possível realizar esta operação com menos de um dia de antecedência.',
            buttons: ['OK']
          });
          alert.present();
        }
      });
  }

  confirmRemoveQueue(refeicao: any) {
    let confirm = this.alertCtrl.create({
      title: 'Confirmar Desistência',
      message: `Tem certeza que deseja desistir da fila do dia ${moment(refeicao.timestamp).format(`L`)}? Seu saldo será reembolsado.`,
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Sim',
          handler: () => {
            this.removeQueue(refeicao);
          }
        }
      ]
    });
    confirm.present();
  }

  /**
   * Remove o usuário da fila, reembolsando-o.
   */
  removeQueue(refeicao: any) {
    this._refeicao.removeQueue(refeicao)
      .then(_ => {
        //Adicionar transação no histórico
        this._user.addHistory('desistência', `Desistiu da fila da refeição do dia ${moment(refeicao.timestamp).format('L')}`);
        let alert = this.alertCtrl.create({
          title: 'Sucesso',
          subTitle: 'Operação realizada com sucesso. Seu saldo será reembolsado.',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.navCtrl.setRoot('HomePage');
            }
          }]
        });
        alert.present();
      })
      .catch(reason => {
        let alert = this.alertCtrl.create({
          title: 'Erro',
          subTitle: 'Não é possível realizar esta operação com menos de um dia de antecedência.',
          buttons: ['OK']
        });
        alert.present();
      });
  }

}
