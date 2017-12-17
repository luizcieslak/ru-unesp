import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RefeicaoDetailPage } from './refeicao-detail';

@NgModule({
  declarations: [
    RefeicaoDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(RefeicaoDetailPage),
  ],
  exports: [
    RefeicaoDetailPage
  ]
})
export class RefeicaoDetailModule {}
