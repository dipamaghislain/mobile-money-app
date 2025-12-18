import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-pay-merchant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pay-merchant.html',
  styleUrl: './pay-merchant.scss',
})
export class PayMerchant {
  payForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.payForm = this.fb.group({
      merchantId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
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

    // Pour le moment, on simule simplement un paiement
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      alert('Paiement commerçant simulé avec succès (intégration backend à faire).');
    }, 1000);
  }
}
