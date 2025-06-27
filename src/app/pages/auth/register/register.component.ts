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

    constructor(private fb: FormBuilder, private router: Router, private api: ApiService) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            passwordConfirm: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.form.valid) {
            console.log(this.form.value);
            this.register();
        }
    }

    register() {
        // API call to register the user can be added here
        console.log('User registered:', this.form.value);
        const payload = {
            username: this.form.value.username,
            email: this.form.value.email,
            password: this.form.value.password,
            confirmPassword: this.form.value.passwordConfirm
        };

        this.api.register(payload).subscribe({
            next: (response) => {
                console.log('Registration successful:', response);
                this.router.navigate(['/login']);
            },
            error: (error) => {
                console.error('Registration failed:', error);
            }
        });

    }
}
