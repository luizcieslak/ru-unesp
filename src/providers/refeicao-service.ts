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
    console.log('nextREfeicoes()');
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


  book(refeicao: any, isVeg: boolean): Promise<any>{
    console.log('book()');

    if(this._user.canBuy(refeicao)){
      const debitSaldo = this._user.debitSaldo();
      const incrementCount = this.incrementCount(refeicao, isVeg);
      const vagas = this.subtractVagas(refeicao);
      const addRefeicaoToUser = this._user.addRefeicao(refeicao);
      const addUserToRefeicao = this.addUser(refeicao, isVeg);
      return Promise.all([debitSaldo, incrementCount, vagas, addRefeicaoToUser, addUserToRefeicao]);
    }else{
      return Promise.reject('canBuy() false');
    }


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
    console.log('subtractVagas()');
    return firebase.database().ref('/refeicoes/'+ refeicao.$key +'/vagas') 
              .transaction( vagas => { 
                console.log(vagas)
                if(vagas > 0) return vagas - 1; 
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
    const queueCount = firebase.database().ref('refeicoes/'+ refeicao.$key+ '/queue_count').transaction(count => count + 1);
    const userQueue = this._user.addToQueue(refeicao);

    return Promise.all([refeicaoQueue, queueCount, userQueue]);
  }

  /**
   * Remove o usuário da lista da refeição, diminuindo o contador.
   * @param refeicao A refeição a ser manipulada
   * @param {booelan} isVeg Usuário vegetariano
   */
  removeUser(refeicao: any, isVeg: boolean): firebase.Promise<any>{
    return isVeg ? 
      Promise.all([
        firebase.database().ref('/refeicoes/' + refeicao.$key + '/usersVeg/'+ this._auth.uid).remove(),
        firebase.database().ref('/refeicoes/' + refeicao.$key + '/usersVeg_count/').transaction(count => count - 1) ])
      :
      Promise.all([
        firebase.database().ref('/refeicoes/' + refeicao.$key + '/users/'+ this._auth.uid ).remove(),
        firebase.database().ref('/refeicoes/' + refeicao.$key + '/users_count/').transaction(count => count - 1) ])
      
  }

  /**
   * Remove o usuário da refeição, reembolsando-o.
   * @param {any} refeicao A refeição selecionada.
   */
  remove(refeicao: any, isVeg: boolean): firebase.Promise<any>{

    //verificar se está dentro do tempo
    if(this.time.isAllowed(refeicao.timestamp)){

      //Adicionar uma vaga na refeicao
      const vagas = firebase.database().ref('/refeicoes/'+ refeicao.$key +'/vagas').transaction(vagas => vagas + 1);
      const removeRefeicao = this._user.removeRefeicao(refeicao);
      const removeUser = this.removeUser(refeicao, isVeg);

      return Promise.all([vagas, removeRefeicao, removeUser]);
    }
    return Promise.reject(false);
  }

  /**
   * Remove o usuário da fila de espera da refeição, reembolsando-o.
   * @param {any} refeicao A refeição selecionada.
   */
  removeQueue(refeicao: any): firebase.Promise<any>{
    //Remover o usuário da da fila
    const removeUser = firebase.database().ref('/refeicoes/'+ refeicao.$key +'/queue/'+ this._auth.uid).remove();

    //decrementar o contador da fila
    const queueCount = firebase.database().ref('/refeicoes/'+ refeicao.$key +'/queue_count').transaction(queue => queue - 1);

    //Remover a refeição do usuário
    const removeQueue = this._user.removeQueue(refeicao);

    return this.time.isAllowed?
      Promise.all([removeUser, queueCount, removeQueue]) :
      Promise.reject('not allowed');
  }


  /**
   * Tenta transferir a vaga do usuário entre uma refeição e outra.
   * @param {any} refeicao A refeição de origem.
   * @param {string} destKey A chave da refeição de destino.
   */
  transfer(refeicao: any, dest: any, isVeg: boolean): firebase.Promise<any>{
    //Observable da refeicao origem.
    const refeicaoUsers = this.db.list('/refeicoes/'+ refeicao.$key +'/users');

    //Observable da lista de refeicoes do usuario.
    const userRefeicoes = this.db.list('/users/'+this._auth.uid+'/refeicoes/');

    //verificar se a refeicao destino tem vagas.
    // const vagas = firebase.database().ref('/refeicoes/'+ dest +'/vagas').transaction(
    //   vagas => {
    //     if(vagas > 0) return vagas = vagas - -1;
    //     else return Promise.reject('Sem vagas');
    //   }
    // );

    const removeUser = this.removeUser(refeicao, isVeg);
    const canBuy = this._user.canBuy(dest);
    const book = this.book(dest, isVeg);

    
    return canBuy?
      Promise.all([removeUser, book]) :
      Promise.reject(false);
  }
}
