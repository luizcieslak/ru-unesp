import { Injectable, Inject } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';

import { AuthService } from './auth-service';
import { RefeicaoService } from './refeicao-service'; //not working :(
import { TimeService } from './time-service';

import Rx from "rxjs/Rx";
//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';


@Injectable()
export class UserService {

  //can't import RefeicaoService here, gives 'can't resolve all parameters' error.
  constructor(private afDB: AngularFireDatabase, private _auth: AuthService,
  private _time: TimeService) {
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
   * Retorna o saldo do usuário logado.
   */
  getSaldo(): firebase.Promise<any>{
    return firebase.database().ref('users/'+ this._auth.uid +'/saldo').transaction(saldo => saldo);
  }

  isVeg(): firebase.Promise<any>{
    return firebase.database().ref('users/'+this._auth.uid+'/veg').once('value');
  }

  /**
   * Verifica se o usuário pode comprar a refeição.
   * 
   * Itens verificados:
   * - Vagas da refeição > 0
   * - Saldo do usuário > 0
   * - Usuário não comprou a refeição
   * - Está dentro do tempo estipulado.
   */
  canBuy(refeicao: any): Rx.Observable<any>{
    let subject = new Rx.Subject<any>();

    let vagas: Number;
    let saldo: Number;
    let bought: boolean;
    let isQueueEmpty: boolean;
    const p1 = firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/vagas').transaction(
      vagas => vagas); //RefeicaoService not working
    const p2 = this.getSaldo();
    const p3 = this.bought(refeicao);
    const p4 = firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/queue_count').transaction(
      count => count); //RefeicaoService not working

    Promise.all([p1,p2,p3,p4])
      .then(values =>{
        //values[0] é o resultado de p1, que é o n de vagas
        //values[1] é o resultado de p2, que é o saldo.
        vagas = values[0].snapshot.val();
        saldo = values[1].snapshot.val();
        bought = values[2];
        isQueueEmpty = values[3].snapshot.val() == 0;
        //Verificar se as condições são verdadeiras
        if(vagas > 0)
          if(saldo > 0)
            if(!bought)
              if(isQueueEmpty)
                if(this._time.isAllowed(refeicao.timestamp)){
                  subject.next(true);
                  subject.complete();
                }
                else
                  subject.next('Tempo esgotado');
              else
                subject.next('Fila não vazia');
            else
              subject.next('Comprado');
          else
            subject.next('Sem saldo');
        else
          subject.next('Sem vagas');
      })
      .catch(error => console.log('error in UserService canBuy()', error));
    
    return subject;
  }

  /**
   * Verifica se o usuário pode comprar entrar na fila da refeição
   * 
   * Itens verificados:
   * - Vagas da refeição == 0
   * - Saldo do usuário > 0
   * - Usuário não está na fila
   * - Está dentro do tempo estipulado.
   */
  canQueue(refeicao: any): Rx.Observable<any>{
    let subject = new Rx.Subject<any>();

    let vagas: Number;
    let saldo: Number;
    let isQueued: boolean;
    let bought: boolean;
    const p1 = firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/vagas').transaction(vagas => vagas); //RefeicaoService not working
    const p2 = this.getSaldo();
    const p3 = this.isQueued(refeicao);
    const p4 = this.bought(refeicao);

    Promise.all([p1,p2,p3,p4])
      .then(values =>{
        //values[0] é o resultado de p1, que é o n de vagas
        //values[1] é o resultado de p2, que é o saldo.
        vagas = values[0].snapshot.val();
        saldo = values[1].snapshot.val();
        isQueued = values[2];
        bought = values[3];

        //Verificar se as condições são verdadeiras
        if(vagas == 0)
          if(saldo > 0)
            if(!isQueued)
              if(!bought)
                if(this._time.isAllowed(refeicao.timestamp)){
                  //TODO: verificar se o tempo para entrar na fila é o mesmo para comprar a refeição
                  subject.next(true);
                  subject.complete();
                }
                else subject.next('Tempo esgotado');
              else subject.next('Comprado');
            else subject.next('Entrou na fila');
          else subject.next('Sem saldo');
        else subject.next(false);
      })
      .catch(error => console.log('error in UserService canBuy()', error));
    
    return subject;
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
   * Adiciona uma unidade no saldo do usuário
   */
  incrementSaldo(): firebase.Promise<any> {
    return firebase.database().ref('/users/'+ this._auth.uid + '/saldo')
      .transaction( saldo => saldo + 1);
  }

  /**
   * Verifica se o usuário já comprou a refeição
   * @argument {string} uid id do usuário
   * @argument {any} refeicao Refeição a ser analisada
   * @returns {true} Se já comprou.
   */
  bought(refeicao: any): firebase.Promise<any> {
    return new firebase.Promise((resolve, reject) => {
      const p = firebase.database().ref('users/'+ this._auth.uid +'/refeicoes/' + refeicao.$key)
        .once('value', snapshot => {
            resolve(snapshot.val() !== null);
        })
    });
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
  isQueued(refeicao: any): firebase.Promise<any>{
    return new firebase.Promise((resolve, reject) => {
      const p = firebase.database().ref('users/'+ this._auth.uid +'/queue/' + refeicao.$key)
        .once('value', snapshot => {
            resolve(snapshot.val() !== null);
        })
    });
  }

  /**
   * Adiciona a refeição na fila do usuário.
   * @param refeicao A refeição a ser adicionada.
   */
  addToQueue(refeicao: any, pos: Number): firebase.Promise<any>{
    return Promise.all([
      firebase.database().ref('users/'+ this._auth.uid +'/queue').child(refeicao.$key).set(pos),
      this.debitSaldo() ]);
  }

  removeRefeicao(refeicao: any): firebase.Promise<any>{
    return firebase.database().ref('users/' + this._auth.uid + '/refeicoes/'+ refeicao.$key).remove();
  }

  removeQueue(refeicao: any): firebase.Promise<any>{
    return firebase.database().ref('users/' + this._auth.uid + '/queue/'+ refeicao.$key).remove();
  }

}
