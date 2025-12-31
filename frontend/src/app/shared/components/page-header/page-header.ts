// Composant Page Header - Mobile Money App
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <header class="page-header">
      <button mat-icon-button class="back-btn" (click)="onBack()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="header-content">
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="subtitle">{{ subtitle }}</p>
        }
      </div>
      @if (showAction) {
        <button mat-icon-button class="action-btn" (click)="actionClick.emit()">
          <mat-icon>{{ actionIcon }}</mat-icon>
        </button>
      }
    </header>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      padding: 16px 8px 16px 4px;
      background: white;
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid #f0f0f0;
    }

    .back-btn {
      color: #333;
    }

    .header-content {
      flex: 1;
      margin-left: 8px;

      h1 {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: #1a1a2e;
      }

      .subtitle {
        font-size: 13px;
        color: #666;
        margin: 2px 0 0;
      }
    }

    .action-btn {
      color: #ff9500;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() backUrl = '/dashboard';
  @Input() showAction = false;
  @Input() actionIcon = 'more_vert';
  @Output() actionClick = new EventEmitter<void>();

  constructor(private location: Location) {}

  onBack(): void {
    this.location.back();
  }
}
