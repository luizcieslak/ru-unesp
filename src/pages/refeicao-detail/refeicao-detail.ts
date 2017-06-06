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
import { AuthService } from '../../providers/auth-service';
import { RefeicaoService } from '../../providers/refeicao-service';
import { TimeService } from '../../providers/time-service';

@Component({
  selector: 'page-refeicao-detail',
  templateUrl: 'refeicao-detail.html'
})
export class RefeicaoDetailPage {

  buttonMsg = 'Reservar';

  loading: Loading; //loading component.

  refeicaoParams: any; //refeicao sent via NavParams
  vagasCount: Number; //número de vagas da refeição

  //variáveis do usuário
  userObservable: FirebaseObjectObservable<any>;
  userSaldo: Number;
  isVeg: boolean; 
  bought: boolean;
  isAllowed: boolean;

  canBuy: boolean; //Variável que guarda se o usuário pode comprar esta refeição. (usada no botão)
  canQueue: boolean; //Variável que guarda se o usuário pode entrar na fila de espera. (usada no botão)

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private auth: AuthService, public afDB:AngularFireDatabase,
    public alertCtrl: AlertController, public loadingCtrl: LoadingController,
    public toastCtrl: ToastController, public _user: UserService,
    public _refeicao: RefeicaoService, public _time: TimeService) {

    //create and present the loading
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    

    this.refeicaoParams = this.navParams.get('refeicao');
    this.userObservable = this._user.userObservable(auth.uid);

    //verificar se o usuário já comprou esta refeição
    this.bought = this._user.bought(this.auth.uid,this.refeicaoParams);

    //verificar se esta dentro do tempo permitido
    this.isAllowed = _time.isAllowed(this.refeicaoParams.timestamp);

    this.userObservable.subscribe( user => { 
      //Carregar as informações do usuário.
      this.isVeg = user.veg;
      this.userSaldo = user.saldo;

      //Carregar a informação do número de vagas.
      let refeicaoObservable = this.afDB.object('/refeicoes/'+ this.refeicaoParams.$key);
      refeicaoObservable.subscribe( refeicao => {
        this.vagasCount = refeicao.vagas;

        //após tudo carregado, mostrar a mensagem no botão
        if(this.vagasCount == 0) this.buttonMsg = 'Sem vagas!';
        else if(!this.isAllowed) this.buttonMsg = 'Tempo esgotado!';
        else if(this.userSaldo == 0) this.buttonMsg = 'Sem saldo!';
        else if(this.bought) this.buttonMsg = 'Já comprou!';

        //iniciar as variaveis canBuy e canQueue
        this.isEligible(); 
        this.isEligibleQueue();
        
        this.loading.dismiss();
      });

    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoDetailPage');
  }

  /**
   * Verifica se o usuário pode realizar a compra.
   * @returns {true} se o usuário ter saldo suficiente, ainda ter vaga, usuário não ter comprado essa refeicao e não ter esgotado o tempo máximo de compra.
  */
  isEligible(): boolean{
    this.canBuy = this.userSaldo > 0 && this.vagasCount > 0 && !this.bought && this.isAllowed;
    return this.canBuy;
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
    this._refeicao.book(this.refeicaoParams, this.auth.uid, this.isVeg);

    //atualizar bought
    //mostrar mensagem
    
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
  }

  /**
   * Verifica se o usuário já esta na fila de espera
   */
  isQueued(): boolean{
    let queued: boolean;
    let userQueue = firebase.database().ref('users/'+ this.auth.uid +'/queue');
    userQueue.child(this.refeicaoParams.$key).once('value', snapshot => {
      queued = snapshot.val() !== null;
    })
    return queued;
  }

  /**
   * Verifica se o usuário pode entrar na fila de espera
   */
   isEligibleQueue(): boolean{
      this.canQueue = this.vagasCount == 0 && this.userSaldo > 0 && !this.isQueued();
      return this.canQueue
   }

   /**
    * Confirma a entrada do usuário na fila de espera.
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
      //TODO: verificar se precisa fazer distinção de usuários (default e veg) na fila de espera.
      let refeicaoQueue = firebase.database().ref('refeicoes/'+ this.refeicaoParams.$key+ '/queue');
      refeicaoQueue.child(this.auth.uid).set(true) //adiciona o user na fila da refeição
        .then( _ => {
          let userQueue = firebase.database().ref('users/'+ this.auth.uid +'/queue');
          userQueue.child(this.refeicaoParams.$key).set(true)
            .then( _ => this.onQueueSuccess())
            .catch( error => console.log('error in userQueue: '+ error.message));
        })
        .catch(error => console.log('error in refeicaoQueue: '+ error.message))
    }

    onQueueSuccess():void{
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
    }

}
