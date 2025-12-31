import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { WalletService, StatisticsResponse } from '../../../core/services/wallet.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    BottomNavComponent
  ],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss'
})
export class StatisticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  private walletService = inject(WalletService);
  
  private lineChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  loading = signal(true);
  error = signal<string | null>(null);
  periode = signal(30);
  statistics = signal<any>(null);
  
  // Données pour les graphiques
  soldeActuel = signal(0);
  devise = signal('XOF');
  totalEntrees = signal(0);
  totalSorties = signal(0);
  nombreTransactions = signal(0);

  periodes = [
    { value: 7, label: '7 derniers jours' },
    { value: 30, label: '30 derniers jours' },
    { value: 90, label: '3 derniers mois' },
    { value: 365, label: '12 derniers mois' }
  ];

  ngOnInit() {
    this.loadStatistics();
  }

  ngAfterViewInit() {
    // Les graphiques seront initialisés après le chargement des données
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  loadStatistics() {
    this.loading.set(true);
    this.error.set(null);

    this.walletService.getStatistics(this.periode()).subscribe({
      next: (response: StatisticsResponse) => {
        this.soldeActuel.set(response.soldeActuel || 0);
        this.devise.set(response.devise || 'XOF');
        this.statistics.set(response.statistiques);

        // Extraire les totaux
        if (response.statistiques) {
          this.totalEntrees.set(response.statistiques.totalEntrees || 0);
          this.totalSorties.set(response.statistiques.totalSorties || 0);
          this.nombreTransactions.set(response.statistiques.nombreTransactions || 0);
        }

        this.loading.set(false);
        
        // Initialiser les graphiques après que la vue soit mise à jour
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        this.error.set('Impossible de charger les statistiques');
        this.loading.set(false);
      }
    });
  }

  onPeriodeChange() {
    this.loadStatistics();
  }

  private initCharts() {
    this.destroyCharts();
    this.initLineChart();
    this.initDoughnutChart();
  }

  private destroyCharts() {
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = null;
    }
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
      this.doughnutChart = null;
    }
  }

  private initLineChart() {
    if (!this.lineChartRef?.nativeElement) return;

    const stats = this.statistics();
    if (!stats?.parJour) return;

    const labels = stats.parJour.map((d: any) => d.date);
    const entreesData = stats.parJour.map((d: any) => d.entrees || 0);
    const sortiesData = stats.parJour.map((d: any) => d.sorties || 0);

    const ctx = this.lineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Entrées',
            data: entreesData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Sorties',
            data: sortiesData,
            borderColor: '#F44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                return `${context.dataset.label}: ${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (typeof value === 'number') {
                  return new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value);
                }
                return value;
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  private initDoughnutChart() {
    if (!this.doughnutChartRef?.nativeElement) return;

    const stats = this.statistics();
    if (!stats?.parType) return;

    const typeLabels: Record<string, string> = {
      'DEPOSIT': 'Dépôts',
      'WITHDRAW': 'Retraits',
      'TRANSFER': 'Transferts',
      'MERCHANT_PAYMENT': 'Paiements',
      'EPARGNE_IN': 'Épargne +',
      'EPARGNE_OUT': 'Épargne -'
    };

    const typeColors: Record<string, string> = {
      'DEPOSIT': '#4CAF50',
      'WITHDRAW': '#F44336',
      'TRANSFER': '#2196F3',
      'MERCHANT_PAYMENT': '#FF9800',
      'EPARGNE_IN': '#9C27B0',
      'EPARGNE_OUT': '#E91E63'
    };

    const labels = stats.parType.map((t: any) => typeLabels[t.type] || t.type);
    const data = stats.parType.map((t: any) => t.montant || 0);
    const colors = stats.parType.map((t: any) => typeColors[t.type] || '#757575');

    const ctx = this.doughnutChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${new Intl.NumberFormat('fr-FR').format(value)} XOF (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }
}
