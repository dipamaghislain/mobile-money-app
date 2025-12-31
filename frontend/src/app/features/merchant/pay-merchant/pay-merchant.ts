import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-pay-merchant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule,
    BottomNavComponent,
  ],
  templateUrl: './pay-merchant.html',
  styleUrl: './pay-merchant.scss',
})
export class PayMerchant {
  payForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.payForm = this.fb.group({
      merchantId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
      description: [''],
    });
  }

  get f() {
    return this.payForm.controls;
  }

  onSubmit(): void {
    if (this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    
    // Simulation de paiement
    setTimeout(() => {
      this.loading = false;
      this.snackBar.open('✓ Paiement effectué avec succès !', 'OK', { 
        duration: 4000,
        panelClass: ['success-snackbar']
      });
      this.payForm.reset();
    }, 1500);
  }
}
