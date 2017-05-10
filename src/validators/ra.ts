import { FormControl } from '@angular/forms';

export class RaValidator {
  static isValid(control: FormControl): any {
    let RA_REGEXP = /^\d+$/;  //this is validating only numbers. To have a better application, we need to check with UNESP's system.

    return RA_REGEXP.test(control.value) ? null : { invalidRA: true};

  }
}