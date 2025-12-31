// frontend/src/app/features/admin/admin-layout/admin-layout.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">MobileMoney</span>
            }
          </div>
          <button mat-icon-button class="collapse-btn" (click)="toggleSidebar()">
            <mat-icon>{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            @if (!sidebarCollapsed()) {
              <span class="nav-section-title">PRINCIPAL</span>
            }
            @for (item of mainNavItems; track item.route) {
              <a class="nav-item" 
                 [routerLink]="item.route" 
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: item.route === '/admin'}"
                 [matTooltip]="sidebarCollapsed() ? item.label : ''"
                 matTooltipPosition="right">
                <mat-icon>{{ item.icon }}</mat-icon>
                @if (!sidebarCollapsed()) {
                  <span>{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="badge">{{ item.badge }}</span>
                  }
                }
              </a>
            }
          </div>

          <div class="nav-section">
            @if (!sidebarCollapsed()) {
              <span class="nav-section-title">GESTION</span>
            }
            @for (item of managementNavItems; track item.route) {
              <a class="nav-item" 
                 [routerLink]="item.route" 
                 routerLinkActive="active"
                 [matTooltip]="sidebarCollapsed() ? item.label : ''"
                 matTooltipPosition="right">
                <mat-icon>{{ item.icon }}</mat-icon>
                @if (!sidebarCollapsed()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            }
          </div>
        </nav>

        <div class="sidebar-footer">
          <a class="nav-item" routerLink="/dashboard"
             [matTooltip]="sidebarCollapsed() ? 'Retour App' : ''"
             matTooltipPosition="right">
            <mat-icon>exit_to_app</mat-icon>
            @if (!sidebarCollapsed()) {
              <span>Retour à l'app</span>
            }
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="topbar-left">
            <h1 class="page-title">Administration</h1>
          </div>
          
          <div class="topbar-right">
            <button mat-icon-button class="topbar-btn" matTooltip="Rechercher">
              <mat-icon>search</mat-icon>
            </button>
            
            <button mat-icon-button class="topbar-btn" [matBadge]="3" matBadgeColor="warn" matBadgeSize="small" matTooltip="Notifications">
              <mat-icon>notifications</mat-icon>
            </button>

            <div class="user-menu">
              <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
                <div class="user-avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <span class="user-name">Admin</span>
                <mat-icon>expand_more</mat-icon>
              </button>
              <mat-menu #userMenu="matMenu" xPosition="before">
                <button mat-menu-item routerLink="/profile">
                  <mat-icon>person</mat-icon>
                  <span>Mon profil</span>
                </button>
                <button mat-menu-item>
                  <mat-icon>settings</mat-icon>
                  <span>Paramètres</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="logout()">
                  <mat-icon>logout</mat-icon>
                  <span>Déconnexion</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #f0f2f5;
    }

    // Sidebar
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      height: 100vh;
      z-index: 100;

      &.collapsed {
        width: 72px;

        .sidebar-header {
          padding: 16px 12px;
          justify-content: center;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
        }

        .collapse-btn {
          position: absolute;
          right: -12px;
          background: #1a1a2e;
          border: 2px solid #f0f2f5;
        }

        .nav-item {
          justify-content: center;
          padding: 14px;

          mat-icon {
            margin-right: 0;
          }
        }

        .nav-section-title {
          display: none;
        }
      }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .collapse-btn {
      color: rgba(255,255,255,0.6);
      transition: all 0.3s;

      &:hover {
        color: white;
        background: rgba(255,255,255,0.1);
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 12px;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-section-title {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.4);
      letter-spacing: 1px;
      padding: 0 12px;
      margin-bottom: 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      border-radius: 10px;
      margin-bottom: 4px;
      transition: all 0.2s;
      position: relative;

      mat-icon {
        margin-right: 12px;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      span {
        font-size: 14px;
        font-weight: 500;
      }

      .badge {
        margin-left: auto;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
      }

      &:hover {
        background: rgba(255,255,255,0.08);
        color: white;
      }

      &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

        mat-icon {
          color: white;
        }
      }
    }

    .sidebar-footer {
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    // Main Wrapper
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .sidebar.collapsed + .main-wrapper {
      margin-left: 72px;
    }

    // Topbar
    .topbar {
      height: 70px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .topbar-left {
      .page-title {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a2e;
        margin: 0;
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .topbar-btn {
      color: #64748b;

      &:hover {
        color: #1a1a2e;
        background: #f1f5f9;
      }
    }

    .user-menu {
      margin-left: 16px;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 25px;
      background: #f8fafc;

      &:hover {
        background: #f1f5f9;
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: white;
      }
    }

    .user-name {
      font-weight: 500;
      color: #1a1a2e;
    }

    // Main Content
    .main-content {
      flex: 1;
      padding: 24px 32px;
    }

    // Responsive
    @media (max-width: 1024px) {
      .sidebar {
        width: 72px;

        .logo-text, .nav-section-title, .nav-item span, .nav-item .badge {
          display: none;
        }

        .nav-item {
          justify-content: center;
          padding: 14px;

          mat-icon {
            margin-right: 0;
          }
        }
      }

      .main-wrapper {
        margin-left: 72px;
      }

      .collapse-btn {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }

      .main-wrapper {
        margin-left: 0;
      }

      .topbar {
        padding: 0 16px;
      }

      .main-content {
        padding: 16px;
      }

      .user-name {
        display: none;
      }
    }
  `]
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  sidebarCollapsed = signal(false);

  mainNavItems: NavItem[] = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/admin' },
    { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt_long', label: 'Transactions', route: '/admin/transactions', badge: 5 },
  ];

  managementNavItems: NavItem[] = [
    { icon: 'store', label: 'Marchands', route: '/admin/merchants' },
    { icon: 'tune', label: 'Paramètres', route: '/admin/settings' },
    { icon: 'bar_chart', label: 'Rapports', route: '/admin/reports' },
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
