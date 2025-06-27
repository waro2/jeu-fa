import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    isLoggedIn = false;
    user = { name: '', avatar: '' };
    constructor(public router: Router) { }

    ngOnInit() {
        // Simuler la détection d'un utilisateur connecté (à remplacer par une vraie logique auth)
        const userData = localStorage.getItem('user');
        if (userData) {
            this.isLoggedIn = true;
            this.user = JSON.parse(userData);
        }
    }

    logout() {
        localStorage.removeItem('user');
        window.location.reload();
    }
}
