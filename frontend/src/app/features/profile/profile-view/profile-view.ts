import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import localeFr from '@angular/common/locales/fr';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ChangePasswordDialog } from './change-password-dialog';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

// Register French locale for date formatting
registerLocaleData(localeFr);

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatRippleModule,
    MatSnackBarModule,
    MatDialogModule,
    BottomNavComponent
  ],
  templateUrl: './profile-view.html',
  styleUrl: './profile-view.scss',
})
export class ProfileView implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Signals
  user = computed(() => this.authService.currentUserValue);
  balance = signal<number>(0);
  savings = signal<number>(0); // Mock for now as requested

  // Computed
  initials = computed(() => {
    const name = this.user()?.nomComplet || '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  ngOnInit(): void {
    this.fetchWalletData();
  }

  fetchWalletData() {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.balance.set(wallet.solde || 0);
        // Mock savings to 0 or random value if desired, sticking to 0 for realism
        this.savings.set(0);
      },
      error: (err) => console.error('Error fetching wallet', err)
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  openChangePasswordDialog() {
    this.dialog.open(ChangePasswordDialog, {
      width: '400px',
      disableClose: false
    });
  }

  tempAction(name: string) {
    this.snackBar.open(`${name} - Fonctionnalité à venir`, 'OK', { duration: 2000 });
  }
}
