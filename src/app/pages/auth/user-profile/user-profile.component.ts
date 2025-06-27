import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="profile-container">
      <h2>Profil utilisateur</h2>
      <p>Bienvenue !</p>
      <button (click)="logout()">Se déconnecter</button>
    </div>
  `,
    styles: [`.profile-container { padding: 2em; text-align: center; }`]
})
export class UserProfileComponent {
    constructor(private auth: AuthService, private router: Router) { }

    logout() {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
