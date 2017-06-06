import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

import * as Rx from 'rxjs/Rx';

@Injectable()
export class TimeService {

  constructor(public http: Http) {
  }

  /**
   * Verifica se a operação desejada é possível de acordo com a timestamp da refeição. A regra atual é que as operações
   * podem ser feitas até 1 dia antes da refeição.
   * @argument {Number} timestamp timestamp da refeição
   */
  isAllowed(timestamp: Number): boolean{
    //TODO: Ao invés de usar moment.now(), usar o moment do servidor.
    return moment().isBefore(moment(timestamp).subtract(1,'days'));
  }

  /**
   * Pega a hora do servidor do Google Cloud, no formato UTC.
   * @returns Observable com a timestamp.
   */
  serverTimestamp(): Rx.Observable<any>{
    return this.http.get(`https://us-central1-unespru.cloudfunctions.net/utc`).map(res => res.json());
  }

  localTimestamp(): Number{
    return moment().valueOf();
  }

}
