// frontend/src/app/features/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminService, SystemStatistics, DashboardData, AdminUser, AdminTransaction } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  // Signals
  statistics = signal<SystemStatistics | null>(null);
  dashboard = signal<DashboardData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed
  statsCards = computed(() => {
    const stats = this.statistics();
    if (!stats) return [];

    return [
      {
        title: 'Utilisateurs',
        value: stats.utilisateurs.total,
        subtitle: `${stats.utilisateurs.actifs} actifs`,
        icon: 'people',
        color: 'primary'
      },
      {
        title: 'Marchands',
        value: stats.utilisateurs.marchands,
        subtitle: 'Comptes marchands',
        icon: 'store',
        color: 'accent'
      },
      {
        title: 'Transactions',
        value: stats.transactions.total,
        subtitle: `${stats.transactions.derniers7jours} cette semaine`,
        icon: 'receipt_long',
        color: 'success'
      },
      {
        title: 'Volume Total',
        value: stats.transactions.volumeTotal,
        subtitle: 'XOF',
        icon: 'payments',
        color: 'warning',
        isCurrency: true
      }
    ];
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Charger les statistiques
    this.adminService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.loadDashboard();
      },
      error: (err) => {
        this.error.set(err.message || 'Erreur lors du chargement des statistiques');
        this.loading.set(false);
      }
    });
  }

  private loadDashboard(): void {
    this.adminService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Erreur lors du chargement du tableau de bord');
        this.loading.set(false);
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'SUCCES': return 'status-success';
      case 'ECHEC': return 'status-error';
      case 'EN_ATTENTE': return 'status-pending';
      case 'actif': return 'status-success';
      case 'bloque': return 'status-error';
      default: return '';
    }
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'add_circle';
      case 'WITHDRAW': return 'remove_circle';
      case 'TRANSFER': return 'swap_horiz';
      case 'MERCHANT_PAYMENT': return 'store';
      default: return 'receipt';
    }
  }

  refresh(): void {
    this.loadData();
  }
}

