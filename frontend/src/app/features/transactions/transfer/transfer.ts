// src/app/features/transactions/transfer/transfer.ts
// Composant de transfert multi-pays avec validation du destinataire

import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { 
  TransactionV3Service, 
  Country
} from '../../../core/services/transaction-v3.service';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyXOFPipe } from '../../../shared/pipes/currency-xof.pipe';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-transfer',
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
    MatTooltipModule,
    CurrencyXOFPipe,
    BottomNavComponent
  ],
  templateUrl: './transfer.html',
  styleUrl: './transfer.scss'
})
export class TransferComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionV3Service);
  private authService = inject(AuthService);
  private router = inject(Router);

  // État
  loading = signal(false);
  loadingCountries = signal(true);
  validatingRecipient = signal(false);
  calculatingFees = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Données
  countries = signal<Country[]>([]);
  userCountry = signal<string>('BF');
  
  // Destinataire validé
  recipientInfo = signal<{ nomComplet: string; telephone: string; pays: string } | null>(null);
  recipientError = signal<string | null>(null);

  // Frais calculés
  fees = signal<{ frais: number; montantTotal: number; tauxFrais: number; estInternational: boolean } | null>(null);

  // Subject pour debounce validation destinataire
  private phoneChange$ = new Subject<string>();

  // Formulaire
  form = this.fb.group({
    paysDestinataire: ['', Validators.required],
    telephone: ['', [Validators.required]],
    montant: [null as number | null, [Validators.required, Validators.min(100)]],
    description: [''],
    pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
  });

  // Pays sélectionné
  selectedCountry = computed(() => {
    const code = this.form.get('paysDestinataire')?.value;
    return this.countries().find(c => c.code === code) || null;
  });

  // Est-ce un transfert international ?
  isInternational = computed(() => {
    const destCountry = this.form.get('paysDestinataire')?.value;
    return destCountry && destCountry !== this.userCountry();
  });

  // Placeholder du téléphone selon le pays
  phonePlaceholder = computed(() => {
    const country = this.selectedCountry();
    return country ? `Ex: ${country.formatTelephone.exemple}` : 'Numéro de téléphone';
  });

  // Hint du téléphone selon le pays
  phoneHint = computed(() => {
    const country = this.selectedCountry();
    return country ? `${country.formatTelephone.description} (${country.indicatif})` : '';
  });

  // Drapeaux des pays
  countryFlags: { [key: string]: string } = {
    'BF': '🇧🇫',
    'CI': '🇨🇮',
    'SN': '🇸🇳',
    'ML': '🇲🇱',
    'CM': '🇨🇲',
    'TG': '🇹🇬',
    'BJ': '🇧🇯'
  };

  ngOnInit(): void {
    // Charger les pays
    this.loadCountries();

    // Récupérer le pays de l'utilisateur
    const user = this.authService.currentUserValue;
    if (user?.pays) {
      this.userCountry.set(user.pays);
      this.form.patchValue({ paysDestinataire: user.pays });
    }

    // Setup debounce pour validation du destinataire
    this.phoneChange$.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(phone => {
      if (phone && phone.length >= 8) {
        this.validateRecipient(phone);
      }
    });

    // Écouter les changements du téléphone
    this.form.get('telephone')?.valueChanges.subscribe(value => {
      this.recipientInfo.set(null);
      this.recipientError.set(null);
      if (value) {
        this.phoneChange$.next(value);
      }
    });

    // Écouter les changements de pays pour revalider le téléphone
    this.form.get('paysDestinataire')?.valueChanges.subscribe(() => {
      const phone = this.form.get('telephone')?.value;
      this.fees.set(null);
      if (phone) {
        this.recipientInfo.set(null);
        this.phoneChange$.next(phone);
      }
    });

    // Écouter les changements de montant pour recalculer les frais
    this.form.get('montant')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(montant => {
      const paysDestinataire = this.form.get('paysDestinataire')?.value;
      if (montant && montant >= 100 && paysDestinataire) {
        this.calculateFees(montant, paysDestinataire);
      } else {
        this.fees.set(null);
      }
    });
  }

  private loadCountries(): void {
    this.loadingCountries.set(true);
    this.transactionService.getCountries().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // data peut être directement le tableau ou un objet avec countries
          const countries = Array.isArray(response.data) ? response.data : response.data.countries;
          if (countries) {
            this.countries.set(countries);
          }
        }
        this.loadingCountries.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement pays:', err);
        this.loadingCountries.set(false);
      }
    });
  }

  private validateRecipient(phone: string): void {
    const paysDestinataire = this.form.get('paysDestinataire')?.value;
    if (!paysDestinataire) return;

    this.validatingRecipient.set(true);
    this.recipientError.set(null);

    this.transactionService.validateRecipient({
      telephone: phone,
      pays: paysDestinataire
    }).subscribe({
      next: (response) => {
        this.validatingRecipient.set(false);
        if (response.success && response.data.valide && response.data.utilisateur) {
          this.recipientInfo.set(response.data.utilisateur);
        } else {
          this.recipientError.set(response.data.message || 'Destinataire non trouvé');
        }
      },
      error: (err) => {
        this.validatingRecipient.set(false);
        this.recipientError.set(err.error?.message || 'Erreur de validation');
      }
    });
  }

  private calculateFees(montant: number, paysDestination: string): void {
    this.calculatingFees.set(true);
    
    this.transactionService.calculateFees({
      type: 'TRANSFER',
      montant,
      paysSource: this.userCountry(),
      paysDestination
    }).subscribe({
      next: (response) => {
        this.calculatingFees.set(false);
        if (response.success) {
          this.fees.set({
            frais: response.data.frais,
            montantTotal: response.data.montantTotal,
            tauxFrais: response.data.tauxFrais,
            estInternational: response.data.estTransfertInternational
          });
        }
      },
      error: () => {
        this.calculatingFees.set(false);
      }
    });
  }

  getCountryFlag(code: string): string {
    return this.countryFlags[code] || '🌍';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    // Vérifier que le destinataire est validé
    if (!this.recipientInfo()) {
      this.error.set('Veuillez entrer un numéro de destinataire valide');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { paysDestinataire, telephone, montant, description, pin } = this.form.value;

    this.transactionService.transfer({
      destinataire: telephone!,
      paysDestinataire: paysDestinataire!,
      montant: montant!,
      pin: pin!,
      description: description || undefined
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.success.set('Transfert effectué avec succès !');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        } else {
          this.error.set(response.message || 'Erreur lors du transfert');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
      }
    });
  }
}
