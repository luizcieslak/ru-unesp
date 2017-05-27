import { Injectable, Pipe } from '@angular/core';
import * as moment from 'moment';

// Pipe que utiliza a função format() do momentjs para timestamps.
@Pipe({
  name: 'format'
})
@Injectable()
export class FormatPipe {
  transform(value: Date|moment.Moment, ...args: any[]): any {
        let [format] = args;
        return moment(value).format(format);
    }
}

