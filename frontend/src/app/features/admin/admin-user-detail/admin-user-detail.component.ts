// frontend/src/app/features/admin/admin-user-detail/admin-user-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminService, UserDetailResponse } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-user-detail',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './admin-user-detail.component.html',
  styleUrl: './admin-user-detail.component.scss'
})
export class AdminUserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  userDetail = signal<UserDetailResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  updating = signal(false);

  private userId: string = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUserDetail();
    } else {
      this.error.set('ID utilisateur non fourni');
      this.loading.set(false);
    }
  }

  loadUserDetail(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getUserById(this.userId).subscribe({
      next: (detail) => {
        this.userDetail.set(detail);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors du chargement');
        this.loading.set(false);
      }
    });
  }

  toggleUserStatus(): void {
    const detail = this.userDetail();
    if (!detail) return;

    const newStatus = detail.user.statut === 'actif' ? 'bloque' : 'actif';
    const action = newStatus === 'actif' ? 'débloquer' : 'bloquer';

    if (!confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) {
      return;
    }

    this.updating.set(true);

    this.adminService.updateUserStatus(this.userId, newStatus).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'OK', { duration: 3000 });
        this.loadUserDetail();
        this.updating.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de la mise à jour', 'OK', {
          duration: 3000
        });
        this.updating.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'admin_panel_settings';
      case 'marchand': return 'store';
      default: return 'person';
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'marchand': return 'role-merchant';
      default: return 'role-client';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'marchand': return 'Marchand';
      default: return 'Client';
    }
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
      '#f59e0b', '#10b981', '#3b82f6', '#06b6d4'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.snackBar.open('Copié dans le presse-papiers', 'OK', { duration: 2000 });
  }
}

