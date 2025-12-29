import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-pin-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
    template: `
    <h2 mat-dialog-title>Confirmation</h2>
    <mat-dialog-content>
      <p>Veuillez entrer votre code PIN pour confirmer la transaction.</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Code PIN</mat-label>
        <input matInput [(ngModel)]="pin" type="password" maxlength="4" pattern="[0-9]*" (keyup.enter)="confirm()">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="!pin || pin.length < 4" (click)="confirm()">Confirmer</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .full-width { width: 100%; margin-top: 16px; }
  `]
})
export class PinDialogComponent {
    readonly dialogRef = inject(MatDialogRef<PinDialogComponent>);
    pin = '';

    confirm() {
        if (this.pin && this.pin.length >= 4) {
            this.dialogRef.close(this.pin);
        }
    }
}
