import { Component, OnInit, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

// Extend window type for Google Identity Services
declare global {
  interface Window {
    google: any;
    handleGoogleCredential: (response: any) => void;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private ngZone  = inject(NgZone);

  loginForm!: FormGroup;
  roles         = ['Recruiter', 'HR Manager', 'Admin'];
  selectedRole  = 'Recruiter';
  showPass      = false;
  isLoading     = false;
  googleLoading = false;
  serverError   = '';

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false]
    });

    this.initGoogleSignIn();
  }

  // ── Google Identity Services ──────────────────────────────
  private initGoogleSignIn(): void {
    // Load Google script dynamically
    const script = document.createElement('script');
    script.src   = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.renderGoogleButton();
    document.head.appendChild(script);

    // Global callback for Google's credential response
    window.handleGoogleCredential = (response: any) => {
      this.ngZone.run(() => this.onGoogleCredential(response.credential));
    };
  }

  private renderGoogleButton(): void {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback:  'handleGoogleCredential',
      auto_select: false
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { type: 'standard', theme: 'filled_black', size: 'large', width: 360, text: 'signin_with' }
    );
  }

  private onGoogleCredential(idToken: string): void {
    this.googleLoading = true;
    this.serverError   = '';

    this.auth.googleLogin(idToken, this.selectedRole).subscribe({
      next: () => {
        this.googleLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.googleLoading = false;
        this.serverError   = err?.error?.message ?? 'Google sign-in failed. Please try again.';
      }
    });
  }

  // ── Email / Password ──────────────────────────────────────
  selectRole(role: string): void { this.selectedRole = role; }
  togglePassword(): void         { this.showPass = !this.showPass; }

  get email()    { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading   = true;
    this.serverError = '';

    this.auth.login({
      email:    this.email.value,
      password: this.password.value,
      role:     this.selectedRole
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading   = false;
        this.serverError = err?.error?.message ?? 'Invalid credentials. Please try again.';
      }
    });
  }
}
