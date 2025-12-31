// frontend/src/app/features/admin/admin-users/admin-users.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminService, AdminUser, UserFilters } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatMenuModule,
    MatDividerModule
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
  
  // View mode
  viewMode = signal<'grid' | 'table'>('grid');
  
  // Search control
  searchControl = new FormControl('');
  
  // Table columns
  displayedColumns = ['avatar', 'name', 'phone', 'role', 'balance', 'status', 'actions'];

  // Filtres
  searchQuery = signal('');
  roleFilter = signal<string>('all');
  statutFilter = signal<string>('');
  currentPage = signal(1);
  pageSize = signal(50);

  // Computed stats
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.statut === 'actif').length);
  blockedUsers = computed(() => this.users().filter(u => u.statut === 'bloque').length);
  merchantUsers = computed(() => this.users().filter(u => u.role === 'marchand').length);
  
  // Filtered users
  filteredUsers = computed(() => {
    let result = this.users();
    
    const search = this.searchQuery().toLowerCase();
    if (search) {
      result = result.filter(u => 
        u.nomComplet.toLowerCase().includes(search) ||
        (u.email && u.email.toLowerCase().includes(search)) ||
        u.telephone.includes(search)
      );
    }
    
    const role = this.roleFilter();
    if (role && role !== 'all') {
      result = result.filter(u => u.role === role);
    }
    
    return result;
  });

  ngOnInit(): void {
    this.loadUsers();
    
    // Search debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchQuery.set(value || '');
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: UserFilters = {
      limit: this.pageSize(),
      skip: (this.currentPage() - 1) * this.pageSize()
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
    this.currentPage.set(1);
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  hasActiveFilters(): boolean {
    return !!this.searchQuery() || !!this.roleFilter() || !!this.statutFilter();
  }

  blockUser(user: AdminUser): void {
    if (!confirm(`Voulez-vous vraiment bloquer ${user.nomComplet} ?`)) {
      return;
    }

    this.adminService.updateUserStatus(user._id, 'bloque').subscribe({
      next: (response) => {
        this.snackBar.open(`${user.nomComplet} a été bloqué`, 'OK', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors du blocage', 'OK', {
          duration: 3000
        });
      }
    });
  }

  unblockUser(user: AdminUser): void {
    if (!confirm(`Voulez-vous vraiment débloquer ${user.nomComplet} ?`)) {
      return;
    }

    this.adminService.updateUserStatus(user._id, 'actif').subscribe({
      next: (response) => {
        this.snackBar.open(`${user.nomComplet} a été débloqué`, 'OK', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors du déblocage', 'OK', {
          duration: 3000
        });
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.statutFilter.set('');
    this.currentPage.set(1);
    this.loadUsers();
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'admin_panel_settings';
      case 'marchand': return 'store';
      default: return 'person';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'marchand': return 'Marchand';
      default: return 'Client';
    }
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
  
  setRoleFilter(role: string): void {
    this.roleFilter.set(role);
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

