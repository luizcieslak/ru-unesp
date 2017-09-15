import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RefeicaoListPage } from './refeicao-list';

import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    RefeicaoListPage,
  ],
  imports: [
    IonicPageModule.forChild(RefeicaoListPage),
    PipesModule
  ],
  exports: [
    RefeicaoListPage
  ]
})
export class RefeicaoListModule {}
