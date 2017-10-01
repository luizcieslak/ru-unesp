import { Component } from '@angular/core';

import { FirebaseListObservable } from 'angularfire2/database';
import { UserService } from '../../providers/user-service';

import { Subject } from 'rxjs';

import { IonicPage } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-history',
  templateUrl: 'history.html',
})
export class HistoryPage {

  history: Promise<any>;
  subject: Subject<string>;

  constructor(private _user: UserService) {
    this.subject = new Subject();
    //TODO: Aplicar filtro
    this.history = _user.history();
  }
  
  filterBy(type: string){
    console.log('filter by',type)
    this.subject.next(type);
  }



}
