// frontend/src/app/features/auth/setup-pin/setup-pin.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-setup-pin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="setup-pin-container">
      <mat-card class="setup-pin-card">
        <!-- Header avec gradient orange -->
        <div class="card-header">
          <div class="header-icon">
            <mat-icon>pin</mat-icon>
          </div>
          <h1 class="header-title">Configuration du Code PIN</h1>
          <p class="header-subtitle">Sécurisez vos transactions financières</p>
        </div>

        <mat-card-content>
          <div class="info-box">
            <mat-icon class="info-icon">info</mat-icon>
            <div class="info-content">
              <p class="info-title">Code PIN requis</p>
              <p class="info-text">Votre code PIN sera utilisé pour valider toutes vos transactions (dépôts, retraits, transferts).</p>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" #pinForm="ngForm">
            <div class="pin-input-group">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Code PIN</mat-label>
                <input matInput
                  [type]="showPin() ? 'text' : 'password'"
                  [(ngModel)]="pin"
                  name="pin"
                  required
                  minlength="4"
                  maxlength="6"
                  pattern="[0-9]*"
                  inputmode="numeric"
                  #pinInput="ngModel">
                <mat-icon matPrefix>dialpad</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="showPin.set(!showPin())">
                  <mat-icon>{{ showPin() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-hint>Choisissez un code de 4 à 6 chiffres</mat-hint>
                @if (pinInput.errors?.['minlength']) {
                  <mat-error>Minimum 4 chiffres</mat-error>
                }
                @if (pinInput.errors?.['pattern']) {
                  <mat-error>Chiffres uniquement</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirmer le Code PIN</mat-label>
                <input matInput
                  [type]="showConfirmPin() ? 'text' : 'password'"
                  [(ngModel)]="confirmPin"
                  name="confirmPin"
                  required
                  minlength="4"
                  maxlength="6"
                  pattern="[0-9]*"
                  inputmode="numeric"
                  #confirmPinInput="ngModel">
                <mat-icon matPrefix>dialpad</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="showConfirmPin.set(!showConfirmPin())">
                  <mat-icon>{{ showConfirmPin() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (pin !== confirmPin && confirmPin) {
                  <mat-error>Les codes PIN ne correspondent pas</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="security-tips">
              <h4><mat-icon>security</mat-icon> Conseils de sécurité</h4>
              <ul>
                <li [class.valid]="!isSimplePin()">
                  <mat-icon>{{ isSimplePin() ? 'close' : 'check' }}</mat-icon>
                  Évitez les suites simples (1234, 0000)
                </li>
                <li [class.valid]="pin.length >= 4">
                  <mat-icon>{{ pin.length >= 4 ? 'check' : 'close' }}</mat-icon>
                  Minimum 4 chiffres
                </li>
                <li>
                  <mat-icon>info_outline</mat-icon>
                  Ne partagez jamais votre PIN
                </li>
              </ul>
            </div>

            @if (error()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                {{ error() }}
              </div>
            }

            <button mat-raised-button color="primary" class="submit-btn"
              type="submit"
              [disabled]="loading() || pinForm.invalid || pin !== confirmPin || isSimplePin()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
                <span>Configuration...</span>
              } @else {
                <ng-container>
                  <mat-icon>check</mat-icon>
                  <span>Configurer mon PIN</span>
                </ng-container>
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <p class="footer-text">© Mobile Money — Tous droits réservés</p>
    </div>
  `,
  styles: [`
    .setup-pin-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff5e6 0%, #ffe8cc 50%, #ffd699 100%);
      padding: 2rem 1rem;
    }

    .setup-pin-card {
      max-width: 440px;
      width: 100%;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(255, 149, 0, 0.15);
      border: none;
    }

    .card-header {
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      padding: 2.5rem 2rem;
      text-align: center;
      color: white;
    }

    .header-icon {
      width: 70px;
      height: 70px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      backdrop-filter: blur(10px);

      mat-icon {
        font-size: 35px;
        width: 35px;
        height: 35px;
      }
    }

    .header-title {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .header-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }

    mat-card-content {
      padding: 2rem;
    }

    .info-box {
      display: flex;
      gap: 1rem;
      background: linear-gradient(135deg, rgba(255, 149, 0, 0.08), rgba(255, 149, 0, 0.04));
      border: 1px solid rgba(255, 149, 0, 0.2);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1.5rem;

      .info-icon {
        color: #ff9500;
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .info-content {
        flex: 1;
      }

      .info-title {
        font-weight: 600;
        color: #333;
        margin: 0 0 4px;
        font-size: 0.95rem;
      }

      .info-text {
        color: #666;
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.4;
      }
    }

    .pin-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-width {
      width: 100%;
    }

    .security-tips {
      background: linear-gradient(135deg, #f8f9fa, #f0f2f5);
      padding: 1rem;
      border-radius: 12px;
      margin: 1.5rem 0;
      border: 1px solid rgba(0, 0, 0, 0.05);

      h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.75rem 0;
        color: #333;
        font-size: 0.9rem;
        font-weight: 600;

        mat-icon {
          color: #ff9500;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0;
        font-size: 0.85rem;
        color: #666;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #dc3545;
        }

        &.valid mat-icon {
          color: #28a745;
        }
      }
    }

    .error-message {
      background: rgba(220, 53, 69, 0.1);
      border: 1px solid rgba(220, 53, 69, 0.3);
      color: #dc3545;
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .submit-btn {
      width: 100%;
      height: 52px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 149, 0, 0.4);
      }

      &:disabled {
        background: linear-gradient(135deg, #ccc, #aaa);
        box-shadow: none;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      mat-spinner {
        margin-right: 0.5rem;
      }
    }

    .footer-text {
      margin-top: 2rem;
      color: #666;
      font-size: 0.85rem;
      text-align: center;
    }

    ::ng-deep {
      .mat-mdc-form-field {
        .mdc-text-field--outlined {
          --mdc-outlined-text-field-focus-outline-color: #ff9500;
          --mdc-outlined-text-field-focus-label-text-color: #ff9500;
        }

        .mat-mdc-form-field-icon-prefix {
          color: #666;
          padding-right: 8px;
        }

        &.mat-focused .mat-mdc-form-field-icon-prefix {
          color: #ff9500;
        }
      }
    }

    @media (max-width: 480px) {
      .card-header {
        padding: 2rem 1.5rem;
      }

      .header-icon {
        width: 60px;
        height: 60px;

        mat-icon {
          font-size: 30px;
          width: 30px;
          height: 30px;
        }
      }

      .header-title {
        font-size: 1.3rem;
      }

      mat-card-content {
        padding: 1.5rem;
      }
    }
  `]
})
export class SetupPinComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  pin = '';
  confirmPin = '';
  showPin = signal(false);
  showConfirmPin = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  private simplePatterns = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '123456', '654321'];

  isSimplePin(): boolean {
    return this.simplePatterns.includes(this.pin);
  }

  onSubmit(): void {
    if (this.pin !== this.confirmPin) {
      this.error.set('Les codes PIN ne correspondent pas');
      return;
    }

    if (this.isSimplePin()) {
      this.error.set('Code PIN trop simple. Choisissez un code plus sécurisé.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.setupPin({ pin: this.pin, confirmPin: this.confirmPin }).subscribe({
      next: () => {
        this.loading.set(false);
        // Rediriger vers le dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        // Si le PIN est déjà configuré, rediriger vers le dashboard
        if (err.message?.includes('déjà configuré')) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(err.message || 'Erreur lors de la configuration du PIN');
        }
      }
    });
  }
}
