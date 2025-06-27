import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-footer',
    standalone: true,
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    imports: [RouterModule, CommonModule]
})
export class FooterComponent {
    gameVersion = '1.0.0';
    currentYear = new Date().getFullYear();

    usefulLinks = [
        { label: 'Accueil', path: '/' },
        { label: 'S’inscrire', path: '/register' },
        { label: 'Se connecter', path: '/login' },
        { label: 'Jouer', path: '/game-board' }
    ];

    socialLinks = [
        { icon: 'fa fa-facebook-f', url: 'https://facebook.com' },
        { icon: 'fa fa-twitter', url: 'https://twitter.com' },
        { icon: 'fa fa-discord', url: 'https://discord.com' },
        { icon: 'fa fa-youtube', url: 'https://youtube.com' }
    ];
}
