import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './pages/shared/footer/footer.component';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './pages/shared/header/header.component';
import { WebsocketTesterComponent } from './components/websocket-tester/websocket-tester.component';
import { WebsocketService } from './services/websocket.service';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, FooterComponent, RouterOutlet, HeaderComponent, WebsocketTesterComponent],
  providers: [WebsocketService],
  standalone: true,
  host: {
    '[class.auth-page]': 'isAuthPage'
  }
})
export class AppComponent implements OnInit {
  isAuthPage = false;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    // Check current route initially
    this.checkIfAuthPage(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkIfAuthPage(event.url);
      });

    // Establish WebSocket connection for already authenticated users
    this.establishWebSocketForAuthenticatedUser();
  }

  /**
   * Check if a user is already authenticated and establish WebSocket connection
   */
  private establishWebSocketForAuthenticatedUser(): void {
    if (this.authService.isLoggedIn()) {
      const userInfo = this.authService.getUserInfo();
      
      if (userInfo?.id) {
        this.authService.reconnectWebSocket();
      }
    }
  }

  private checkIfAuthPage(url: string): void {
    // Check if current route is an auth page (login or register)
    this.isAuthPage = url.includes('/login') || url.includes('/register');
  }
}
