import { Injectable } from '@angular/core';

import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';

import { TimeService } from './time-service';
import { UserService } from './user-service';
import { AuthService } from './auth-service';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

import { Observable } from "rxjs/Rx";

import 'rxjs/add/operator/take';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

const pageLength = 5;

@Injectable()
export class RefeicaoService {

  nextPageCursor: any;
  pages = [];
  currentPage: number;

  constructor(private db: AngularFireDatabase, private time: TimeService,
    private _user: UserService, private _auth: AuthService) {
    this.currentPage = 0;
  }

  /**
   * Retorna a próxima página de refeições de acordo com a constante pageLength
   */
  nextPage(): Observable<any> {

    return Observable.create(subscriber => {
      //Inicialização das variáveis
      const now = this.time.localTimestamp();
      let query: Observable<any>;

      console.log('searching for the next page. cursor:', this.nextPageCursor);

      //Realizar a query com ou sem o cursor.
      if (this.nextPageCursor == undefined) {
        query = this.db.list('/refeicoes', {
          query: {
            orderByChild: 'timestamp',
            startAt: now,
            limitToFirst: pageLength + 1 //+1 para guardar o último como cursor
          }
        });
      } else {
        query = this.db.list('/refeicoes', {
          query: {
            orderByChild: 'timestamp',
            startAt: this.nextPageCursor.timestamp, //Como o cursor existe, começar a query por ele
            limitToFirst: pageLength + 1 //+1 para guardar o último como cursor
          }
        });
      }

      //Subscribe na query para retirar a última refeição
      //e colocá-la como cursos
      query.take(1).subscribe(result => {
        this.nextPageCursor = result[result.length - 1];
        console.log('new cursor', moment(this.nextPageCursor.timestamp).format('LLLL'));
        if (result.length > pageLength) {
          //retirar a ultima entrada
          this.nextPageCursor = result.pop();
          result.lastPage = false;
        }

        //armazenar a página no array pages[]
        this.pages.push(result);
        console.log('new page',this.currentPage, this.pages[this.currentPage]);
        //Atualizar a flag 'currentPage'
        this.currentPage++;
        

        //verificar se há uma próxima página para mostrar na UI
        this.db.list('/refeicoes', {
          query: {
            orderByChild: 'timestamp',
            startAt: moment(this.nextPageCursor.timestamp).add(1, 'days').valueOf(), //o próximo dia
            limitToFirst: 1 //se houver pelo menos uma entrada, há uma nova página
          }
        }).take(1).subscribe(nextpage =>{
          result.lastPage = nextpage.length == 0;
          //Enviar os resultados para a Observable
          subscriber.next(result);
          subscriber.complete();
        });

      })

    })


  }

  /**
   * Retorna a página anterior de refeições de acordo com a constante pageLength
   */
  previousPage(): Observable<any> {
    return Observable.create(subscriber => {
      //Atualizar a flag 'currentPage'
      this.currentPage -= 1;
      //Atualizar o cursor da próxima página
      this.nextPageCursor = this.pages[this.currentPage][0];

      //Sinalizar caso seja a primeira página
      if(this.currentPage == 0){
        this.pages[this.currentPage].firstPage = true;
      }

      //Enviar os resultados para a Observable.
      subscriber.next(this.pages[this.currentPage]);
      subscriber.complete();
    })

  }



  /**
   * Pega a referência da refeição no banco de dados.
   * @returns Observable.
   */
  refeicaoObservable(key: string): FirebaseObjectObservable<any> {
    return this.db.object(`refeicoes/${key}`);
  }

  /**
   * Realiza a reserva da refeição escolhida pelo usuário logado.
   * @param refeicao A refeição escolhida
   * @param isVeg Usuário é vegetariano ou não.
   */
  book(refeicao: any, isVeg: boolean): firebase.Promise<any> {
    return new firebase.Promise((resolve, reject) => {
      //verificar se o usuário pode comprar a refeição escolhida.
      this._user.canBuy(refeicao).subscribe(result => {
        //Se result for uma string, então ocorreu algum problema
        if (typeof result === 'string' || result instanceof String) {
          reject(new Error(result as string));
        } else {
          //Operações que precisam ser feitas para realizar o book()
          const debitSaldo = this._user.debitSaldo();
          const incrementCount = this.incrementCount(refeicao, isVeg);
          const vagas = this.subtractVagas(refeicao);
          const addRefeicaoToUser = this._user.addRefeicao(refeicao);
          const addUserToRefeicao = this.addUser(refeicao, isVeg);
          resolve(Promise.all([debitSaldo, incrementCount, vagas, addRefeicaoToUser, addUserToRefeicao]));
        }
      })
    })
  }

  /**
   * Adiciona o usuário na refeição fornecida nos parâmetros
   * @param refeicao A refeição a ser manipulada
   * @param {boolean} isVeg Usuário vegetariano? 
   */
  addUser(refeicao: any, isVeg: boolean): firebase.Promise<any> {
    let userList;
    if (isVeg) {
      userList = firebase.database().ref(`/refeicoes/${refeicao.$key}/usersVeg`);
    } else {
      userList = firebase.database().ref(`/refeicoes/${refeicao.$key}/users`);
    }

    //verificar se o usuario ja esta na lista
    //userList.child(this.auth.uid).once('value', snapshot => {
    //  if( snapshot.val() == null ) userList.child(this.auth.uid).set(true); //nao esta na lista
    //})

    //Adicionar o usuário direto, nesse ponto já se sabe que o usuário não está na lista
    return userList.child(this._auth.uid).set(true);
  }

