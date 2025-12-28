import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyXOF',
  standalone: true
})
export class CurrencyXOFPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || isNaN(value as number)) {
      return '0 XOF';
    }

    const numeric = Number(value);

    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numeric) + ' XOF';
  }
}

