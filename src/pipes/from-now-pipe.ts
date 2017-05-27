import { Injectable, Pipe } from '@angular/core';
import * as moment from 'moment';

// Pipe que utiliza a função fromNow() do momentjs para timestamps.

@Pipe({
  name: 'fromNow'
})

@Injectable()
export class FromNowPipe {
  transform(value: Date|moment.Moment): any {
        return moment(value).fromNow();
    }
}

