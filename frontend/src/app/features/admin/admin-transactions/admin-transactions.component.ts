// frontend/src/app/features/admin/admin-transactions/admin-transactions.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

import { AdminService, AdminTransaction, TransactionFilters } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-transactions',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatExpansionModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './admin-transactions.component.html',
  styleUrl: './admin-transactions.component.scss'
})
export class AdminTransactionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);

  // Signals
  transactions = signal<AdminTransaction[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);

  // Filtres
  typeFilter = signal<string>('');
  statutFilter = signal<string>('');
  telephoneFilter = signal<string>('');
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  pageIndex = signal(0);
  pageSize = signal(10);

  // Table columns
  displayedColumns = ['date', 'type', 'source', 'destination', 'montant', 'statut'];

  // Types disponibles
  transactionTypes = [
    { value: '', label: 'Tous' },
    { value: 'DEPOSIT', label: 'Dépôt' },
    { value: 'WITHDRAW', label: 'Retrait' },
    { value: 'TRANSFER', label: 'Transfert' },
    { value: 'MERCHANT_PAYMENT', label: 'Paiement marchand' },
    { value: 'EPARGNE_IN', label: 'Versement épargne' },
    { value: 'EPARGNE_OUT', label: 'Retrait épargne' }
  ];

  ngOnInit(): void {
    // Récupérer le filtre téléphone depuis l'URL si présent
    const tel = this.route.snapshot.queryParamMap.get('telephone');
    if (tel) {
      this.telephoneFilter.set(tel);
    }
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: TransactionFilters = {
      limit: this.pageSize(),
      skip: this.pageIndex() * this.pageSize()
    };

    if (this.typeFilter()) filters.type = this.typeFilter();
    if (this.statutFilter()) filters.statut = this.statutFilter();
    if (this.telephoneFilter()) filters.telephone = this.telephoneFilter();
    if (this.startDate()) filters.startDate = this.startDate()!.toISOString();
    if (this.endDate()) filters.endDate = this.endDate()!.toISOString();

    this.adminService.getTransactions(filters).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors du chargement');
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadTransactions();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTransactions();
  }

  clearFilters(): void {
    this.typeFilter.set('');
    this.statutFilter.set('');
    this.telephoneFilter.set('');
    this.startDate.set(null);
    this.endDate.set(null);
    this.pageIndex.set(0);
    this.loadTransactions();
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'add_circle';
      case 'WITHDRAW': return 'remove_circle';
      case 'TRANSFER': return 'swap_horiz';
      case 'MERCHANT_PAYMENT': return 'store';
      case 'EPARGNE_IN': return 'savings';
      case 'EPARGNE_OUT': return 'money_off';
      default: return 'receipt';
    }
  }

  getTypeLabel(type: string): string {
    const found = this.transactionTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'type-deposit';
      case 'WITHDRAW': return 'type-withdraw';
      case 'TRANSFER': return 'type-transfer';
      case 'MERCHANT_PAYMENT': return 'type-merchant';
      default: return 'type-other';
    }
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'SUCCES': return 'status-success';
      case 'ECHEC': return 'status-error';
      case 'EN_ATTENTE': return 'status-pending';
      default: return '';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'SUCCES': return 'Réussi';
      case 'ECHEC': return 'Échoué';
      case 'EN_ATTENTE': return 'En attente';
      default: return statut;
    }
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'add_circle';
      case 'WITHDRAW': return 'remove_circle';
      case 'TRANSFER': return 'swap_horiz';
      case 'MERCHANT_PAYMENT': return 'store';
      case 'EPARGNE_IN': return 'savings';
      case 'EPARGNE_OUT': return 'money_off';
      default: return 'receipt';
    }
  }

  getTransactionLabel(type: string): string {
    const found = this.transactionTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatusIcon(statut: string): string {
    switch (statut) {
      case 'SUCCES': return 'check_circle';
      case 'ECHEC': return 'cancel';
      case 'EN_ATTENTE': return 'schedule';
      default: return 'help';
    }
  }

  getStatusCount(statut: string): number {
    return this.transactions().filter(t => t.statut === statut).length;
  }

  hasActiveFilters(): boolean {
    return !!this.typeFilter() || !!this.statutFilter() || !!this.telephoneFilter() || 
           !!this.startDate() || !!this.endDate();
  }

  exportData(): void {
    // Export functionality - could be CSV or Excel
    console.log('Export data');
  }
}

