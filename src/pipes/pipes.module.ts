
import { NgModule } from '@angular/core';

import { FormatPipe } from './format-pipe';
import { FromNowPipe } from './from-now-pipe';
import { KeysPipe } from './keys-pipe';
import { TitleCasePipe } from './title-case-pipe';
import { UserPosPipe } from './user-pos-pipe';


@NgModule({
        declarations: [
                FormatPipe,
                FromNowPipe,
                KeysPipe,
                TitleCasePipe,
                UserPosPipe
        ],
        imports: [

        ],
        exports: [
                FormatPipe,
                FromNowPipe,
                KeysPipe,
                TitleCasePipe,
                UserPosPipe
        ]
})
export class PipesModule { }