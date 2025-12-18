import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/wallet.service';

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
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile-view.html',
  styleUrl: './profile-view.scss',
})
export class ProfileView implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  user = computed(() => this.authService.currentUserValue);
  hasPin = signal<boolean | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.checkPinStatus();
  }

  checkPinStatus(): void {
    // On vérifie si le PIN existe en essayant de le vérifier
    // Si une erreur indique qu'aucun PIN n'est défini, on sait qu'il n'y en a pas
    this.walletService.getWallet().subscribe({
      next: () => {
        // Le portefeuille existe, on suppose qu'un PIN peut être défini
        // On ne peut pas vraiment vérifier sans essayer, donc on laisse l'utilisateur essayer
        this.hasPin.set(true);
      },
      error: () => {
        this.hasPin.set(false);
      }
    });
  }

  openPinModal(): void {
    const dialogRef = this.dialog.open(PinModalComponent, {
      width: '90%',
      maxWidth: '500px',
      disableClose: true,
      data: { hasPin: this.hasPin() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.hasPin.set(true);
        this.snackBar.open('PIN mis à jour avec succès', 'OK', { duration: 3000 });
      }
    });
  }
}

// ============================================
// COMPOSANT MODAL PIN
// ============================================
@Component({
  selector: 'app-pin-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>
          <mat-icon>lock</mat-icon>
          {{ data.hasPin ? 'Modifier le code PIN' : 'Définir le code PIN' }}
        </h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <div class="info-box">
          <mat-icon class="info-icon">info</mat-icon>
          <div class="info-content">
            <p><strong>Le code PIN protège vos transactions financières.</strong></p>
            <ul>
              <li>4 à 6 chiffres uniquement</li>
              <li>Nécessaire pour retirer, transférer ou payer</li>
              <li>Gardez-le secret et ne le partagez jamais</li>
            </ul>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (error()) {
          <div class="error-message">
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
          </div>
          }

          @if (success()) {
          <div class="success-message">
            <mat-icon>check_circle</mat-icon>
            <span>{{ success() }}</span>
          </div>
          }

          @if (data.hasPin) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Ancien code PIN</mat-label>
            <input matInput type="password" formControlName="ancienPin" placeholder="****" maxlength="6" autocomplete="off">
            <mat-icon matPrefix>lock</mat-icon>
            <mat-hint>Entrez votre code PIN actuel</mat-hint>
            <mat-error *ngIf="form.get('ancienPin')?.hasError('required')">
              L'ancien PIN est requis
            </mat-error>
          </mat-form-field>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nouveau code PIN</mat-label>
            <input matInput type="password" formControlName="nouveauPin" placeholder="****" maxlength="6" autocomplete="off">
            <mat-icon matPrefix>lock</mat-icon>
            <mat-hint>4 à 6 chiffres</mat-hint>
            <mat-error *ngIf="form.get('nouveauPin')?.hasError('required')">
              Le nouveau PIN est requis
            </mat-error>
            <mat-error *ngIf="form.get('nouveauPin')?.hasError('minlength')">
              Le PIN doit contenir au moins 4 chiffres
            </mat-error>
            <mat-error *ngIf="form.get('nouveauPin')?.hasError('pattern')">
              Le PIN doit contenir uniquement des chiffres
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmer le nouveau code PIN</mat-label>
            <input matInput type="password" formControlName="confirmationPin" placeholder="****" maxlength="6" autocomplete="off">
            <mat-icon matPrefix>lock</mat-icon>
            <mat-hint>Répétez le nouveau PIN</mat-hint>
            <mat-error *ngIf="form.get('confirmationPin')?.hasError('required')">
              La confirmation est requise
            </mat-error>
            <mat-error *ngIf="form.hasError('pinMismatch')">
              Les codes PIN ne correspondent pas
            </mat-error>
          </mat-form-field>

          <div class="modal-actions">
            <button mat-button type="button" (click)="close()">Annuler</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
              <span>En cours...</span>
              } @else {
              <mat-icon>check</mat-icon>
              <span>{{ data.hasPin ? 'Modifier' : 'Définir' }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 0;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .modal-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
    }
    .modal-content {
      padding: 24px;
    }
    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      margin-bottom: 24px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 8px;
    }
    .info-icon {
      color: #2196f3;
      flex-shrink: 0;
    }
    .info-content ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    .info-content li {
      margin-bottom: 4px;
      font-size: 13px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
      border-left: 4px solid #f44336;
    }
    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #4caf50;
    }
  `]
})
class PinModalComponent {
  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);
  private dialogRef = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  data: { hasPin: boolean | null } = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    ancienPin: [''],
    nouveauPin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]],
    confirmationPin: ['', [Validators.required]]
  }, { validators: this.pinMatchValidator });

  constructor() {
    if (!this.data.hasPin) {
      this.form.get('ancienPin')?.clearValidators();
    } else {
      this.form.get('ancienPin')?.setValidators([Validators.required]);
    }
  }

  pinMatchValidator(group: any) {
    const nouveau = group.get('nouveauPin')?.value;
    const confirmation = group.get('confirmationPin')?.value;
    return nouveau === confirmation ? null : { pinMismatch: true };
  }

  close(): void {
    this.dialogRef.closeAll();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { ancienPin, nouveauPin } = this.form.value;
    const ancien = this.data.hasPin ? ancienPin ?? undefined : undefined;

    this.walletService.setPin(nouveauPin!, ancien).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('PIN mis à jour avec succès !');
        setTimeout(() => {
          this.dialogRef.closeAll();
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Une erreur est survenue');
      }
    });
  }
}


