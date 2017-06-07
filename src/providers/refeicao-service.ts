import { Injectable } from '@angular/core';

import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';

import { TimeService } from './time-service';
import { UserService } from './user-service';
import { AuthService } from './auth-service';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

@Injectable()
export class RefeicaoService {

  constructor(private db: AngularFireDatabase, private time: TimeService,
  private _user: UserService, private _auth: AuthService) {
  }

  nextRefeicoes(): FirebaseListObservable<any>{
    const now = this.time.localTimestamp();

    return this.db.list('/refeicoes',{
      query:{
          orderByChild: 'timestamp',
          startAt: now
      }
    })
  }

  /**
   * Pega a referência da refeição no banco de dados.
   * @returns Observable.
   */
  refeicaoObservable(key: string): FirebaseObjectObservable<any>{
    return this.db.object('refeicoes/'+ key);
  }

 /**
   * Realizar a compra da refeição.
  */
  book(refeicao: any, isVeg: boolean): Promise<any>{
    // this._user.debitSaldo(uid)
    //   .then(_ => {                    
    //      this.incrementCount(refeicao,isVeg)
    //         .then( _ => {
    //           this.subtractVagas(refeicao)
    //             .then( _ => {
    //               this._user.addRefeicao(refeicao,uid)
    //                 .then( _ => {
    //                   this.addUser(refeicao, uid, isVeg)
    //                     .then( _ => console.log('book() success'))
    //                     .catch( error => console.log('Error in addUser()',error))
    //                  })
    //                  .catch(error => console.log('Error in addRefeicaoToUser() ',error))
    //             })
    //             .catch(error => console.log('Error in vagas() ',error));
    //         })
    //         .catch(error => console.log('Error in count() ',error));
    //   })
    //   .catch(error => console.log('Error in saldo() ',error));   
    const debitSaldo = this._user.debitSaldo();
    const incrementCount = this.incrementCount(refeicao, isVeg);
    const vagas = this.subtractVagas(refeicao);
    const addRefeicaoToUser = this._user.addRefeicao(refeicao);
    const addUserToRefeicao = this.addUser(refeicao, isVeg);

    return Promise.all([debitSaldo, incrementCount, vagas, addRefeicaoToUser, addUserToRefeicao]);
  }

  /**
   * Adiciona o usuário na refeição fornecida nos parâmetros
   * @param refeicao A refeição a ser manipulada
   * @param {boolean} isVeg Usuário vegetariano? 
   */
  addUser(refeicao: any, isVeg: boolean): firebase.Promise<any>{
    let userList;
    if(isVeg){
      userList = firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/usersVeg');
    }else{
      userList = firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/users');
    }

    //verificar se o usuario ja esta na lista
    //userList.child(this.auth.uid).once('value', snapshot => {
    //  if( snapshot.val() == null ) userList.child(this.auth.uid).set(true); //nao esta na lista
    //})

    //Adicionar o usuário direto, nesse ponto já se sabe que o usuário não está na lista
    return userList.child(this._auth.uid).set(true);
  }

  /**
   * Promise que faz uma transaction no contador de usuários da refeição
   * @param refeicao A refeição a ser manipulada
   * @param {boolean} isVeg Usuário vegetariano? 
  */
  incrementCount(refeicao: any, isVeg: boolean): firebase.Promise<any>{
    if(isVeg){
      return firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/usersVeg_count')
          .transaction( count => { return count + 1; });
    }else{
      return firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/users_count')
          .transaction( count => { return count + 1; });
    }
  }

  /**
   * Retorna uma Promise contendo número de vagas da refeição.
   */
  getVagas(refeicao: any): firebase.Promise<any>{
    return firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/vagas').transaction(vagas => vagas);
  }

  /**
   * Decrementa o número de vagas da refeição. (vagas = users_count - usersVeg_count)
   * @param refeicao A refeição a ser manipulada
   */
  subtractVagas(refeicao: any): firebase.Promise<any>{ 
    //TODO: retornar uma Promise.reject() para qdo não tiver mais vaga
    return firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/vagas')
              .transaction( vagas => {
                if(vagas>0) return vagas - 1;
                else return vagas;
              });
  }


   /**
    * Coloca o usuário na fila de espera da refeição
    * @param refeicao A refeição a ser manipulada
   */
  queue(refeicao: any): Promise<any>{
    //TODO: verificar se precisa fazer distinção de usuários (default e veg) na fila de espera.
    
    //Promise para adicionar o usuário na fila da refeição.
    const refeicaoQueue = firebase.database().ref('refeicoes/'+ refeicao.$key+ '/queue').child(this._auth.uid).set(true);
    const userQueue = this._user.addToQueue(refeicao);

    return Promise.all([refeicaoQueue, userQueue]);
  }
}
