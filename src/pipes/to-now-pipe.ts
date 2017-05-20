import { Injectable, Pipe } from '@angular/core';
import * as moment from 'moment';

/*
  Generated class for the MomentPipe pipe.

  See https://angular.io/docs/ts/latest/guide/pipes.html for more info on
  Angular 2 Pipes.
*/
@Pipe({
  name: 'toNow'
})
@Injectable()
export class ToNowPipe {
  transform(value: Date|moment.Moment): any {
        return moment(value).toNow();
    }
}

