import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { WalletService } from '../../../core/services/wallet.service';

@Component({
    selector: 'app-change-pin',
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    templateUrl: './change-pin.component.html',
    styleUrls: ['./change-pin.component.scss']
})
export class ChangePinComponent {
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly walletService = inject(WalletService);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);

    hideOldPin = true;
    hideNewPin = true;
    hideConfirmPin = true;

    form = this.fb.nonNullable.group({
        oldPin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]],
        newPin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]],
        confirmPin: ['', [Validators.required]]
    }, { validators: this.pinMatchValidator });

    private pinMatchValidator(group: any) {
        const newPin = group.get('newPin')?.value;
        const confirmPin = group.get('confirmPin')?.value;
        if (!newPin || !confirmPin) return null;
        return newPin === confirmPin ? null : { pinMismatch: true };
    }

    goBack(): void {
        this.router.navigateByUrl('/settings');
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.error.set(null);
        this.success.set(null);

        const { oldPin, newPin } = this.form.getRawValue();

        this.walletService.setPin(newPin, oldPin).subscribe({
            next: (response) => {
                this.loading.set(false);
                this.success.set(response.message || 'Code PIN modifié avec succès');
                this.snackBar.open('Code PIN modifié avec succès', 'OK', { duration: 3000 });
                setTimeout(() => {
                    this.router.navigateByUrl('/settings');
                }, 1500);
            },
            error: (err) => {
                this.loading.set(false);
                this.error.set(err.error?.message || err.message || 'Erreur lors du changement de PIN');
            }
        });
    }

    showError(controlName: string, error: string): boolean {
        const control = this.form.get(controlName);
        return !!control && (control.touched || control.dirty) && control.hasError(error);
    }
}
