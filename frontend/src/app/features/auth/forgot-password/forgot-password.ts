import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

type Step = 'email' | 'code' | 'password' | 'success';

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
  // Étapes: email -> code -> password -> success
  currentStep = signal<Step>('email');
  
  emailForm: FormGroup;
  codeForm: FormGroup;
  passwordForm: FormGroup;
  
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Données stockées entre les étapes
  userEmail = '';
  devCode = signal<string | null>(null); // Pour le développement
  
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Formulaire étape 1: Email
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulaire étape 2: Code à 6 chiffres
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    // Formulaire étape 3: Nouveau mot de passe
    this.passwordForm = this.fb.group({
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator.bind(this) });
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('nouveauMotDePasse');
    const confirm = form.get('confirmMotDePasse');
    
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  // Étape 1: Envoyer l'email
  onSubmitEmail(): void {
    if (this.emailForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.userEmail = this.emailForm.value.email;

    this.authService.forgotPassword(this.userEmail).subscribe({
      next: (response) => {
        this.loading.set(false);
        
        // En dev, stocker le code pour l'afficher
        if (response.devCode) {
          this.devCode.set(response.devCode);
        }
        
        this.currentStep.set('code');
        this.snackBar.open('Code envoyé ! Vérifiez votre email.', 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
      }
    });
  }

  // Étape 2: Vérifier le code et passer à l'étape mot de passe
  onSubmitCode(): void {
    if (this.codeForm.invalid) return;
    
    // On passe directement à l'étape mot de passe
    // La vérification du code se fera lors de la réinitialisation
    this.currentStep.set('password');
  }

  // Étape 3: Réinitialiser le mot de passe
  onSubmitPassword(): void {
    if (this.passwordForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { nouveauMotDePasse, confirmMotDePasse } = this.passwordForm.value;
    const code = this.codeForm.value.code;

    this.authService.resetPassword(this.userEmail, code, nouveauMotDePasse, confirmMotDePasse).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.currentStep.set('success');
        this.snackBar.open('Mot de passe réinitialisé avec succès !', 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Code invalide ou expiré');
        // Retourner à l'étape code en cas d'erreur
        this.currentStep.set('code');
      }
    });
  }

  // Renvoyer le code
  resendCode(): void {
    this.loading.set(true);
    this.error.set(null);

    this.authService.forgotPassword(this.userEmail).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.devCode) {
          this.devCode.set(response.devCode);
        }
        this.snackBar.open('Nouveau code envoyé !', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Erreur lors de l\'envoi');
      }
    });
  }

  // Retour à l'étape précédente
  goBack(): void {
    const step = this.currentStep();
    if (step === 'code') {
      this.currentStep.set('email');
    } else if (step === 'password') {
      this.currentStep.set('code');
    }
  }

  // Aller à la connexion
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
  }
}
