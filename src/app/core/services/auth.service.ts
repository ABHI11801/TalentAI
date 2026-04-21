import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'resume_token';
  private readonly USER_KEY  = 'resume_user';
  private readonly api       = environment.apiUrl;

  // ── Email / Password login ────────────────────────────────
  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }

  // ── Google Sign-In ────────────────────────────────────────
  // Angular gets the Google ID token via Google Identity Services,
  // then sends it to the backend which validates and issues our JWT
  googleLogin(idToken: string, role: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/google`, { idToken, role } as GoogleLoginRequest).pipe(
      tap(res => this.saveSession(res))
    );
  }

  // ── Session helpers ───────────────────────────────────────
  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check token expiry from payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): AuthResponse['user'] | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
