import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="change-password-dialog">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>lock</mat-icon>
        </div>
        <h2>Changer le mot de passe</h2>
        <p>Sécurisez votre compte avec un nouveau mot de passe</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          @if (error()) {
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <span>{{ error() }}</span>
            </div>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mot de passe actuel</mat-label>
            <input matInput [type]="hideOldPassword() ? 'password' : 'text'" 
                   formControlName="ancienMotDePasse" autocomplete="current-password">
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="toggleOldPassword()">
              <mat-icon>{{ hideOldPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('ancienMotDePasse')?.hasError('required')) {
              <mat-error>Le mot de passe actuel est requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nouveau mot de passe</mat-label>
            <input matInput [type]="hideNewPassword() ? 'password' : 'text'" 
                   formControlName="nouveauMotDePasse" autocomplete="new-password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="toggleNewPassword()">
              <mat-icon>{{ hideNewPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>Minimum 6 caractères</mat-hint>
            @if (form.get('nouveauMotDePasse')?.hasError('required')) {
              <mat-error>Le nouveau mot de passe est requis</mat-error>
            }
            @if (form.get('nouveauMotDePasse')?.hasError('minlength')) {
              <mat-error>Minimum 6 caractères</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmer le mot de passe</mat-label>
            <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" 
                   formControlName="confirmMotDePasse" autocomplete="new-password">
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="toggleConfirmPassword()">
              <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('confirmMotDePasse')?.hasError('required')) {
              <mat-error>Confirmez le mot de passe</mat-error>
            }
            @if (form.get('confirmMotDePasse')?.hasError('mismatch')) {
              <mat-error>Les mots de passe ne correspondent pas</mat-error>
            }
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()" [disabled]="loading()">
            Annuler
          </button>
          <button mat-raised-button color="primary" type="submit" 
                  [disabled]="form.invalid || loading()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <ng-container>Enregistrer</ng-container>
            }
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    ::ng-deep .mat-mdc-dialog-surface {
      background: white !important;
      border-radius: 16px !important;
    }

    .change-password-dialog {
      min-width: 320px;
      max-width: 400px;
      background: white;
      border-radius: 16px;
      overflow: hidden;
    }

    .dialog-header {
      text-align: center;
      padding: 20px 24px 16px;
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      color: white;
    }

    .header-icon {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;

      mat-icon {
        font-size: 30px;
        width: 30px;
        height: 30px;
      }
    }

    .dialog-header h2 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
    }

    .dialog-header p {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
    }

    mat-dialog-content {
      padding: 0 24px !important;
    }

    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #ffebee;
      color: #c62828;
      border-radius: 10px;
      margin-bottom: 16px;
      font-size: 14px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px 24px !important;
      margin: 0 !important;
      gap: 8px;

      button[mat-raised-button] {
        background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
        min-width: 120px;
      }
    }

    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 8px;
      color: #999;
    }
  `]
})
export class ChangePasswordDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialog>);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  
  hideOldPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor() {
    this.form = this.fb.group({
      ancienMotDePasse: ['', Validators.required],
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: ['', Validators.required]
    }, { validators: this.passwordMatchValidator.bind(this) });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('nouveauMotDePasse');
    const confirm = form.get('confirmMotDePasse');
    
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  toggleOldPassword() {
    this.hideOldPassword.set(!this.hideOldPassword());
  }

  toggleNewPassword() {
    this.hideNewPassword.set(!this.hideNewPassword());
  }

  toggleConfirmPassword() {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { ancienMotDePasse, nouveauMotDePasse, confirmMotDePasse } = this.form.value;

    this.authService.changePassword(ancienMotDePasse, nouveauMotDePasse, confirmMotDePasse).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open('Mot de passe modifié avec succès !', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Erreur lors du changement de mot de passe');
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
