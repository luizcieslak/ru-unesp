import { Injectable } from '@angular/core';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { TimeService } from './time-service';

@Injectable()
export class RefeicaoService {

  constructor(public db: AngularFireDatabase, public time: TimeService) {
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

}
