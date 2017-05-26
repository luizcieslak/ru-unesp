import { Injectable, Pipe } from '@angular/core';
import * as moment from 'moment';

// Pipe que utiliza a função toNow() do momentjs para timestamps.

@Pipe({
  name: 'toNow'
})

@Injectable()
export class ToNowPipe {
  transform(value: Date|moment.Moment): any {
        return moment(value).toNow();
    }
}

