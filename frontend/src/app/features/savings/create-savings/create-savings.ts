import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { SavingsService } from '../../../core/services/savings.service';

@Component({
  selector: 'app-create-savings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatCardModule],
  templateUrl: './create-savings.html',
  styleUrl: './create-savings.scss',
})
export class CreateSavings {
  private readonly fb = inject(FormBuilder);
  private readonly savingsService = inject(SavingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  form = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    objectifMontant: [null, [Validators.min(1)]],
    dateObjectif: [null],
    icone: [''],
    couleur: ['']
  });

  loading = false;
  preview: any = null;

  // Prévisualiser la tirelire avant création
  submit(): void {
    if (this.form.invalid) {
      this.snackBar.open('Veuillez corriger le formulaire', 'OK', { duration: 3000 });
      return;
    }
    // Prepare preview object
    this.preview = { ...this.form.value };
    if (this.preview.objectifMontant === null || this.preview.objectifMontant === '') this.preview.objectifMontant = null;
  }

  // Confirmer et créer la tirelire
  confirmCreate(): void {
    if (!this.preview) return;
    this.loading = true;
    const payload: any = { ...this.preview };
    if (!payload.description) delete payload.description;
    if (!payload.icone) delete payload.icone;
    if (!payload.couleur) delete payload.couleur;

    this.savingsService.createSaving(payload).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Tirelire créée', 'OK', { duration: 3000 });
        this.router.navigate(['/savings']);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de la création', 'OK', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  cancelPreview(): void {
    this.preview = null;
  }
}
