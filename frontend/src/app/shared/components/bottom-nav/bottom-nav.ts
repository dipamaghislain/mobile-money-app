// Composant de navigation en bas - Mobile Money App
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="bottom-nav">
      <a [routerLink]="['/dashboard']" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
        <mat-icon>home</mat-icon>
        <span>Accueil</span>
      </a>
      <a [routerLink]="['/transactions/history']" routerLinkActive="active" class="nav-item">
        <mat-icon>history</mat-icon>
        <span>Historique</span>
      </a>
      <a [routerLink]="['/transactions/transfer']" routerLinkActive="active" class="nav-item send-item">
        <div class="send-btn">
          <mat-icon>send</mat-icon>
        </div>
        <span>Envoyer</span>
      </a>
      <a [routerLink]="['/savings']" routerLinkActive="active" class="nav-item">
        <mat-icon>savings</mat-icon>
        <span>Épargne</span>
      </a>
      <a [routerLink]="['/profile']" routerLinkActive="active" class="nav-item">
        <mat-icon>person</mat-icon>
        <span>Profil</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      padding: 8px 16px 12px;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
      z-index: 1000;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      text-decoration: none;
      color: #8e8e93;
      font-size: 10px;
      font-weight: 500;
      transition: all 0.2s ease;
      min-width: 56px;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        transition: transform 0.2s ease;
      }

      &.active {
        color: #ff9500;

        mat-icon {
          transform: scale(1.1);
        }
      }

      &:hover:not(.active) {
        color: #666;
      }
    }

    .send-item {
      .send-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 2px;
        box-shadow: 0 4px 12px rgba(255, 149, 0, 0.35);
        transition: all 0.2s ease;

        mat-icon {
          color: white;
          font-size: 20px;
          width: 20px;
          height: 20px;
          transform: rotate(-45deg);
        }
      }

      &.active .send-btn,
      &:hover .send-btn {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(255, 149, 0, 0.45);
      }

      &.active {
        color: #ff9500;
      }
    }

    @media (min-width: 600px) {
      .bottom-nav {
        max-width: 560px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 24px 24px 0 0;
        padding: 10px 24px 14px;
      }
    }
  `]
})
export class BottomNavComponent {}
