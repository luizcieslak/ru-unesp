import { Injectable } from '@angular/core';

import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';

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
import { query } from '@angular/core/src/animation/dsl';

const pageLength = 5;

@Injectable()
export class RefeicaoService {

  cursor: any[] = [];
  currentPage: number;

  constructor(private db: AngularFireDatabase, private time: TimeService,
    private _user: UserService, private _auth: AuthService) {
    this.currentPage = 0;
  }

  /**
   * Retorna a próxima página de refeições de acordo com a constante pageLength
   */
  async nextPage(firstPage?: boolean): Promise<any> {
    //Se essa função estiver sendo executada pela primeira vez,
    //O cursor da primeira página se torna o timestamp atual
    //e a flag currentPage é zerada.
    if (firstPage) {
      const now = this.time.localTimestamp();
      this.currentPage = 0;
      this.cursor[this.currentPage] = now;
    }

    //Inicialização das variáveis
    let query: Observable<any>;

    if (this.cursor[this.currentPage] == undefined) {
      //Se não há um cursor, quer dizer que não há uma página a ser exibida.
      return Promise.resolve();
    } else {
      //Realizar a query com o cursor da página atual.
      query = this.db.list('/refeicoes', {
        query: {
          orderByChild: 'timestamp',
          startAt: this.cursor[this.currentPage],
          limitToFirst: pageLength
        }
      });
    }

    console.log('searching for the next page. cursor:', moment(this.cursor[this.currentPage]).format('L'));
    //Executar função getNextCursor() e retornar.
    return await this.getNextCursor(query);
  }

  /**
   * Retorna a página anterior de refeições de maneira síncrona, 
   * utilizando o cursor da página atual como referência.
   */
  async previousPage(): Promise<any> {
    //Inicialização das variáveis
    const now = this.time.localTimestamp();

    //Decrementar o contador de páginas
    this.currentPage--;


    //Realizar a query com o cursor da página anterior 
    //-1, para não incluir o próprio cursor no resultado.
    return this.db.list('/refeicoes', {
      query: {
        orderByChild: 'timestamp',
        endAt: this.cursor[this.currentPage] - 1,
        limitToLast: pageLength
      }
    })
      .share() //share para que a função não seja chamada mais de uma vez
      .take(1) //receber o primeiro valor retornado da Observable
      .toPromise(); //converter para Promise para utilizar o ES7 async/await.
  }

  /**
   * Verifica se é possível navegar para a página anterior da lista de refeições.
   */
  canGoBack(): boolean {
    return this.currentPage > 1;
  }

  /**
   * Verifica se é possível navegar para a página seguinte da lista de refeições.
   */
  canGoForward(): boolean {
    return this.cursor[this.currentPage] != undefined;
  }

  /**
   * Busca pelo cursor de paginação da próxima página a ser exibida.
   * @param query Query que está sendo realizada.
   */
  async getNextCursor(query: Observable<any>): Promise<any> {
    //Inicialização de variáveis.
    const refeicoes = await query.take(1).toPromise();
    const lastRef = refeicoes[refeicoes.length - 1];

    //Incrementar o contador de páginas
    this.currentPage++;

    //Se o número de refeições retornada pela query é igual ao tamanho da página,
    //É necessário realizar outra query para verificar se há uma próxima página
    //a ser mostrada e pegar o cursor correto.
    if (refeicoes.length == pageLength) {
      const cursorPromise = this.db.list('/refeicoes', {
        query: {
          orderByChild: 'timestamp',
          startAt: lastRef.timestamp + 1,
          limitToFirst: 1
        }
      }).take(1).toPromise();


      const refeicaoCursor = await cursorPromise;
      //Se a query retornar um array vazio, isso significa que não há mais registros
      //Portanto, o cursor é undefined
      if (refeicaoCursor.length > 0) this.cursor[this.currentPage] = refeicaoCursor[0].timestamp;
      else this.cursor[this.currentPage] = undefined;
    } else {
      //Se o númerofor menor, não há cursor para a próxima página 
      // e a aplicação deve avisar o usuário que não há uma próxima página.
      this.cursor[this.currentPage] = undefined;
    }

    console.log('new cursor for page', this.currentPage, moment(this.cursor[this.currentPage]).format('L'));

    return query.take(1).toPromise();
  }

  nextRefeicoes(): FirebaseListObservable<any>{
    return this.db.list('refeicoes/',{
      query: {
        orderByChild: 'timestamp',
        startAt: moment.now().valueOf()
      }
    });
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
  book(refeicao: any, isVeg: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
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
  async addUser(refeicao: any, isVeg: boolean): Promise<any> {
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
    return userList.child(await this._auth.uid()).set(true);
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

  subtractVagas(refeicao: any): Promise<any> {
    //TODO: retornar uma Promise.reject() para qdo não tiver mais vaga
    return new Promise((resolve, reject) => {
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
  async queue(refeicao: any): Promise<any> {
    const uid = await this._auth.uid();
    //TODO: verificar se precisa fazer distinção de usuários (default e veg) na fila de espera.
    return new Promise((resolve, reject) => {

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
                .child(uid).set(pos);
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
  async removeUser(refeicao: any, isVeg: boolean): Promise<any> {
    const uid = await this._auth.uid();
    return isVeg ?
      Promise.all([
        firebase.database().ref(`/refeicoes/${refeicao.$key}/usersVeg/${uid}`).remove(),
        firebase.database().ref(`/refeicoes/${refeicao.$key}/usersVeg_count/`).transaction(count => count - 1)])
      :
      Promise.all([
        firebase.database().ref(`/refeicoes/${refeicao.$key}/users/${uid}`).remove(),
        firebase.database().ref(`/refeicoes/${refeicao.$key}/users_count/`).transaction(count => count - 1)])
  }

  /**
   * Remove o usuário da refeição, reembolsando-o.
   * @param {any} refeicao A refeição selecionada.
   */
  remove(refeicao: any, isVeg: boolean): Promise<any> {
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
  async removeQueue(refeicao: any): Promise<any> {
    const uid = await this._auth.uid();
    return new Promise((resolve, reject) => {
      if (this.time.isAllowed(refeicao.timestamp)) {
        //Remover o usuário da da fila
        const removeUser = firebase.database().ref(`/refeicoes/${refeicao.$key}/queue/${uid}`).remove();
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
