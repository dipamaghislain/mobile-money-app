import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import { Country } from '../../../core/models/country.model';

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
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  private router = inject(Router);

  submitting = false;
  serverError = '';

  hidePassword = true;
  hideConfirmPassword = true;

  // Pays chargés depuis le serveur
  countries = signal<Country[]>([]);
  defaultCountry = signal<string>('BF');
  loadingCountries = signal(true);

  // Gestion du téléphone
  phoneError = '';

  form = this.fb.nonNullable.group(
    {
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      country: ['BF', [Validators.required]],
      phone: ['', [Validators.required]],
      accountType: ['client', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordMatchValidator.bind(this)] }
  );

  get selectedCountry(): Country | undefined {
    return this.countries().find(c => c.code === this.form.controls.country.value);
  }

  get phonePlaceholder(): string {
    return this.selectedCountry?.formatTelephone?.exemple ?? '';
  }

  get phoneHint(): string {
    const country = this.selectedCountry;
    if (!country) return '';
    return `${country.formatTelephone?.description ?? ''} (${country.indicatif})`;
  }

  // Extraire le nombre de chiffres requis depuis formatTelephone
  get requiredPhoneLength(): number {
    const country = this.selectedCountry;
    if (!country) return 8;
    return country.formatTelephone?.longueur ?? 8;
  }

  ngOnInit(): void {
    // Charger les pays depuis le serveur
    this.auth.getCountries().subscribe({
      next: (res) => {
        this.countries.set(res.countries);
        this.defaultCountry.set(res.default);
        this.form.controls.country.setValue(res.default);
        this.loadingCountries.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement pays:', err);
        // Fallback avec pays par défaut
        this.countries.set([
          { code: 'BF', nom: 'Burkina Faso', indicatif: '+226', devise: 'XOF', symbole: 'FCFA', formatTelephone: { longueur: 8, exemple: '70123456', description: '8 chiffres' } },
          { code: 'CI', nom: "Côte d'Ivoire", indicatif: '+225', devise: 'XOF', symbole: 'FCFA', formatTelephone: { longueur: 10, exemple: '0701234567', description: '10 chiffres' } },
          { code: 'SN', nom: 'Sénégal', indicatif: '+221', devise: 'XOF', symbole: 'FCFA', formatTelephone: { longueur: 9, exemple: '771234567', description: '9 chiffres' } },
          { code: 'ML', nom: 'Mali', indicatif: '+223', devise: 'XOF', symbole: 'FCFA', formatTelephone: { longueur: 8, exemple: '70123456', description: '8 chiffres' } },
          { code: 'CM', nom: 'Cameroun', indicatif: '+237', devise: 'XAF', symbole: 'FCFA', formatTelephone: { longueur: 9, exemple: '690123456', description: '9 chiffres' } },
        ]);
        this.loadingCountries.set(false);
      }
    });

    // Quand le pays change, on reset le numéro
    this.form.controls.country.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.phoneError = '';
        this.form.controls.phone.setValue('');
      });

    // Écouter les changements du téléphone pour filtrer les chiffres
    this.form.controls.phone.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const digits = value.replace(/\D/g, '');
        if (digits !== value) {
          this.form.controls.phone.setValue(digits, { emitEvent: false });
        }
        this.validatePhone(digits);
      });
  }

  // Validation du téléphone
  validatePhone(digits: string): void {
    const requiredLength = this.requiredPhoneLength;
    if (digits.length === 0) {
      this.phoneError = 'Numéro requis';
    } else if (digits.length < requiredLength) {
      this.phoneError = `Le numéro doit contenir ${requiredLength} chiffres`;
    } else if (digits.length > requiredLength) {
      this.phoneError = `Maximum ${requiredLength} chiffres`;
    } else {
      this.phoneError = '';
    }
  }

  showError(controlName: string, error: string): boolean {
    const c = this.form.get(controlName);
    return !!c && (c.touched || c.dirty) && c.hasError(error);
  }

  // Convertir code pays en emoji drapeau
  getCountryFlag(code: string): string {
    const flags: Record<string, string> = {
      'BF': '🇧🇫',
      'CI': '🇨🇮',
      'SN': '🇸🇳',
      'ML': '🇲🇱',
      'CM': '🇨🇲',
      'TG': '🇹🇬',
      'BJ': '🇧🇯',
      'GH': '🇬🇭',
      'NE': '🇳🇪'
    };
    return flags[code] || '🌍';
  }

  // ---- Validators ----

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    if (!p || !c) return null;
    return p === c ? null : { passwordMismatch: true };
  }

  // ---- Submit ----

  buildE164(): string {
    const country = this.selectedCountry;
    const phone = this.form.controls.phone.value;
    if (!country) return phone;
    return country.indicatif + phone;
  }

  onSubmit(): void {
    this.serverError = '';

    // Valider le téléphone
    const phone = this.form.controls.phone.value;
    const requiredLength = this.requiredPhoneLength;
    
    if (!phone || phone.length === 0) {
      this.phoneError = 'Numéro requis';
      this.form.controls.phone.markAsTouched();
      return;
    }
    
    if (phone.length !== requiredLength) {
      this.phoneError = `Le numéro doit contenir exactement ${requiredLength} chiffres`;
      this.form.controls.phone.markAsTouched();
      return;
    }

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
      pays: this.form.controls.country.value,
      role: this.form.controls.accountType.value as 'client' | 'marchand',
    };

    this.auth.register(payload).pipe(
      finalize(() => {
        this.submitting = false;
        this.form.enable();
      })
    ).subscribe({
      next: (res) => {
        this.snackBar.open('Compte créé avec succès ! Connectez-vous pour continuer.', 'OK', { duration: 3000 });
        // Rediriger vers la page de connexion
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.serverError = err?.message || 'Erreur lors de l\'inscription';
        this.snackBar.open(this.serverError, 'OK', { duration: 3000 });
      }
    });
  }
}
