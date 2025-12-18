// frontend/src/app/features/admin/admin-users/admin-users.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AdminService, AdminUser, UserFilters } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
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
    MatPaginatorModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    DatePipe
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  users = signal<AdminUser[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);

  // Filtres
  searchQuery = signal('');
  roleFilter = signal<string>('');
  statutFilter = signal<string>('');
  pageIndex = signal(0);
  pageSize = signal(10);

  // Table columns
  displayedColumns = ['user', 'telephone', 'role', 'statut', 'date', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: UserFilters = {
      limit: this.pageSize(),
      skip: this.pageIndex() * this.pageSize()
    };

    if (this.searchQuery()) filters.search = this.searchQuery();
    if (this.roleFilter()) filters.role = this.roleFilter();
    if (this.statutFilter()) filters.statut = this.statutFilter();

    this.adminService.getUsers(filters).subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Erreur lors du chargement des utilisateurs');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  toggleUserStatus(user: AdminUser): void {
    const newStatus = user.statut === 'actif' ? 'bloque' : 'actif';
    const action = newStatus === 'actif' ? 'débloquer' : 'bloquer';

    if (!confirm(`Voulez-vous vraiment ${action} ${user.nomComplet} ?`)) {
      return;
    }

    this.adminService.updateUserStatus(user._id, newStatus).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'OK', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de la mise à jour', 'OK', {
          duration: 3000
        });
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.statutFilter.set('');
    this.pageIndex.set(0);
    this.loadUsers();
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'marchand': return 'role-merchant';
      default: return 'role-client';
    }
  }

  getStatusClass(statut: string): string {
    return statut === 'actif' ? 'status-active' : 'status-blocked';
  }
}

