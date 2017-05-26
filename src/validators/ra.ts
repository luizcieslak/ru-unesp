import { FormControl } from '@angular/forms';

export class RaValidator {
  static isValid(control: FormControl): any {
    let RA_REGEXP = /^\d+$/;  //Valida somente números. Para uma aplicação melhor, deve-se validar o RA no sistema da UNESP.

    return RA_REGEXP.test(control.value) ? null : { invalidRA: true};

  }
}