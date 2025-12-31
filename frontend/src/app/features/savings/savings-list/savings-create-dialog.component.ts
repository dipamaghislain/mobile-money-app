// src/app/features/savings/savings-list/savings-create-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-savings-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <button mat-icon-button class="close-btn" (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
        <div class="header-icon">
          <mat-icon>{{ icone }}</mat-icon>
        </div>
        <h2>Nouvel Objectif</h2>
        <p>Créez un objectif d'épargne personnalisé</p>
      </div>

      <!-- Body -->
      <div class="dialog-body">
        <!-- Nom -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom de l'objectif</mat-label>
          <mat-icon matPrefix class="field-icon">label</mat-icon>
          <input matInput [(ngModel)]="nom" placeholder="Ex: Vacances, Téléphone..." maxlength="50" required>
          <mat-hint align="end">{{ nom.length }}/50</mat-hint>
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <mat-icon matPrefix class="field-icon">notes</mat-icon>
          <textarea matInput [(ngModel)]="description" rows="2" maxlength="200" placeholder="Décrivez votre objectif..."></textarea>
          <mat-hint>Optionnel</mat-hint>
        </mat-form-field>

        <!-- Montant et Date sur la même ligne -->
        <div class="row-fields">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Montant cible</mat-label>
            <mat-icon matPrefix class="field-icon">paid</mat-icon>
            <input matInput type="number" [(ngModel)]="objectifMontant" min="0" placeholder="100 000">
            <span matTextSuffix class="currency-suffix">XOF</span>
            <mat-hint>Optionnel</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Date limite</mat-label>
            <mat-icon matPrefix class="field-icon">event</mat-icon>
            <input matInput [matDatepicker]="picker" [(ngModel)]="dateObjectif" [min]="minDate" placeholder="JJ/MM/AAAA">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-hint>Optionnel</mat-hint>
          </mat-form-field>
        </div>

        <!-- Preview Card -->
        @if (nom.trim()) {
          <div class="preview-section">
            <span class="section-label">Aperçu</span>
            <div class="preview-card" [style.border-left-color]="couleur">
              <div class="preview-icon" [style.background]="couleur">
                <mat-icon>{{ icone }}</mat-icon>
              </div>
              <div class="preview-info">
                <span class="preview-name">{{ nom }}</span>
                @if (objectifMontant) {
                  <span class="preview-amount">Objectif: {{ objectifMontant | number }} XOF</span>
                }
              </div>
            </div>
          </div>
        }

        <!-- Icônes -->
        <div class="customization-section">
          <span class="section-label">
            <mat-icon>category</mat-icon>
            Choisir une icône
          </span>
          <div class="icons-grid">
            @for (icon of icons; track icon.value) {
              <button type="button" 
                      class="icon-btn" 
                      [class.selected]="icone === icon.value"
                      [style.--selected-color]="couleur"
                      (click)="icone = icon.value"
                      [title]="icon.label">
                <mat-icon>{{ icon.value }}</mat-icon>
              </button>
            }
          </div>
        </div>

        <!-- Couleurs -->
        <div class="customization-section">
          <span class="section-label">
            <mat-icon>palette</mat-icon>
            Choisir une couleur
          </span>
          <div class="colors-grid">
            @for (color of colors; track color) {
              <button type="button" 
                      class="color-btn" 
                      [style.background]="color"
                      [class.selected]="couleur === color"
                      (click)="couleur = color">
                @if (couleur === color) {
                  <mat-icon>check</mat-icon>
                }
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <button mat-stroked-button (click)="cancel()">
          Annuler
        </button>
        <button mat-raised-button 
                [style.background]="couleur"
                [style.color]="'white'"
                [disabled]="!nom.trim()" 
                (click)="confirm()">
          <mat-icon>add</mat-icon>
          Créer l'objectif
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    ::ng-deep .mat-mdc-dialog-surface {
      background: white !important;
      border-radius: 16px !important;
    }
    .dialog-container {
      padding: 0;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 16px;
    }
    
    /* Header */
    .dialog-header {
      position: relative;
      text-align: center;
      padding: 28px 24px 20px;
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      color: white;
    }
    .close-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      color: white;
      opacity: 0.8;
    }
    .close-btn:hover {
      opacity: 1;
    }
    .header-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      backdrop-filter: blur(10px);
    }
    .header-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 600;
    }
    .dialog-header p {
      margin: 6px 0 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
    
    /* Body */
    .dialog-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
    .field-icon {
      color: #999;
      margin-right: 8px;
    }
    .currency-suffix {
      color: #ff9500;
      font-weight: 600;
      font-size: 0.85rem;
    }
    
    /* Row fields */
    .row-fields {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    .half-width {
      flex: 1;
    }
    
    /* Preview */
    .preview-section {
      margin-bottom: 20px;
    }
    .preview-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #ff9500;
    }
    .preview-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .preview-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .preview-info {
      display: flex;
      flex-direction: column;
    }
    .preview-name {
      font-weight: 600;
      color: #333;
    }
    .preview-amount {
      font-size: 0.85rem;
      color: #666;
    }
    
    /* Sections */
    .customization-section {
      margin-bottom: 20px;
    }
    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #555;
      margin-bottom: 12px;
    }
    .section-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #888;
    }
    
    /* Icons Grid */
    .icons-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    .icon-btn {
      aspect-ratio: 1;
      border: 2px solid #e8e8e8;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }
    .icon-btn:hover {
      border-color: #ccc;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .icon-btn.selected {
      border-color: var(--selected-color, #ff9500);
      background: color-mix(in srgb, var(--selected-color, #ff9500) 10%, white);
    }
    .icon-btn mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #666;
    }
    .icon-btn.selected mat-icon {
      color: var(--selected-color, #ff9500);
    }
    
    /* Colors Grid */
    .colors-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 10px;
    }
    .color-btn {
      aspect-ratio: 1;
      border: 3px solid transparent;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
    }
    .color-btn:hover {
      transform: scale(1.15);
    }
    .color-btn.selected {
      border-color: #333;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      transform: scale(1.1);
    }
    .color-btn mat-icon {
      color: white;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    /* Actions */
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px;
      border-top: 1px solid #eee;
      background: #fafafa;
      margin: 0 -24px -24px;
    }
    .dialog-actions button {
      min-width: 120px;
    }
    .dialog-actions button mat-icon {
      margin-right: 6px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .row-fields {
        flex-direction: column;
        gap: 0;
      }
      .half-width {
        width: 100%;
      }
      .icons-grid {
        grid-template-columns: repeat(5, 1fr);
      }
      .colors-grid {
        grid-template-columns: repeat(8, 1fr);
      }
      .dialog-actions {
        flex-direction: column;
      }
      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class SavingsCreateDialog {
  private dialogRef = inject(MatDialogRef<SavingsCreateDialog>);

  nom: string = '';
  description: string = '';
  objectifMontant: number | null = null;
  dateObjectif: Date | null = null;
  icone: string = 'savings';
  couleur: string = '#ff9500';

  minDate = new Date();

  icons = [
    { value: 'savings', label: 'Épargne' },
    { value: 'flight', label: 'Voyage' },
    { value: 'phone_iphone', label: 'Téléphone' },
    { value: 'laptop', label: 'Ordinateur' },
    { value: 'home', label: 'Maison' },
    { value: 'directions_car', label: 'Voiture' },
    { value: 'school', label: 'Études' },
    { value: 'celebration', label: 'Fête' },
    { value: 'favorite', label: 'Mariage' },
    { value: 'child_care', label: 'Enfant' }
  ];

  colors = [
    '#ff9500', '#ff6b00', '#f44336', '#e91e63', 
    '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
    '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffc107', '#ff5722'
  ];

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.nom.trim()) {
      this.dialogRef.close({
        nom: this.nom.trim(),
        description: this.description.trim() || undefined,
        objectifMontant: this.objectifMontant || undefined,
        dateObjectif: this.dateObjectif || undefined,
        icone: this.icone,
        couleur: this.couleur
      });
    }
  }
}
