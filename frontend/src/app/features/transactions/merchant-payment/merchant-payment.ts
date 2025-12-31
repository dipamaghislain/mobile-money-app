import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TransactionService } from '../../../core/services/transaction.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-merchant-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BottomNavComponent
  ],
  templateUrl: './merchant-payment.html',
  styleUrl: './merchant-payment.scss'
})
export class MerchantPaymentComponent {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    codeMarchand: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(100)]],
    pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern('^[0-9]*$')]]
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { codeMarchand, amount, pin } = this.form.value;

    this.transactionService.merchantPayment({ codeMarchand: codeMarchand!, montant: amount!, pin: pin! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Paiement effectué avec succès !');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
      }
    });
  }
}
