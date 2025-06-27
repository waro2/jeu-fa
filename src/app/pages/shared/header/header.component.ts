import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    constructor(public router: Router, private auth: AuthService) { }

    get isLoggedIn(): boolean {
        return this.auth.isLoggedIn();
    }

    get user() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : { name: '', avatar: '' };
    }

    logout() {
        this.auth.logout();
        window.location.reload();
    }

    avatarError(event: Event) {
        const target = event.target as HTMLImageElement;
        target.onerror = null;
        target.src = 'data:image/svg+xml;utf8,<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="%23b2f0ff"/><circle cx="18" cy="14" r="6" fill="%23185a9d"/><ellipse cx="18" cy="27" rx="10" ry="5" fill="%23185a9d" fill-opacity="0.2"/></svg>';
    }
}
