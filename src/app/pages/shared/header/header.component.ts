import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
export class HeaderComponent implements OnInit, OnDestroy {
    showMobileMenu = false;
    showUserDropdown = false;
    isScrolled = false;

    constructor(public readonly router: Router, private readonly auth: AuthService) { }

    ngOnInit() {
        this.checkScrollPosition();
    }

    ngOnDestroy() {
        // Cleanup if needed
    }

    @HostListener('window:scroll', ['$event'])
    onWindowScroll() {
        this.checkScrollPosition();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown-container')) {
            this.showUserDropdown = false;
        }
    }

    private checkScrollPosition() {
        this.isScrolled = window.pageYOffset > 20;
    }

    get isLoggedIn(): boolean {
        return this.auth.isLoggedIn();
    }

    get user() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : { 
            name: 'Utilisateur', 
            avatar: '', 
            email: 'utilisateur@example.com',
            joinDate: new Date().toLocaleDateString('fr-FR'),
            gamesPlayed: 0,
            wins: 0
        };
    }

    toggleMobileMenu() {
        this.showMobileMenu = !this.showMobileMenu;
        // Close user dropdown when mobile menu opens
        if (this.showMobileMenu) {
            this.showUserDropdown = false;
        }
    }

    toggleUserDropdown() {
        this.showUserDropdown = !this.showUserDropdown;
        // Close mobile menu when user dropdown opens
        if (this.showUserDropdown) {
            this.showMobileMenu = false;
        }
    }

    closeMobileMenu() {
        this.showMobileMenu = false;
    }

    closeUserDropdown() {
        this.showUserDropdown = false;
    }

    logout() {
        this.auth.logout();
        this.closeMobileMenu();
        this.closeUserDropdown();
        window.location.reload();
    }

    avatarError(event: Event) {
        const target = event.target as HTMLImageElement;
        target.onerror = null;
        target.src = 'data:image/svg+xml;utf8,<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="%23f59e0b"/><circle cx="18" cy="14" r="6" fill="%23dc2626"/><ellipse cx="18" cy="27" rx="10" ry="5" fill="%23dc2626" fill-opacity="0.6"/></svg>';
    }
}
