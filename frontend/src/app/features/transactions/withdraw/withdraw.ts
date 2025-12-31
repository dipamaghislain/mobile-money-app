// src/app/features/transactions/withdraw/withdraw.ts
// Composant de retrait avec sélection opérateur Mobile Money

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
import { debounceTime } from 'rxjs';
import { TransactionV3Service, Country, MobileOperator, OPERATORS_BY_COUNTRY } from '../../../core/services/transaction-v3.service';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { CurrencyXOFPipe } from '../../../shared/pipes/currency-xof.pipe';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-withdraw',
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
  templateUrl: './withdraw.html',
  styleUrl: './withdraw.scss'
})
export class WithdrawComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionV3Service);
  private authService = inject(AuthService);
  private walletService = inject(WalletService);
  private router = inject(Router);

  // Expose Math au template
  Math = Math;

  // État
  loading = signal(false);
  loadingCountry = signal(true);
  calculatingFees = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  step = signal<'form' | 'confirm'>('form');

  // Données
  userCountry = signal<Country | null>(null);
  userPhone = signal<string>('');
  balance = signal<number>(0);

  // Frais calculés
  fees = signal<{ frais: number; montantNet: number; tauxFrais: number } | null>(null);

  // Formulaire
  form = this.fb.group({
    operateur: ['', Validators.required],
    telephone: ['', Validators.required],
    montant: [null as number | null, [Validators.required, Validators.min(500)]],
    pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
  });

  // Opérateurs disponibles pour le pays de l'utilisateur (avec détails)
  operatorsDetailed = signal<MobileOperator[]>([]);

  // Limites du pays
  limits = computed(() => this.userCountry()?.limites || null);

  ngOnInit(): void {
    this.loadUserData();

    // Calcul des frais quand le montant change
    this.form.get('montant')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(montant => {
      if (montant && montant >= 500) {
        this.calculateFees(montant);
      } else {
        this.fees.set(null);
      }
    });
  }

  private loadUserData(): void {
    // Charger le solde
    this.walletService.getWallet().subscribe({
      next: (wallet) => this.balance.set(wallet.solde || 0),
      error: () => {}
    });

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
        error: () => this.loadingCountry.set(false)
      });
    } else {
      this.loadingCountry.set(false);
    }
  }

  private calculateFees(montant: number): void {
    this.calculatingFees.set(true);
    
    this.transactionService.calculateFees({
      type: 'WITHDRAW',
      montant,
      paysSource: this.userCountry()?.code || 'BF'
    }).subscribe({
      next: (response) => {
        this.calculatingFees.set(false);
        if (response.success) {
          this.fees.set({
            frais: response.data.frais,
            montantNet: response.data.montant,
            tauxFrais: response.data.tauxFrais
          });
        }
      },
      error: () => this.calculatingFees.set(false)
    });
  }

  getOperatorIcon(name: string): string {
    return this.transactionService.getOperatorIcon(name);
  }

  getOperatorColor(name: string): string {
    return this.transactionService.getOperatorColor(name);
  }

  proceedToConfirm(): void {
    if (this.form.invalid) return;
    
    // Vérifier le solde
    const montant = this.form.get('montant')?.value || 0;
    const total = montant + (this.fees()?.frais || 0);
    
    if (total > this.balance()) {
      this.error.set('Solde insuffisant pour effectuer ce retrait');
      return;
    }
    
    this.error.set(null);
    this.step.set('confirm');
  }

  backToForm(): void {
    this.step.set('form');
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { operateur, telephone, montant, pin } = this.form.value;

    this.transactionService.withdraw({
      montant: montant!,
      telephoneDestination: telephone!,
      operateur: operateur!,
      pin: pin!
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.success.set('Retrait effectué avec succès !');
          setTimeout(() => this.router.navigate(['/dashboard']), 2000);
        } else {
          this.error.set(response.message || 'Erreur lors du retrait');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
      }
    });
  }
}
