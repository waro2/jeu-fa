import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    form: FormGroup;
    errorMessage: string | null = null;
    isLoading = false;
    showPassword = false;
    showPasswordConfirm = false;

    constructor(private readonly fb: FormBuilder, private readonly router: Router, private readonly api: ApiService) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            passwordConfirm: ['', Validators.required]
        });
    }

    onSubmit() {
        this.errorMessage = null;
        this.isLoading = true; // Set loading state to true
        if (this.form.valid) {
            const password = this.form.value.password;
            const confirm = this.form.value.passwordConfirm;
            if (!this.validatePassword(password)) {
                this.isLoading = false; // Reset loading state on error
                return;
            }
            if (password !== confirm) {
                this.errorMessage = 'Les mots de passe ne correspondent pas.';
                this.isLoading = false; // Reset loading state on error
                return;
            }
            this.register();
        } else {
            this.isLoading = false; // Reset loading state if form is invalid
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
        if (!/\d/.test(password)) {
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
                this.isLoading = false;
                this.router.navigate(['/login']);
            },
            error: (error) => {
                this.isLoading = false;
                // Try to extract a user-friendly message from backend error
                let msg = 'Erreur lors de l\'inscription. Veuillez vérifier vos informations.';
                if (error?.error?.detail && Array.isArray(error.error.detail) && error.error.detail.length > 0) {
                    try {
                        // Try to parse the stringified error object
                        const detailObj = typeof error.error.detail[0] === 'string' ? JSON.parse(error.error.detail[0].replace(/'/g, '"')) : error.error.detail[0];
                        if (detailObj?.msg) {
                            msg = detailObj.msg;
                        }
                    } catch (e: unknown) {
                        // fallback: show the raw string if parsing fails
                        msg = error.error.detail[0];
                        console.error('Error parsing error message:', e);
                    }
                }
                this.errorMessage = msg;
                console.error('Registration failed:', error);
            },
            complete: () => {
                this.isLoading = false; // Reset loading state on completion
            }
        });

    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    togglePasswordConfirmVisibility() {
        this.showPasswordConfirm = !this.showPasswordConfirm;
    }

    // Getters for form field states
    get usernameInvalid(): boolean {
        const control = this.form.get('username');
        return !!control && control.invalid && control.touched;
    }

    get emailInvalid(): boolean {
        const control = this.form.get('email');
        return !!control && control.invalid && control.touched;
    }

    get passwordInvalid(): boolean {
        const control = this.form.get('password');
        return !!control && control.invalid && control.touched;
    }

    get passwordConfirmInvalid(): boolean {
        const control = this.form.get('passwordConfirm');
        return !!control && control.invalid && control.touched;
    }

    get passwordsNotMatching(): boolean {
        const password = this.form.get('password')?.value;
        const passwordConfirm = this.form.get('passwordConfirm')?.value;
        const isTouched = !!this.form.get('passwordConfirm')?.touched;
        return password !== passwordConfirm && isTouched;
    }

    get isFormDisabled(): boolean {
        return this.form.invalid || this.isLoading;
    }
}
