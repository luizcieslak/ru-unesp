import { Injectable, Pipe } from '@angular/core';
import * as moment from 'moment';
import { AuthService } from '../providers/auth-service';

//Pipe que recebe o objeto da fila de uma refeição e retorna a posição do usuário logado.
@Pipe({
  name: 'userPos'
})
@Injectable()
export class UserPosPipe {

  constructor(private _auth: AuthService){}

  transform(value: any, ...args: any[]): any {
        //value.hasOwnProperty(this._auth.uid);
        return value.queue[this._auth.uid] - value.queue_released;
    }
}

