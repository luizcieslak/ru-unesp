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
   * @returns Observable.
   */
  userObservable(): FirebaseObjectObservable<any>{
    return this.afDB.object('users/'+ this._auth.uid);
  }

  /**
   * Tira uma unidade do saldo do usuário
   * @returns Promise
   */
  debitSaldo(): firebase.Promise<any> {
    return firebase.database().ref('/users/'+ this._auth.uid + '/saldo')
      .transaction( saldo => { return saldo - 1; });
  }

  /**
   * Verifica se o usuário já comprou a refeição
   * @argument {string} uid id do usuário
   * @argument {any} refeicao Refeição a ser analisada
   * @returns {true} Se já comprou.
   */
  bought(refeicao: any): boolean {
    let bought: boolean;
    
    const userRefeicoes = firebase.database().ref('users/'+ this._auth.uid +'/refeicoes');
    userRefeicoes.child(refeicao.$key).once('value', snapshot => {
      bought = snapshot.val() !== null;
    })
    return bought;
  }

  /**
   * Promise que adiciona o id da refeição no documento do usuário.
   */
  addRefeicao(refeicao: any): firebase.Promise<any> {
    return firebase.database().ref('users/'+ this._auth.uid +'/refeicoes')
      .child(refeicao.$key).set(true); //nao esta na lista
  }

  /**
   * Verifica se o usuário já esta na fila de espera da refeição.
   */
  isQueued(refeicao: any): boolean{
    let queued: boolean;
    const userQueue = firebase.database().ref('users/'+ this._auth.uid +'/queue');
    userQueue.child(refeicao.$key).once('value', snapshot => {
      queued = snapshot.val() !== null;
    })
    return queued;
  }

  /**
   * Adiciona a refeição na fila do usuário.
   * @param refeicao A refeição a ser adicionada.
   */
  addToQueue(refeicao: any): firebase.Promise<any>{
    return firebase.database().ref('users/'+ this._auth.uid +'/queue').child(refeicao.$key).set(true);
  }

}
