import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { WalletService, TransactionHistoryItem } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class TransactionHistoryComponent implements OnInit {
  private walletService = inject(WalletService);

  transactions = signal<TransactionHistoryItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  filterType = signal<string | null>(null);

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading.set(true);
    this.walletService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data.transactions);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Impossible de charger les transactions');
        this.loading.set(false);
      }
    });
  }

  get filteredTransactions() {
    const type = this.filterType();
    if (!type) return this.transactions();
    return this.transactions().filter(t => t.type === type);
  }

  setFilter(type: string | null) {
    this.filterType.set(type);
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'add_circle';
      case 'WITHDRAW': return 'remove_circle';
      case 'TRANSFER': return 'send';
      case 'MERCHANT_PAYMENT': return 'store';
      default: return 'receipt';
    }
  }

  getTransactionColor(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'text-success';
      case 'WITHDRAW': return 'text-warn';
      case 'TRANSFER': return 'text-primary';
      case 'MERCHANT_PAYMENT': return 'text-accent';
      default: return '';
    }
  }

  getTransactionLabel(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'Dépôt';
      case 'WITHDRAW': return 'Retrait';
      case 'TRANSFER': return 'Transfert';
      case 'MERCHANT_PAYMENT': return 'Paiement Marchand';
      default: return type;
    }
  }
}
