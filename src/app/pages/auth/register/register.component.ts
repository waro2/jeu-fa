import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    form: FormGroup;
    errorMessage: string | null = null;

    constructor(private fb: FormBuilder, private router: Router, private api: ApiService) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            passwordConfirm: ['', Validators.required]
        });
    }

    onSubmit() {
        this.errorMessage = null;
        if (this.form.valid) {
            const password = this.form.value.password;
            const confirm = this.form.value.passwordConfirm;
            if (!this.validatePassword(password)) {
                return;
            }
            if (password !== confirm) {
                this.errorMessage = 'Les mots de passe ne correspondent pas.';
                return;
            }
            this.register();
        }
    }

    validatePassword(password: string): boolean {
        if (password.length < 8) {
            this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            this.errorMessage = 'Le mot de passe doit contenir au moins une majuscule.';
            return false;
        }
        if (!/[a-z]/.test(password)) {
            this.errorMessage = 'Le mot de passe doit contenir au moins une minuscule.';
            return false;
        }
        if (!/[0-9]/.test(password)) {
            this.errorMessage = 'Le mot de passe doit contenir au moins un chiffre.';
            return false;
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            this.errorMessage = 'Le mot de passe doit contenir au moins un caractère spécial.';
            return false;
        }
        return true;
    }

    register() {
        // API call to register the user can be added here
        console.log('User registered:', this.form.value);
        const payload = {
            username: this.form.value.username,
            email: this.form.value.email,
            password: this.form.value.password,
            confirm_password: this.form.value.passwordConfirm // changed to snake_case
        };

        this.api.register(payload).subscribe({
            next: (response) => {
                console.log('Registration successful:', response);
                this.router.navigate(['/login']);
            },
            error: (error) => {
                // Try to extract a user-friendly message from backend error
                let msg = 'Erreur lors de l\'inscription. Veuillez vérifier vos informations.';
                if (error?.error?.detail && Array.isArray(error.error.detail) && error.error.detail.length > 0) {
                    try {
                        // Try to parse the stringified error object
                        const detailObj = typeof error.error.detail[0] === 'string' ? JSON.parse(error.error.detail[0].replace(/'/g, '"')) : error.error.detail[0];
                        if (detailObj && detailObj.msg) {
                            msg = detailObj.msg;
                        }
                    } catch (e) {
                        // fallback: show the raw string if parsing fails
                        msg = error.error.detail[0];
                    }
                }
                this.errorMessage = msg;
                console.error('Registration failed:', error);
            }
        });

    }
}
