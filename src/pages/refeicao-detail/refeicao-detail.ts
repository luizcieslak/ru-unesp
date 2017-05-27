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

@Component({
  selector: 'page-refeicao-detail',
  templateUrl: 'refeicao-detail.html'
})
export class RefeicaoDetailPage {

  buttonMsg = 'Reservar';

  loading: Loading; //loading component.

  refeicao: any; //refeicao sent via NavParams
  vagasCount: Number; //número de vagas da refeição

  //variáveis do usuário
  userObservable: FirebaseObjectObservable<any>;
  userSaldo: Number;
  isVeg: boolean; 

  canBuy: boolean; //Variável que guarda se o usuário pode comprar esta refeição. (usada no botão)
  canQueue: boolean; //Variável que guarda se o usuário pode entrar na fila de espera. (usada no botão)

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private afAuth: AngularFireAuth, public afDB:AngularFireDatabase,
    public alertCtrl: AlertController, public loadingCtrl: LoadingController,
    public toastCtrl: ToastController) {

    //create and present the loading
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    

    this.refeicao = this.navParams.get('refeicao');
    this.userObservable = this.afDB.object('users/'+ afAuth.auth.currentUser.uid);

    this.userObservable.subscribe( user => { 
      //Carregar as informações do usuário.
      this.isVeg = user.veg
      this.userSaldo = user.saldo;

      //Carregar a informação do número de vagas.
      let refeicaoObservable = this.afDB.object('/refeicoes/'+ this.refeicao.$key);
      refeicaoObservable.subscribe( refeicao => {
        this.vagasCount = refeicao.vagas;

        //após tudo carregado, mostrar a mensagem no botão
        if(this.vagasCount == 0) this.buttonMsg = 'Sem vagas!';
        else if(this.isTimeOver()) this.buttonMsg = 'Tempo esgotado!';
        else if(this.userSaldo == 0) this.buttonMsg = 'Sem saldo!';
        else if(this.bought()) this.buttonMsg = 'Já comprou!';

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
    this.canBuy = this.userSaldo > 0 && this.vagasCount > 0 && !this.bought() && !this.isTimeOver();
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


  /**
   * Realizar a compra da refeição.
   */
  book(): void{
    
    if(this.isEligible()){              //se o usuário for legível,
      this.saldoPromise()               //é feito uma cadeia de firebase.Promise<any>
        .then(_ => {                    //que realizam todas as operações necessárias.
          this.countPromise()
              .then( _ => {
                this.vagasPromise()
                  .then( _ => {
                    this.addRefeicaoToUser()
                      .then( _ => {
                        this.addUser()
                      })
                      .catch(error => { console.log('Error in addRefeicaoToUser() ' +  error.message); })
                  })
                  .catch(error => { console.log('Error in vagas() ' +  error.message); });
              })
              .catch(error => { console.log('Error in count() ' +  error.message); });
          })
          .catch(error => { console.log('Error in saldo() ' +  error.message); });
    }else{  //Se o usuário não for legível, mostrar um alert adequado:
      //OBS: Alerts não estão sendo usados, uma vez que o controle é feito no botão.
      let alert;
      if(this.userSaldo == 0){ //AlertController para a falta de saldo
        alert = this.alertCtrl.create({
          title: 'Sem saldo',
          subTitle: 'Seu saldo não é suficiente para comprar a refeição.',
          buttons: ['OK']
        });
      }else if(this.bought){ //AlertController já comprou
        alert = this.alertCtrl.create({
          title: 'Já comprou',
          subTitle: 'Você já comprou essa refeição.',
          buttons: ['OK']
        });
      }else{
        alert = this.alertCtrl.create({ //AlertController para o sem numero de vagas
          title: 'Sem vagas',
          subTitle: 'Não há mais vagas para essa refeição.',
          buttons: ['OK']
        });
      }
      alert.present();
    }
        
  }

  /**
   * Adicionar usuário na devida lista dentro de /refeicoes/
   */
  addUser(): void{
    let userList;
    if(this.isVeg){
      userList = firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/usersVeg');
    }else{
      userList = firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/users');
    }

    //verificar se o usuario ja esta na lista
    //userList.child(this.afAuth.auth.currentUser.uid).once('value', snapshot => {
    //  if( snapshot.val() == null ) userList.child(this.afAuth.auth.currentUser.uid).set(true); //nao esta na lista
    //})

    //Adicionar o usuário direto, nesse ponto já se sabe que o usuário não está na lista
    userList.child(this.afAuth.auth.currentUser.uid).set(true);

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
   * Promise que faz uma transcation no saldo do usuário
   */
  saldoPromise(): firebase.Promise<any> {
    return firebase.database().ref('/users/'+ this.afAuth.auth.currentUser.uid+ '/saldo')
      .transaction( saldo => { return saldo - 1; });
  }

  /**
   * Promise que faz uma transcation no contador de usuários (default ou vegetariano)
   */
  countPromise(): firebase.Promise<any>{
    if(this.isVeg){
      return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/usersVeg_count')
          .transaction( count => { return count + 1; });
    }else{
      return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/users_count')
          .transaction( count => { return count + 1; });
    }
  }

  /**
   * Promise que faz uma transcation no número de vagas. (vagas = users_count - usersVeg_count)
   */
  vagasPromise(): firebase.Promise<any>{ 
    //TODO: retornar uma Promise.reject() para qdo não tiver mais vaga
    return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/vagas')
              .transaction( vagas => {
                if(vagas>0) return vagas - 1;
                else return vagas;
              });
  }

  /**
   * Promise que adiciona o id da refeição no documento do usuário.
   */
  addRefeicaoToUser(): firebase.Promise<any> {
    return firebase.database().ref('users/'+ this.afAuth.auth.currentUser.uid +'/refeicoes')
      .child(this.refeicao.$key).set(true); //nao esta na lista
  }

  /**
   * Verifica se o tempo para a compra da refeição esgotou.
   * @returns {true} Se o tempo esgotou.
   */
  isTimeOver(): boolean{
   return moment().isAfter(this.refeicao.timestamp); //verificar data maxima de compra
  }

  /**
   * Verifica se o usuário já comprou essa refeição.
   * @returns {true} Se já comprou.
   */
  bought(): boolean {
    let bought: boolean;
    //verificar se o usuario ja comprou essa refeição
    let userRefeicoes = firebase.database().ref('users/'+ this.afAuth.auth.currentUser.uid +'/refeicoes');
    userRefeicoes.child(this.refeicao.$key).once('value', snapshot => {
      bought = snapshot.val() !== null;
    })
    return bought;
  }

  /**
   * Verifica se o usuário já esta na fila de espera
   */
  isQueued(): boolean{
    let queued: boolean;
    let userQueue = firebase.database().ref('users/'+ this.afAuth.auth.currentUser.uid +'/queue');
    userQueue.child(this.refeicao.$key).once('value', snapshot => {
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
      let refeicaoQueue = firebase.database().ref('refeicoes/'+ this.refeicao.$key+ '/queue');
      refeicaoQueue.child(this.afAuth.auth.currentUser.uid).set(true) //adiciona o user na fila da refeição
        .then( _ => {
          let userQueue = firebase.database().ref('users/'+ this.afAuth.auth.currentUser.uid +'/queue');
          userQueue.child(this.refeicao.$key).set(true)
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
