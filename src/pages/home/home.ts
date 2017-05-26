import { Component } from '@angular/core';
import { NavController, LoadingController, Loading, ActionSheetController } from 'ionic-angular';

import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  //event fired before page is loaded. Checks if the user is authenticated.
  ionViewCanEnter() {
    return this.auth !== null;
  }

  loading: Loading; //loading component
  shownGroup = null;

  //user from auth
  auth: any;
  user: FirebaseObjectObservable<any>;
  userRefeicoes: any;
  refeicoesKey: Array<any>;
  refeicoes: Array<any> = [];

  constructor(public navCtrl: NavController, private afAuth: AngularFireAuth,
  public afDB: AngularFireDatabase, public loadingCtrl: LoadingController,
  public actionSheetCtrl: ActionSheetController) {

    //create present the loading
    this.loading = this.loadingCtrl.create();
    this.loading.present();

    afAuth.authState.subscribe(auth => {
        if (!auth) {
          this.auth = null;        
          return;
        }
        this.auth = auth;    
    });
    
    this.user = this.afDB.object('/users/'+this.afAuth.auth.currentUser.uid); 
    this.user.subscribe( user =>{
      if(user.refeicoes){
        this.refeicoesKey = Object.keys(user.refeicoes);
        this.refeicoesKey.forEach(key => {
          let refeicaoObservable = this.afDB.object('/refeicoes/'+ key);
          refeicaoObservable.subscribe(refeicao => {
            this.refeicoes.push(refeicao); 
          })
        })
      }

      this.loading.dismiss();
    })

    
  }

  toggleGroup(group) {
      if (this.isGroupShown(group)) {
          this.shownGroup = null;
      } else {
          this.shownGroup = group;
      }
  }

  isGroupShown(group) {
      return this.shownGroup === group;
  };

  remove(refeicao: any){

  }

  transfer(refeicao: any){

  }



}
