import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    BottomNavComponent
  ],
  templateUrl: './profile-edit.html',
  styleUrl: './profile-edit.scss',
})
export class ProfileEdit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  user = this.authService.currentUserValue;

  // adapte selon ton modèle : role/typeCompte/etc.
  isMerchant = (this.user as any)?.typeCompte === 'marchand' || (this.user as any)?.role === 'marchand';

  form = this.fb.nonNullable.group({
    nomComplet: [this.user?.nomComplet || '', [Validators.required, Validators.minLength(2)]],
    email: [this.user?.email || '', [Validators.required, Validators.email]],
    adresse: [this.user?.adresse || ''],
    nomCommerce: [this.user?.nomCommerce || ''],
  });

  submitting = false;

  showError(controlName: string, error: string): boolean {
    const c = this.form.get(controlName);
    return !!c && (c.touched || c.dirty) && c.hasError(error);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.form.disable();

    const v = this.form.getRawValue();

    const payload: any = {
      nomComplet: v.nomComplet.trim(),
      email: v.email.trim().toLowerCase(),
    };

    if (v.adresse?.trim()) payload.adresse = v.adresse.trim();
    if (this.isMerchant && v.nomCommerce?.trim()) payload.nomCommerce = v.nomCommerce.trim();

    this.authService.updateProfile(payload)
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.form.enable();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Profil mis à jour', 'OK', { duration: 2500 });
        },
        error: (err) => {
          this.snackBar.open(err?.message || 'Erreur lors de la mise à jour', 'OK', { duration: 3000 });
        }
      });
  }
}
