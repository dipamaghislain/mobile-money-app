import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function pinValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;

        if (!value) {
            return null; // Let required validator handle empty values
        }

        const isValid = /^\d{4}$/.test(value);

        return isValid ? null : { invalidPin: true };
    };
}
