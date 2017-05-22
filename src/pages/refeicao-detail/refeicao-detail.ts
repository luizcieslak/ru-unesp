import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
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

  refeicao: any; //refeicao sent via NavParams
  timeLeft: string; //time left until the end of reservation.
  userInfo: FirebaseObjectObservable<any>;
  userList: any;
  countPromise: firebase.Promise<any>;
  isVeg: boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private afAuth: AngularFireAuth, public afDB:AngularFireDatabase) {
    this.refeicao = this.navParams.get('refeicao');

    this.userInfo = this.afDB.object('users/'+ afAuth.auth.currentUser.uid);

    this.userInfo.subscribe( user => {
      this.isVeg = user.veg
    });
    

    //moment tests
    this.timeLeft = moment(this.refeicao.timestamp).fromNow();
    console.log(moment().to(moment('20170518T1950'))); //comparing time
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefeicaoDetailPage');
  }

  book(): void{
    
      this.saldo()
        .then(_ => {
          this.count()
            .then( _ => {
              this.vagas()
                .then( _ => {
                  this.addUser()
                })
                .catch(error => { console.log('Error in vagas() ' +  error.message); });
            })
            .catch(error => { console.log('Error in count() ' +  error.message); });
        })
        .catch(error => { console.log('Error in saldo() ' +  error.message); });
        
  }

  addUser(): void{
    console.log('addUser()');
    if(this.isVeg){
      this.userList = firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/usersVeg');
    }else{
      this.userList = firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/users');
    }
    this.userList.child(this.afAuth.auth.currentUser.uid).set(true);
  }

  saldo(): firebase.Promise<any> {
    return firebase.database().ref('/users/'+ this.afAuth.auth.currentUser.uid+ '/saldo')
      .transaction( saldo => { return saldo - 1; });
  }

  count(): firebase.Promise<any>{
    if(this.isVeg){
      return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/usersVeg_count')
          .transaction( count => { return count + 1; });
    }else{
      return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/users_count')
          .transaction( count => { return count + 1; });
    }
  }

  vagas(): firebase.Promise<any>{
    return firebase.database().ref('/refeicoes/'+ this.refeicao.$key+ '/vagas')
              .transaction( vagas => { return vagas - 1; });
  }

}
