import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

// Validateur personnalisé pour vérifier que les mots de passe correspondent
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('nouveauMotDePasse');
  const confirmPassword = control.get('confirmationMotDePasse');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);
  token: string | null = null;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmationMotDePasse: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
      
      if (!this.token) {
        this.error.set('Token de réinitialisation manquant');
        this.snackBar.open('Token de réinitialisation manquant', 'OK', {
          duration: 5000
        });
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const { nouveauMotDePasse } = this.form.value;

    this.authService.resetPassword(this.token, nouveauMotDePasse).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.snackBar.open('Mot de passe réinitialisé avec succès !', 'OK', {
          duration: 3000
        });
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
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

  togglePasswordVisibility(): void {
    this.hidePassword.update(val => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(val => !val);
  }
}



