import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nomComplet: ['', [Validators.required, Validators.minLength(3)]],
      telephone: ['', [Validators.pattern(/^[0-9]{8,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: ['', [Validators.required]],
      role: ['client']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('motDePasse');
    const confirmPassword = form.get('confirmMotDePasse');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { confirmMotDePasse, ...userData } = this.registerForm.value;

    this.auth.register(userData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        this.errorMessage.set(e.message);
        this.loading.set(false);
      }
    });
  }
}
