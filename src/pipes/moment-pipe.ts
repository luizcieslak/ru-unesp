import { Injectable, Pipe } from '@angular/core';
import * as moment from 'moment';

/*
  Generated class for the MomentPipe pipe.

  See https://angular.io/docs/ts/latest/guide/pipes.html for more info on
  Angular 2 Pipes.
*/
@Pipe({
  name: 'momentPipe'
})
@Injectable()
export class MomentPipe {
  transform(value: Date|moment.Moment, ...args: any[]): any {
        let [format] = args;
        return moment(value).format(format);
    }
}

