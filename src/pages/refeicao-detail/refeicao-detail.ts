import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading } from 'ionic-angular';

import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

/*
  Generated class for the RefeicaoDetail page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
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
  userRefeicoes: any;
  userSaldo: Number; //O saldo é obtido somente quando a página é carregada
  isVeg: boolean;

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
        this.loading.dismiss();

        //após tudo carregado, mostrar a mensagem no botão
        if(this.vagasCount == 0) this.buttonMsg = 'Sem vagas!';
        else if(this.isTimeOver()) this.buttonMsg = 'Tempo esgotado!';
        else if(this.userSaldo == 0) this.buttonMsg = 'Sem saldo!';
        else if(this.bought) this.buttonMsg = 'Já comprou!';
      });
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoDetailPage');
  }

  get isEligible(): boolean{ //verifica se o usuário pode realizar a compra.
    return this.userSaldo > 0 && this.vagasCount > 0 && !this.bought && this.isTimeOver();
  }

  book(): void{

    if(this.isEligible){
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
    userList.child(this.afAuth.auth.currentUser.uid).once('value', snapshot => {
      if( snapshot.val() == null ) userList.child(this.afAuth.auth.currentUser.uid).set(true); //nao esta na lista
    })
    console.log('Compra realizada com sucesso');
    // userList.child(this.afAuth.auth.currentUser.uid).set(true);
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
    return this.userRefeicoes.child(this.refeicao.$key).set(true); //nao esta na lista
  }

  isTimeOver(): boolean{
    console.log('now: '+ moment().format('LL'));
    console.log('timestamp: '+ moment(this.refeicao.timestamp).format('LL'));
    console.log('isBefore(): '+ moment().isBefore(this.refeicao.timestamp));
    return moment().isBefore(this.refeicao.timestamp);
  }

  get bought(): boolean{
    let bought: boolean;
    this.userRefeicoes = firebase.database().ref('users/'+ this.afAuth.auth.currentUser.uid +'/refeicoes');
    //verificar se o usuario ja comprou essa refeição
    this.userRefeicoes.child(this.refeicao.$key).once('value', snapshot => {
      bought = snapshot.val() !== null;
    })
    return bought;
  }

}
