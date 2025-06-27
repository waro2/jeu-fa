import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    form: FormGroup;

    constructor(private fb: FormBuilder, private router: Router) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            passwordConfirm: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.form.valid) {
            // Traitement de l'inscription ou affichage des valeurs
            console.log(this.form.value);
            // Redirection vers la page de login
            this.router.navigate(['/login']);
        }
    }
}
