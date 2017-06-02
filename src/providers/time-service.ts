import { Injectable } from '@angular/core';

//moment.js library for handling timestamps
import * as moment from 'moment';
import 'moment/locale/pt-br';

@Injectable()
export class TimeService {

  constructor() {
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

}