  /**
   * Promise que faz uma incrementa o contador de usuários da refeição
   * @param refeicao A refeição a ser manipulada
   * @param {boolean} isVeg Usuário vegetariano? 
  */
  incrementCount(refeicao: any, isVeg: boolean): firebase.Promise<any> {
    if (isVeg) {
      return firebase.database().ref(`/refeicoes/${refeicao.$key}/usersVeg_count`)
        .transaction(count => { return count + 1; });
    } else {
      return firebase.database().ref(`/refeicoes/${refeicao.$key}/users_count`)
        .transaction(count => { return count + 1; });
    }
  }

  /**
   * Retorna uma Promise contendo número de vagas da refeição.
   */
  getVagas(refeicao: any): firebase.Promise<any> {
    return firebase.database().ref(`/refeicoes/${refeicao.$key}/vagas`).transaction(vagas => vagas);
  }

  /**
   * Decrementa o número de vagas da refeição. (vagas = users_count - usersVeg_count)
   * @param refeicao A refeição a ser manipulada
   */

  subtractVagas(refeicao: any): firebase.Promise<any> {
    //TODO: retornar uma Promise.reject() para qdo não tiver mais vaga
    return new firebase.Promise((resolve, reject) => {
      firebase.database().ref(`/refeicoes/${refeicao.$key}/vagas`)
        .transaction(vagas => {
          console.log('subtractVagas()', vagas)
          if (vagas > 0) {
            resolve(true);
            return vagas - 1;
          } else if (vagas == 0) {
            //TODO: ativar a flag sold_out aqui.
            reject(new Error('Vagas = 0 '));
            return vagas;
          } else { // == null
            return vagas;
          }
        });
    })
  }

  /**
   * Pega a posição do usuário a ser adicionado na fila baseado no contador.
   * @param refeicao A refeição selecionada
   */
  getUserPos(refeicao: any): firebase.Promise<any> {
    return firebase.database().ref(`/refeicoes/${refeicao.$key}/queue_count`).transaction(count => count);
  }

  /**
   * Coloca o usuário na fila de espera da refeição escolhida.
   * @param refeicao A refeição escolhida
  */
  queue(refeicao: any): firebase.Promise<any> {
    //TODO: verificar se precisa fazer distinção de usuários (default e veg) na fila de espera.
    return new firebase.Promise((resolve, reject) => {

      //verificar se o usuário pode entrar na fila
      this._user.canQueue(refeicao).subscribe(result => {
        //Se result for uma string, então ocorreu algum problema
        if (typeof result === 'string' || result instanceof String) {
          reject(new Error(result as string));
        } else {
          //Pegar a posição do usuário
          this.getUserPos(refeicao)
            .then(count => {
              const pos: Number = count.snapshot.val();
              //Promises para adicionar o usuário na fila da refeição.
              const refeicaoQueue = firebase.database().ref(`/refeicoes/${refeicao.$key}/queue`)
                .child(this._auth.uid).set(pos);
              const queueCount = firebase.database().ref(`/refeicoes/${refeicao.$key}/queue_count`).transaction(count => count + 1);
              const userQueue = this._user.addToQueue(refeicao, pos);
              //Debitar o saldo do usuário
              resolve(Promise.all([refeicaoQueue, queueCount, userQueue]));
            })
            .catch(reason => console.log(reason));
        }
      })
    })
  }

  /**
   * Remove o usuário da lista da refeição, diminuindo o contador.
   * @param refeicao A refeição a ser manipulada
   * @param {booelan} isVeg Usuário vegetariano
   */
  removeUser(refeicao: any, isVeg: boolean): firebase.Promise<any> {
    return isVeg ?
      Promise.all([
        firebase.database().ref(`/refeicoes/${refeicao.$key}/usersVeg/${this._auth.uid}`).remove(),
        firebase.database().ref(`/refeicoes/${refeicao.$key}/usersVeg_count/`).transaction(count => count - 1)])
      :
      Promise.all([
        firebase.database().ref(`/refeicoes/${refeicao.$key}/users/${this._auth.uid}`).remove(),
        firebase.database().ref(`/refeicoes/${refeicao.$key}/users_count/`).transaction(count => count - 1)])
  }

  /**
   * Remove o usuário da refeição, reembolsando-o.
   * @param {any} refeicao A refeição selecionada.
   */
  remove(refeicao: any, isVeg: boolean): firebase.Promise<any> {
    //OBS: O reembolso do usuário é feito pelo Firebase Functions.
    //verificar se está dentro do tempo
    if (this.time.isAllowed(refeicao.timestamp)) {
      //Adicionar uma vaga na refeicao
      const vagas = firebase.database().ref(`/refeicoes/${refeicao.$key}/vagas`).transaction(vagas => vagas + 1);
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
  removeQueue(refeicao: any): firebase.Promise<any> {
    return new firebase.Promise((resolve, reject) => {
      if (this.time.isAllowed(refeicao.timestamp)) {
        //Remover o usuário da da fila
        const removeUser = firebase.database().ref(`/refeicoes/${refeicao.$key}/queue/${this._auth.uid}`).remove();
        //decrementar o contador da fila
        const queueCount = firebase.database().ref(`/refeicoes/${refeicao.$key}/queue_count`).transaction(queue => queue - 1);
        //Remover a refeição do usuário
        const removeQueue = this._user.removeQueue(refeicao);
        //TODO: Verificar se esse reembolso precisa ser feito na Firebase Functions.
        const incrementSaldo = this._user.incrementSaldo();

        resolve(Promise.all([removeUser, queueCount, removeQueue, incrementSaldo]));
      } else {
        reject(new Error('not allowed'));
      }
    })
  }
}
