import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private http   = inject(HttpClient);

  registerForm!: FormGroup;
  roles        = ['Recruiter', 'HR Manager', 'Admin'];
  selectedRole = 'Recruiter';
  showPass     = false;
  showConfirm  = false;
  isLoading    = false;
  serverError  = '';

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agree:           [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: AbstractControl) {
    const pass    = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  selectRole(role: string)  { this.selectedRole = role; }
  togglePass()              { this.showPass    = !this.showPass; }
  toggleConfirm()           { this.showConfirm = !this.showConfirm; }

  get fullName()        { return this.registerForm.get('fullName')!; }
  get email()           { return this.registerForm.get('email')!; }
  get password()        { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }
  get agree()           { return this.registerForm.get('agree')!; }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading   = true;
    this.serverError = '';

    this.http.post(`${environment.apiUrl}/auth/register`, {
      fullName: this.fullName.value,
      email:    this.email.value,
      password: this.password.value,
      role:     this.selectedRole
    }).subscribe({
      next: (res: any) => {
        localStorage.setItem('resume_token', res.token);
        localStorage.setItem('resume_user', JSON.stringify(res.user));
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading   = false;
        this.serverError = err?.error?.message ?? 'Registration failed. Please try again.';
      }
    });
  }
}