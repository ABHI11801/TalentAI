import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 40px; font-family: 'DM Sans', sans-serif; color: #e8edf2; background: #080c10; min-height: 100vh;">
      <h1 style="font-family: 'Syne', sans-serif; color: #00e5a0;">Dashboard</h1>
      <p style="margin-top: 12px; color: #5a6a7a;">Welcome, {{ user?.fullName }}</p>
      <p style="color: #5a6a7a;">Role: {{ user?.role }}</p>
      <button
        (click)="logout()"
        style="margin-top: 24px; padding: 10px 20px; background: #ff4d6d; color: white; border: none; border-radius: 8px; cursor: pointer;">
        Logout
      </button>
    </div>
  `
})
export class DashboardComponent {
  user: any;

  constructor(private auth: AuthService) {
    this.user = this.auth.getCurrentUser();
  }

  logout() {
    this.auth.logout();
  }
}
