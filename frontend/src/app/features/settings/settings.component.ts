import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-settings',
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatSlideToggleModule,
        MatRippleModule,
        MatSnackBarModule,
        FormsModule
    ],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);

    // Settings state
    darkMode = signal(false);
    biometricAuth = signal(true);
    currentLanguage = signal('Français');

    goBack(): void {
        this.router.navigateByUrl('/dashboard');
    }

    toggleDarkMode(): void {
        this.darkMode.update(v => !v);
        this.snackBar.open(
            this.darkMode() ? 'Mode sombre activé' : 'Mode sombre désactivé',
            'OK',
            { duration: 2000 }
        );
    }

    toggleBiometric(): void {
        this.biometricAuth.update(v => !v);
        this.snackBar.open(
            this.biometricAuth() ? 'Authentification biométrique activée' : 'Authentification biométrique désactivée',
            'OK',
            { duration: 2000 }
        );
    }

    openLanguageSelection(): void {
        this.snackBar.open('Sélection de langue - Fonctionnalité à venir', 'OK', { duration: 3000 });
    }

    openChangePIN(): void {
        this.router.navigateByUrl('/settings/change-pin');
    }

    openLinkedCards(): void {
        this.snackBar.open('Cartes liées - Fonctionnalité à venir', 'OK', { duration: 3000 });
    }
}
