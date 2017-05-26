import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading } from 'ionic-angular';

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
  timeLeft: string; //time left until the end of reservation.
  vagasCount: Number; 

  userObservable: FirebaseObjectObservable<any>;
  userSaldo: Number; //O saldo é obtido somente quando a página é carregada
  isVeg: boolean;

  eligible: boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private afAuth: AngularFireAuth, public afDB:AngularFireDatabase,
    public alertCtrl: AlertController, public loadingCtrl: LoadingController) {

    //create and present the loading
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    

    this.refeicao = this.navParams.get('refeicao');
    this.userObservable = this.afDB.object('users/'+ afAuth.auth.currentUser.uid);

    this.userObservable.subscribe( user => {
      this.isVeg = user.veg
      this.userSaldo = user.saldo;

      //dar um 'bind' no numero de vagas com o banco de dados
      let refeicaoObservable = this.afDB.object('/refeicoes/'+ this.refeicao.$key);
      refeicaoObservable.subscribe( refeicao => {
        this.vagasCount = refeicao.vagas;

        //após tudo carregado, mostrar a mensagem no botão
        if(this.vagasCount == 0) this.buttonMsg = 'Sem vagas!';
        else if(this.isTimeOver()) this.buttonMsg = 'Tempo esgotado!';
        else if(this.userSaldo == 0) this.buttonMsg = 'Sem saldo!';
        else if(this.bought()) this.buttonMsg = 'Já comprou!';
        this.isEligible(); //faz o update na variável this.eligible
        
        this.loading.dismiss();
      });

    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoDetailPage');
  }

  isEligible(): boolean{ //verifica se o usuário pode realizar a compra.
    this.eligible = this.userSaldo > 0 && this.vagasCount > 0 && !this.bought() && !this.isTimeOver();
    return this.eligible;
  }

  book(): void{

    if(this.isEligible()){
      this.saldoPromise()
        .then(_ => {
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
    }else{
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
    userList.child(this.afAuth.auth.currentUser.uid).set(true);
    let alert = this.alertCtrl.create({ //AlertController para o sem numero de vagas
          title: 'Sucesso',
          subTitle: 'Compra realizada com sucesso!',
          buttons: [{ 
            text: 'OK',
            handler: _ => {
              this.navCtrl.setRoot(HomePage);
            }
          }]
    });
    alert.present();

  }

  saldoPromise(): firebase.Promise<any> {
    return firebase.database().ref('/users/'+ this.afAuth.auth.currentUser.uid+ '/saldo')
      .transaction( saldo => { return saldo - 1; });
  }

  countPromise(): firebase.Promise<any>{
    if(this.isVeg){
      return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/usersVeg_count')
          .transaction( count => { return count + 1; });
    }else{
      return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/users_count')
          .transaction( count => { return count + 1; });
    }
  }

  vagasPromise(): firebase.Promise<any>{ 
    //TODO: retornar uma Promise.reject() para qdo não tiver mais vaga
    return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/vagas')
              .transaction( vagas => {
                if(vagas>0) return vagas - 1;
                else return vagas;
              });
  }

  addRefeicaoToUser(): firebase.Promise<any> {
    return firebase.database().ref('users/'+ this.afAuth.auth.currentUser.uid +'/refeicoes')
      .child(this.refeicao.$key).set(true); //nao esta na lista
  }

  isTimeOver(): boolean{
   return moment().isAfter(this.refeicao.timestamp); //verificar data maxima de compra
  }

  bought(): boolean {
    let bought: boolean;
    //verificar se o usuario ja comprou essa refeição
    let userRefeicoes = firebase.database().ref('users/'+ this.afAuth.auth.currentUser.uid +'/refeicoes');
    userRefeicoes.child(this.refeicao.$key).once('value', snapshot => {
      bought = snapshot.val() !== null;
    })
    return bought;
  }

}
