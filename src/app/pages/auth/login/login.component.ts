import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    form: FormGroup;
    errorMessage: string | null = null;
    showPassword = false;
    isLoading = false;

    constructor(
        private readonly fb: FormBuilder, 
        private readonly router: Router, 
        private readonly api: ApiService,
        private readonly authService: AuthService
    ) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    get emailValid(): boolean {
        const emailControl = this.form.get('email');
        return emailControl ? emailControl.valid : false;
    }

    get emailInvalid(): boolean {
        const emailControl = this.form.get('email');
        return emailControl ? emailControl.invalid && emailControl.touched : false;
    }

    get passwordInvalid(): boolean {
        const passwordControl = this.form.get('password');
        return passwordControl ? passwordControl.invalid && passwordControl.touched : false;
    }

    get isFormDisabled(): boolean {
        return this.form.invalid || this.isLoading;
    }

    /**
     * 
     * {username: 'alfawaro86', email: 'alfawaro86@gmail.com', password: 'F@fffff1', passwordConfirm: 'F@fffff1'}
     */

    onSubmit() {
        this.errorMessage = null;
        if (this.form.valid) {
            this.isLoading = true;
            const { email, password } = this.form.value;
            this.api.login(email, password).subscribe({
                next: (response: any) => {
                    console.log('Login successful:', response);
                    
                    // Create user info object
                    const userInfo = {
                        id: response.user_id,
                        email: email,
                        pseudo: response.username || email.split('@')[0]
                    };
                    
                    // Use AuthService to handle login and WebSocket connection
                    this.authService.login(response.access_token, userInfo);
                    console.log('User info set in AuthService:', response, userInfo);
                    
                    // Store user_id separately for WebSocket connections
                    localStorage.setItem('user_id', response.user_id);
                    
                    // Also save additional user data for profile
                    localStorage.setItem('user', JSON.stringify({
                        name: response.username,
                        id: response.user_id,
                        email: email,
                        avatar: response.avatar || '',
                        joinDate: new Date().toLocaleDateString('fr-FR'),
                        gamesPlayed: response.gamesPlayed || 0,
                        wins: response.wins || 0
                    }));
                    
                    this.isLoading = false;
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    this.isLoading = false;
                    let msg = "Erreur lors de la connexion. Veuillez vérifier vos identifiants.";
                    if (error?.error?.detail) {
                        msg = error.error.detail;
                    }
                    this.errorMessage = msg;
                }
            });
        }
    }
}
