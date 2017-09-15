import { Component } from '@angular/core';

import { FirebaseListObservable, AngularFireDatabase } from 'angularfire2/database';
import { UserService } from '../../providers/user-service';
import { AuthService } from '../../providers/auth-service';

import { Subject } from 'rxjs';

import { IonicPage } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-history',
  templateUrl: 'history.html',
})
export class HistoryPage {

  history: FirebaseListObservable<any>;
  subject: Subject<string>;

  constructor(private _auth: AuthService, private _user: UserService,
    private db: AngularFireDatabase) {
    this.subject = new Subject();
    //TODO: Aplicar filtro
    this.history = _user.history();
  }
  
  filterBy(type: string){
    console.log('filter by',type)
    this.subject.next(type);
  }



}
