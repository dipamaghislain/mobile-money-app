// src/app/features/transactions/deposit/deposit.ts
// Composant de dépôt avec sélection opérateur Mobile Money

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { TransactionV3Service, Country, MobileOperator, OPERATORS_BY_COUNTRY } from '../../../core/services/transaction-v3.service';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyXOFPipe } from '../../../shared/pipes/currency-xof.pipe';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-deposit',
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
    MatSelectModule,
    MatDividerModule,
    CurrencyXOFPipe,
    BottomNavComponent
  ],
  templateUrl: './deposit.html',
  styleUrl: './deposit.scss'
})
export class DepositComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionV3Service);
  private authService = inject(AuthService);
  private router = inject(Router);

  // État
  loading = signal(false);
  loadingCountry = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  step = signal<'form' | 'confirm' | 'instructions'>('form');

  // Données utilisateur
  userCountry = signal<Country | null>(null);
  userPhone = signal<string>('');

  // Formulaire
  form = this.fb.group({
    operateur: ['', Validators.required],
    telephone: ['', Validators.required],
    montant: [null as number | null, [Validators.required, Validators.min(100)]]
  });

  // Opérateurs disponibles pour le pays de l'utilisateur (avec détails)
  operatorsDetailed = signal<MobileOperator[]>([]);

  // Limites du pays
  limits = computed(() => this.userCountry()?.limites || null);

  ngOnInit(): void {
    this.loadUserCountry();
  }

  private loadUserCountry(): void {
    const user = this.authService.currentUserValue;
    if (user?.telephone) {
      this.userPhone.set(user.telephone);
      this.form.patchValue({ telephone: user.telephone });
    }

    if (user?.pays) {
      // Charger les opérateurs détaillés pour ce pays
      const operators = OPERATORS_BY_COUNTRY[user.pays] || [];
      this.operatorsDetailed.set(operators);

      this.transactionService.getCountryInfo(user.pays).subscribe({
        next: (response) => {
          if (response.success) {
            this.userCountry.set(response.data.country);
            // Pré-sélectionner le premier opérateur
            if (operators.length > 0) {
              this.form.patchValue({ operateur: operators[0].nom });
            }
          }
          this.loadingCountry.set(false);
        },
        error: () => {
          this.loadingCountry.set(false);
        }
      });
    } else {
      this.loadingCountry.set(false);
    }
  }

  getOperatorIcon(name: string): string {
    return this.transactionService.getOperatorIcon(name);
  }

  getOperatorColor(name: string): string {
    return this.transactionService.getOperatorColor(name);
  }

  proceedToConfirm(): void {
    if (this.form.invalid) return;
    this.step.set('confirm');
  }

  backToForm(): void {
    this.step.set('form');
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { operateur, telephone, montant } = this.form.value;

    this.transactionService.deposit({
      montant: montant!,
      telephoneSource: telephone!,
      operateur: operateur!
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.success.set('Dépôt initié avec succès !');
          this.step.set('instructions');
        } else {
          this.error.set(response.message || 'Erreur lors du dépôt');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
      }
    });
  }

  getUssdCode(): string {
    const operateur = this.form.get('operateur')?.value;
    const montant = this.form.get('montant')?.value;
    const countryCode = this.userCountry()?.code;

    // Codes USSD par opérateur et pays
    const ussdCodes: Record<string, Record<string, string>> = {
      'BF': {
        'Orange': `*144*1*${montant}#`,
        'Moov': `*555*1*${montant}#`,
        'Telecel': `*111*1*${montant}#`
      },
      'CI': {
        'Orange': `*144*1*${montant}#`,
        'MTN': `*133*1*${montant}#`,
        'Moov': `*555*1*${montant}#`,
        'Wave': 'Ouvrir l\'app Wave'
      },
      'SN': {
        'Orange': `*144*1*${montant}#`,
        'Free': `*555*1*${montant}#`,
        'Expresso': `*222*1*${montant}#`,
        'Wave': 'Ouvrir l\'app Wave'
      },
      'ML': {
        'Orange': `*144*1*${montant}#`,
        'Malitel': `*222*1*${montant}#`,
        'Telecel': `*111*1*${montant}#`
      },
      'CM': {
        'MTN': `*126*1*${montant}#`,
        'Orange': `*150*1*${montant}#`,
        'Camtel': `*155*1*${montant}#`
      },
      'TG': {
        'Togocel': `*145*1*${montant}#`,
        'Moov': `*555*1*${montant}#`
      },
      'BJ': {
        'MTN': `*880*1*${montant}#`,
        'Moov': `*555*1*${montant}#`,
        'Celtiis': `*222*1*${montant}#`
      }
    };

    return ussdCodes[countryCode || 'BF']?.[operateur || ''] || `*144*1*${montant}#`;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
