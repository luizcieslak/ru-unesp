import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AjudaPage } from './ajuda';

@NgModule({
  declarations: [
    AjudaPage,
  ],
  imports: [
    IonicPageModule.forChild(AjudaPage),
  ],
  exports: [
    AjudaPage
  ]
})
export class AjudaModule {}
