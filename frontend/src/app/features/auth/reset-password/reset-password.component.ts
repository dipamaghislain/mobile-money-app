import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="reset-container">
      <mat-card class="reset-card">
        <div class="card-header">
          <mat-icon>lock_reset</mat-icon>
          <h2>Réinitialisation du mot de passe</h2>
        </div>
        <mat-card-content>
          <p class="info-text">
            Pour réinitialiser votre mot de passe, veuillez utiliser la page 
            "Mot de passe oublié" qui vous enverra un code de vérification par email.
          </p>
          <div class="actions">
            <button mat-raised-button color="primary" routerLink="/auth/forgot-password">
              <mat-icon>email</mat-icon>
              Mot de passe oublié
            </button>
            <button mat-stroked-button routerLink="/auth/login">
              Retour à la connexion
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(145deg, #f5f7fa 0%, #e8ecf1 100%);
    }
    .reset-card {
      max-width: 400px;
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
    }
    .card-header {
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .card-header mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .card-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    mat-card-content {
      padding: 24px !important;
    }
    .info-text {
      color: #666;
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .actions button {
      width: 100%;
    }
    .actions button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Rediriger automatiquement vers forgot-password après 3 secondes
    setTimeout(() => {
      this.router.navigate(['/auth/forgot-password']);
    }, 5000);
  }
}



