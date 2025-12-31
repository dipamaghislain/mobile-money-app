import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTabsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDividerModule,
    MatRippleModule
  ],
  template: `
    <div class="notifications-container">
      <mat-card class="notifications-card">
        <!-- Header moderne -->
        <mat-card-header class="card-header">
          <div class="header-content">
            <div class="header-icon">
              <mat-icon>notifications_active</mat-icon>
              @if (unreadCount() > 0) {
                <span class="badge-count">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
              }
            </div>
            <div class="header-text">
              <mat-card-title>Notifications</mat-card-title>
              <mat-card-subtitle>
                @if (unreadCount() > 0) {
                  {{ unreadCount() }} non lue{{ unreadCount() > 1 ? 's' : '' }}
                } @else {
                  Tout est à jour
                }
              </mat-card-subtitle>
            </div>
          </div>
          <div class="header-actions">
            @if (unreadCount() > 0) {
              <button mat-icon-button (click)="markAllRead()" class="action-btn" title="Tout marquer comme lu">
                <mat-icon>done_all</mat-icon>
              </button>
            }
            <button mat-icon-button [matMenuTriggerFor]="settingsMenu" class="action-btn">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #settingsMenu="matMenu">
              <button mat-menu-item (click)="refreshNotifications()">
                <mat-icon>refresh</mat-icon>
                <span>Actualiser</span>
              </button>
              <button mat-menu-item routerLink="/settings">
                <mat-icon>tune</mat-icon>
                <span>Préférences</span>
              </button>
            </mat-menu>
          </div>
        </mat-card-header>

        <mat-card-content>
          <!-- Tabs améliorés -->
          <mat-tab-group 
            class="custom-tabs"
            (selectedTabChange)="onTabChange($event.index)"
            animationDuration="200ms"
          >
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>inbox</mat-icon>
                <span>Toutes</span>
                <span class="tab-badge" *ngIf="totalCount() > 0">{{ totalCount() }}</span>
              </ng-template>
              <ng-template matTabContent>
                <ng-container *ngTemplateOutlet="notificationsList"></ng-container>
              </ng-template>
            </mat-tab>
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>mark_email_unread</mat-icon>
                <span>Non lues</span>
                <span class="tab-badge unread" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
              </ng-template>
              <ng-template matTabContent>
                <ng-container *ngTemplateOutlet="notificationsList"></ng-container>
              </ng-template>
            </mat-tab>
          </mat-tab-group>

          <ng-template #notificationsList>
            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Chargement des notifications...</p>
              </div>
            } @else if (notifications().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">
                  <mat-icon>notifications_off</mat-icon>
                </div>
                <h3>Aucune notification</h3>
                <p>Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.</p>
              </div>
            } @else {
              <div class="notifications-list">
                @for (notif of notifications(); track notif.id; let i = $index) {
                  <div 
                    class="notification-item" 
                    [class.unread]="!notif.lu"
                    [style.animation-delay]="(i * 50) + 'ms'"
                    matRipple
                    (click)="openNotification(notif)"
                  >
                    <div class="notif-indicator" *ngIf="!notif.lu"></div>
                    <div 
                      class="notif-icon" 
                      [style.background]="getTypeGradient(notif.type)"
                    >
                      <mat-icon>{{ getTypeIcon(notif.type) }}</mat-icon>
                    </div>
                    <div class="notif-content">
                      <div class="notif-header">
                        <span class="notif-title">{{ notif.titre }}</span>
                        <span class="notif-time">{{ formatDate(notif.date) }}</span>
                      </div>
                      <p class="notif-message">{{ notif.message }}</p>
                      @if (notif.data?.montant) {
                        <span class="notif-amount" [class.positive]="isPositiveType(notif.type)" [class.negative]="isNegativeType(notif.type)">
                          {{ isPositiveType(notif.type) ? '+' : '-' }} {{ notif.data.montant | number }} FCFA
                        </span>
                      }
                    </div>
                    <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="notif-menu-btn" (click)="$event.stopPropagation()">
                      <mat-icon>more_horiz</mat-icon>
                    </button>
                    <mat-menu #notifMenu="matMenu">
                      @if (!notif.lu) {
                        <button mat-menu-item (click)="markAsRead(notif.id)">
                          <mat-icon>check</mat-icon>
                          <span>Marquer comme lu</span>
                        </button>
                      } @else {
                        <button mat-menu-item (click)="markAsUnread(notif.id)">
                          <mat-icon>mark_email_unread</mat-icon>
                          <span>Marquer non lu</span>
                        </button>
                      }
                      <button mat-menu-item (click)="deleteNotification(notif.id)" class="delete-action">
                        <mat-icon>delete_outline</mat-icon>
                        <span>Supprimer</span>
                      </button>
                    </mat-menu>
                  </div>
                }
              </div>

              @if (hasMore()) {
                <div class="load-more">
                  <button mat-stroked-button color="primary" (click)="loadMore()" [disabled]="loadingMore()">
                    @if (loadingMore()) {
                      <mat-spinner diameter="18"></mat-spinner>
                    } @else {
                      <ng-container>
                        <mat-icon>expand_more</mat-icon>
                        <span>Charger plus</span>
                      </ng-container>
                    }
                  </button>
                </div>
              }
            }
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 24px;
      display: flex;
      justify-content: center;
      min-height: calc(100vh - 80px);
      background: linear-gradient(180deg, #fff8f0 0%, #f5f7fa 100%);
      padding-bottom: 100px;
    }

    .notifications-card {
      width: 100%;
      max-width: 600px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(255, 149, 0, 0.15);
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    // Header
    .card-header {
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -30%;
        width: 80%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 1;
      }

      .header-icon {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        mat-icon {
          color: white;
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        .badge-count {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          background: #ff3b30;
          color: white;
          font-size: 11px;
          font-weight: 700;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(255, 59, 48, 0.4);
          animation: pulse 2s infinite;
        }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .header-text {
        mat-card-title {
          color: white;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        mat-card-subtitle {
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          margin: 0;
        }
      }

      .header-actions {
        display: flex;
        gap: 4px;
        z-index: 1;

        .action-btn {
          color: white;
          transition: background 0.2s;

          &:hover {
            background: rgba(255, 255, 255, 0.15);
          }
        }
      }
    }

    mat-card-content {
      padding: 0;
    }

    // Tabs
    .custom-tabs {
      ::ng-deep {
        .mat-mdc-tab-labels {
          background: #f8f8fc;
          border-bottom: 1px solid #e8e8f0;
        }

        .mat-mdc-tab {
          min-width: 120px;
          
          .mdc-tab__content {
            gap: 8px;
          }
        }

        .mat-mdc-tab-body-wrapper {
          background: #fff;
        }
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .tab-badge {
        margin-left: 8px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 600;
        background: #e8e8f0;
        color: #666;
        border-radius: 10px;

        &.unread {
          background: #ff9500;
          color: white;
        }
      }
    }

    // Loading & Empty states
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: #666;

      p {
        margin-top: 16px;
        font-size: 14px;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 40px;
      text-align: center;

      .empty-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: #ff9500;
        }
      }

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
        max-width: 250px;
      }
    }

    // Notifications list
    .notifications-list {
      padding: 8px 0;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 20px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      animation: fadeInUp 0.3s ease-out both;

      &:hover {
        background: #f8f8fc;
      }

      &.unread {
        background: linear-gradient(90deg, #fff8e1 0%, #fff 100%);

        &:hover {
          background: linear-gradient(90deg, #ffecb3 0%, #f8f8fc 100%);
        }
      }

      .notif-indicator {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 40px;
        background: linear-gradient(180deg, #ff9500 0%, #ff6b00 100%);
        border-radius: 0 4px 4px 0;
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .notif-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }
    }

    .notif-content {
      flex: 1;
      min-width: 0;

      .notif-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 4px;
      }

      .notif-title {
        font-weight: 600;
        font-size: 15px;
        color: #1a1a1a;
        line-height: 1.3;
      }

      .notif-time {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .notif-message {
        margin: 0;
        font-size: 13px;
        color: #666;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .notif-amount {
        display: inline-block;
        margin-top: 8px;
        padding: 4px 10px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 6px;

        &.positive {
          background: #e8f5e9;
          color: #2e7d32;
        }

        &.negative {
          background: #ffebee;
          color: #c62828;
        }
      }
    }

    .notif-menu-btn {
      opacity: 0;
      transition: opacity 0.2s;

      .notification-item:hover & {
        opacity: 1;
      }
    }

    .delete-action {
      color: #e53935 !important;
    }

    // Load more
    .load-more {
      display: flex;
      justify-content: center;
      padding: 20px;
      border-top: 1px solid #f0f0f0;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 24px;
        border-radius: 10px;
      }
    }

    // Mobile responsive
    @media (max-width: 600px) {
      .notifications-container {
        padding: 0;
        background: white;
      }

      .notifications-card {
        box-shadow: none;
        max-width: none;
        border-radius: 0;
      }

      .card-header {
        padding: 20px 16px;

        .header-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;

          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }

        .header-text mat-card-title {
          font-size: 18px;
        }
      }

      .notification-item {
        padding: 14px 16px;
      }

      .notif-menu-btn {
        opacity: 1;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  private pollSubscription?: Subscription;

  notifications = signal<Notification[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  unreadCount = signal(0);
  totalCount = signal(0);
  hasMore = signal(false);
  
  private currentPage = 1;
  private currentTab = 0;
  private readonly pageSize = 20;

  ngOnInit() {
    this.loadNotifications();
    // Démarrer le polling pour les nouvelles notifications
    this.pollSubscription = this.notificationService.startPolling(30000).subscribe();
  }

  ngOnDestroy() {
    this.pollSubscription?.unsubscribe();
  }

  loadNotifications(append = false) {
    if (!append) {
      this.loading.set(true);
      this.currentPage = 1;
    }

    const options: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.currentTab === 1) {
      options.lu = false;
    }

    this.notificationService.getNotifications(options).subscribe({
      next: (response) => {
        if (append) {
          this.notifications.update(notifs => [...notifs, ...response.notifications]);
        } else {
          this.notifications.set(response.notifications);
        }
        this.unreadCount.set(response.nonLues);
        this.totalCount.set(response.pagination?.total || response.notifications.length);
        this.hasMore.set(response.pagination.page < response.pagination.pages);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
        this.snackBar.open('Erreur de chargement', 'OK', { duration: 3000 });
      }
    });
  }

  refreshNotifications() {
    this.loadNotifications();
    this.snackBar.open('Actualisé', 'OK', { duration: 1500 });
  }

  loadMore() {
    this.loadingMore.set(true);
    this.currentPage++;
    this.loadNotifications(true);
  }

  onTabChange(index: number) {
    this.currentTab = index;
    this.loadNotifications();
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update(notifs => 
          notifs.map(n => n.id === id ? { ...n, lu: true } : n)
        );
        this.unreadCount.update(count => Math.max(0, count - 1));
      },
      error: () => {
        this.snackBar.open('Erreur', 'OK', { duration: 2000 });
      }
    });
  }

  markAsUnread(id: string) {
    // Si le service supporte cette fonction
    this.notifications.update(notifs => 
      notifs.map(n => n.id === id ? { ...n, lu: false } : n)
    );
    this.unreadCount.update(count => count + 1);
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        this.notifications.update(notifs => notifs.map(n => ({ ...n, lu: true })));
        this.unreadCount.set(0);
        this.snackBar.open(`${response.count} notification(s) marquée(s) comme lue(s)`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Erreur', 'OK', { duration: 2000 });
      }
    });
  }

  deleteNotification(id: string) {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        const notif = this.notifications().find(n => n.id === id);
        this.notifications.update(notifs => notifs.filter(n => n.id !== id));
        if (notif && !notif.lu) {
          this.unreadCount.update(count => Math.max(0, count - 1));
        }
        this.snackBar.open('Notification supprimée', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur', 'OK', { duration: 2000 });
      }
    });
  }

  openNotification(notif: Notification) {
    if (!notif.lu) {
      this.markAsRead(notif.id);
    }
    // Navigation selon le type
    if (notif.data?.transactionId) {
      // Pourrait naviguer vers les détails de la transaction
    }
  }

  getTypeIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getTypeColor(type: string): string {
    return this.notificationService.getNotificationColor(type);
  }

  getTypeGradient(type: string): string {
    const gradients: Record<string, string> = {
      'DEPOSIT': 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
      'WITHDRAWAL': 'linear-gradient(135deg, #ff6b00 0%, #e53935 100%)',
      'TRANSFER_SENT': 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
      'TRANSFER_RECEIVED': 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
      'SECURITY': 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
      'ACCOUNT': 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
      'PROMOTION': 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
      'SYSTEM': 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)'
    };
    return gradients[type] || 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)';
  }

  isPositiveType(type: string): boolean {
    return ['DEPOSIT', 'TRANSFER_RECEIVED'].includes(type);
  }

  isNegativeType(type: string): boolean {
    return ['WITHDRAWAL', 'TRANSFER_SENT'].includes(type);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return notifDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short'
    });
  }
}
