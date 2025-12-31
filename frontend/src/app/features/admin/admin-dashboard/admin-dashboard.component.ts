// frontend/src/app/features/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  lastUpdate = new Date();

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
        subtitle: 'Comptes professionnels',
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
        this.lastUpdate = new Date();
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

  getTransactionLabel(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'Dépôt';
      case 'WITHDRAW': return 'Retrait';
      case 'TRANSFER': return 'Transfert';
      case 'MERCHANT_PAYMENT': return 'Paiement';
      default: return type;
    }
  }

  refresh(): void {
    this.loadData();
  }

  // Date du jour
  today = new Date();

  // Formatage de devise
  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  }

  // Calcul du pourcentage pour les barres de progression
  getProgressWidth(value: number): number {
    const stats = this.statistics();
    if (!stats || !stats.transactions?.volumeTotal) return 0;
    const maxVolume = stats.transactions.volumeTotal;
    return Math.min((value / maxVolume) * 100, 100);
  }

  // Couleur d'avatar basée sur le nom
  getAvatarColor(name: string): string {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
      '#f59e0b', '#10b981', '#3b82f6', '#06b6d4'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  // Initiales du nom
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  }
}

