import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    form: FormGroup;
    errorMessage: string | null = null;

    constructor(private fb: FormBuilder, private router: Router, private api: ApiService) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit() {
        this.errorMessage = null;
        if (this.form.valid) {
            const { email, password } = this.form.value;
            this.api.login(email, password).subscribe({
                next: (response: any) => {
                    // Save token and user info in localStorage
                    localStorage.setItem('auth_token', response.access_token);
                    localStorage.setItem('user', JSON.stringify({
                        name: response.username,
                        id: response.user_id
                    }));
                    this.router.navigate(['/']);
                },
                error: (error) => {
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
