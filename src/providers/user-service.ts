import { Injectable } from '@angular/core';

import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

import { AuthService } from '../providers/auth-service';

@Injectable()
export class UserService {

  constructor(private afDB: AngularFireDatabase, private _auth: AuthService ) {
  }

  /**
   * Function called after AuthService.signUp() to store user's additional info.
   * @argument {string} uid id do usuário
   */
  postSignup(uid: string, data): firebase.Promise<any>{
    const user = this.afDB.object('users/'+uid);
    return user.set(({
      name: data.name,
      ra: data.ra,
      email: data.email,
      saldo: 0,
      refeicoes: {},
      veg: data.veg,
      created_at: firebase.database.ServerValue.TIMESTAMP,
      updated_at: firebase.database.ServerValue.TIMESTAMP
    }));
  }

  /**
   * Pega a referência do usuário no banco de dados.
   * @argument {string} uid id do usuário
   * @returns Observable.
   */
  userObservable(uid: string): FirebaseObjectObservable<any>{
    return this.afDB.object('users/'+uid);
  }

  /**
   * Tira uma unidade do saldo do usuário
   * @returns Promise
   * @argument {string} uid id do usuário
   */
  debitSaldo(uid: string): firebase.Promise<any> {
    return firebase.database().ref('/users/'+ uid + '/saldo')
      .transaction( saldo => { return saldo - 1; });
  }

  /**
   * Verifica se o usuário já comprou a refeição
   * @argument {string} uid id do usuário
   * @argument {any} refeicao Refeição a ser analisada
   * @returns {true} Se já comprou.
   */
  bought(uid: string, refeicao: any): boolean {
    let bought: boolean;
    
    const userRefeicoes = firebase.database().ref('users/'+ uid +'/refeicoes');
    userRefeicoes.child(refeicao.$key).once('value', snapshot => {
      bought = snapshot.val() !== null;
    })
    return bought;
  }

  /**
   * Promise que adiciona o id da refeição no documento do usuário.
   */
  addRefeicao(refeicao: any, uid: string): firebase.Promise<any> {
    return firebase.database().ref('users/'+ uid +'/refeicoes')
      .child(refeicao.$key).set(true); //nao esta na lista
  }

}
