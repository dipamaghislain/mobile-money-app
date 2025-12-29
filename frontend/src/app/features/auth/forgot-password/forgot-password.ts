import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  form: FormGroup;
  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const { email } = this.form.value;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set(true);
        
        // En développement, afficher le token dans la console
        if (response.resetToken && response.resetUrl) {
          console.log('🔗 Lien de réinitialisation:', response.resetUrl);
          this.snackBar.open(
            'Lien de réinitialisation généré. Vérifiez la console pour le lien (développement uniquement).',
            'OK',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(
            'Si cet email existe, un lien de réinitialisation vous a été envoyé.',
            'OK',
            { duration: 5000 }
          );
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
        this.snackBar.open(err.message || 'Une erreur est survenue', 'OK', {
          duration: 5000
        });
      }
    });
  }
}
