import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface Country {
  code: string;
  name: string;
  dial: string;
  currency: string;
  flag: string; // Emoji flag
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  private router = inject(Router);

  submitting = false;
  serverError = '';

  hidePassword = true;
  hideConfirmPassword = true;
  hidePin = true;
  hideConfirmPin = true;

  // Liste complète des pays (échantillon représentatif pour l'exemple, extensible)
  countries: Country[] = [
    { code: 'BF', name: 'Burkina Faso', dial: '226', currency: 'XOF', flag: '🇧🇫' },
    { code: 'CI', name: "Côte d'Ivoire", dial: '225', currency: 'XOF', flag: '🇨🇮' },
    { code: 'SN', name: 'Sénégal', dial: '221', currency: 'XOF', flag: '🇸🇳' },
    { code: 'ML', name: 'Mali', dial: '223', currency: 'XOF', flag: '🇲🇱' },
    { code: 'NE', name: 'Niger', dial: '227', currency: 'XOF', flag: '🇳🇪' },
    { code: 'TG', name: 'Togo', dial: '228', currency: 'XOF', flag: '🇹🇬' },
    { code: 'BJ', name: 'Bénin', dial: '229', currency: 'XOF', flag: '🇧🇯' },
    { code: 'FR', name: 'France', dial: '33', currency: 'EUR', flag: '🇫🇷' },
    { code: 'US', name: 'États-Unis', dial: '1', currency: 'USD', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', dial: '1', currency: 'CAD', flag: '🇨🇦' },
    { code: 'GB', name: 'Royaume-Uni', dial: '44', currency: 'GBP', flag: '🇬🇧' },
    { code: 'DE', name: 'Allemagne', dial: '49', currency: 'EUR', flag: '🇩🇪' },
    { code: 'CM', name: 'Cameroun', dial: '237', currency: 'XAF', flag: '🇨🇲' },
    { code: 'GA', name: 'Gabon', dial: '241', currency: 'XAF', flag: '🇬🇦' },
    { code: 'CG', name: 'Congo-Brazzaville', dial: '242', currency: 'XAF', flag: '🇨🇬' },
    { code: 'CD', name: 'RDC', dial: '243', currency: 'CDF', flag: '🇨🇩' },
    { code: 'MA', name: 'Maroc', dial: '212', currency: 'MAD', flag: '🇲🇦' },
    { code: 'DZ', name: 'Algérie', dial: '213', currency: 'DZD', flag: '🇩🇿' },
    { code: 'TN', name: 'Tunisie', dial: '216', currency: 'TND', flag: '🇹🇳' },
    { code: 'CN', name: 'Chine', dial: '86', currency: 'CNY', flag: '🇨🇳' },
    { code: 'JP', name: 'Japon', dial: '81', currency: 'JPY', flag: '🇯🇵' },
    { code: 'IN', name: 'Inde', dial: '91', currency: 'INR', flag: '🇮🇳' },
    { code: 'NG', name: 'Nigeria', dial: '234', currency: 'NGN', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', dial: '233', currency: 'GHS', flag: '🇬🇭' },
    { code: 'KE', name: 'Kenya', dial: '254', currency: 'KES', flag: '🇰🇪' },
    { code: 'ZA', name: 'Afrique du Sud', dial: '27', currency: 'ZAR', flag: '🇿🇦' },
  ];

  form = this.fb.nonNullable.group(
    {
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      country: ['BF', [Validators.required]],
      phone: ['', [Validators.required, this.digitsOnlyValidator, this.phoneByCountryValidator.bind(this)]],
      accountType: ['client', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      pin: ['', [Validators.required, this.digitsOnlyValidator, this.pinLengthValidator]],
      confirmPin: ['', [Validators.required]],
    },
    { validators: [this.passwordMatchValidator, this.pinMatchValidator] }
  );

  get selectedCountry(): Country | undefined {
    return this.countries.find(c => c.code === this.form.controls.country.value);
  }

  get phonePlaceholder(): string {
    return 'Ex: 70123456';
  }

  get phoneHint(): string {
    return 'Sans l\'indicatif';
  }

  constructor() {
    // Trier les pays par nom
    this.countries.sort((a, b) => a.name.localeCompare(b.name));

    // Quand le pays change, on reset le numéro et on revalide
    this.form.controls.country.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.controls.phone.setValue('');
        this.form.controls.phone.updateValueAndValidity();
      });
  }

  showError(controlName: string, error: string): boolean {
    const c = this.form.get(controlName);
    return !!c && (c.touched || c.dirty) && c.hasError(error);
  }

  // ---- Validators ----

  private digitsOnlyValidator(control: AbstractControl): ValidationErrors | null {
    const v = String(control.value ?? '');
    if (!v) return null;
    return /^\d+$/.test(v) ? null : { digitsOnly: true };
  }

  private pinLengthValidator(control: AbstractControl): ValidationErrors | null {
    const v = String(control.value ?? '');
    if (!v) return null;
    return v.length >= 4 && v.length <= 6 ? null : { pinLength: true };
  }

  private phoneByCountryValidator(control: AbstractControl): ValidationErrors | null {
    const phone = String(control.value ?? '');
    if (!phone) return null;

    // Validation souple : entre 7 et 15 chiffres (standard E.164 sans le +)
    if (phone.length < 7 || phone.length > 15) {
      return { invalidPhone: true };
    }

    return null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    if (!p || !c) return null;
    return p === c ? null : { passwordMismatch: true };
  }

  private pinMatchValidator(group: AbstractControl): ValidationErrors | null {
    const p = group.get('pin')?.value;
    const c = group.get('confirmPin')?.value;
    if (!p || !c) return null;
    return p === c ? null : { pinMismatch: true };
  }

  // ---- Submit ----

  buildE164(): string {
    const dial = this.selectedCountry?.dial ?? '';
    const phone = this.form.controls.phone.value;
    return `+${dial}${phone}`;
  }

  onSubmit(): void {
    this.serverError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.form.disable();

    const payload = {
      nomComplet: `${this.form.controls.prenom.value.trim()} ${this.form.controls.nom.value.trim()}`,
      email: this.form.controls.email.value.trim().toLowerCase(),
      motDePasse: this.form.controls.password.value,
      telephone: this.buildE164(),
      role: this.form.controls.accountType.value as 'client' | 'marchand',
      pin: this.form.controls.pin.value,
      devise: this.selectedCountry?.currency || 'XOF'
    };

    /**
     * Note: Le backend a été mis à jour pour accepter 'devise' dans la payload d'inscription.
     * Le modèle Wallet accepte désormais n'importe quel code devise à 3 lettres.
     */

    this.auth.register(payload).pipe(
      finalize(() => {
        this.submitting = false;
        this.form.enable();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackBar.open(`Compte créé avec succès (${payload.devise})`, 'OK', { duration: 3000 });
        this.router.navigate(['/auth/login']);
      },
      error: (err: any) => {
        this.serverError = err?.error?.message || err?.message || 'Erreur lors de l\'inscription';
        this.snackBar.open(this.serverError, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
