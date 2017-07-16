import { FormControl } from '@angular/forms';

export class EmailValidator {
  /**
   * Verifica se o email é valido através de uma expressão regular.
   */
  static isValid(control: FormControl): any {
    let EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;      

    return EMAIL_REGEXP.test(control.value) ? null : { invalidEmail : true};

  }
}