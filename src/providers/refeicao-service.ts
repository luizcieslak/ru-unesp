import { Injectable } from '@angular/core';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { TimeService } from './time-service';
import { UserService } from './user-service';
import { AuthService } from './auth-service';

//import firebase namespace for functions that aren't in AngularFire2
import * as firebase from 'firebase/app';

@Injectable()
export class RefeicaoService {

  constructor(private db: AngularFireDatabase, private time: TimeService,
  private _user: UserService) {
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
   * Realizar a compra da refeição.
  */
  book(refeicao: any, uid: string, isVeg: boolean): void{
    this._user.debitSaldo(uid)
      .then(_ => {                    
         this.incrementCount(refeicao,isVeg)
            .then( _ => {
              this.subtractVagas(refeicao)
                .then( _ => {
                  this._user.addRefeicao(refeicao,uid)
                    .then( _ => {
                      this.addUser(refeicao, uid, isVeg)
                        .then( _ => console.log('book() success'))
                        .catch( error => console.log('Error in addUser()',error))
                     })
                     .catch(error => console.log('Error in addRefeicaoToUser() ',error))
                })
                .catch(error => console.log('Error in vagas() ',error));
            })
            .catch(error =>console.log('Error in count() ',error));
      })
      .catch(error =>console.log('Error in saldo() ',error));   
  }

  addUser(refeicao: any, uid: string, isVeg: boolean): firebase.Promise<any>{
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
    return userList.child(uid).set(true);
  }

  /**
   * Promise que faz uma transation no contador de usuários (default ou vegetariano)
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
   * Promise que faz uma transation no número de vagas. (vagas = users_count - usersVeg_count)
   */
  subtractVagas(refeicao: any): firebase.Promise<any>{ 
    //TODO: retornar uma Promise.reject() para qdo não tiver mais vaga
    return firebase.database().ref('/refeicoes/'+ refeicao.$key+ '/vagas')
              .transaction( vagas => {
                if(vagas>0) return vagas - 1;
                else return vagas;
              });
  }


}
