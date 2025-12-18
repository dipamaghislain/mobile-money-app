import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function amountValidator(min: number = 0): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;

        if (value === null || value === undefined || value === '') {
            return null;
        }

        const amount = Number(value);

        if (isNaN(amount) || amount <= min) {
            return { invalidAmount: { min, actual: amount } };
        }

        return null;
    };
}
