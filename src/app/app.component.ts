import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './pages/shared/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './pages/shared/header/header.component';
import { WebsocketTesterComponent } from './components/websocket-tester/websocket-tester.component';
import { WebsocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, FooterComponent, RouterOutlet, HeaderComponent, WebsocketTesterComponent],
  providers: [WebsocketService],
  standalone: true
})
export class AppComponent {
  // Clean component - WebSocket testing logic moved to WebsocketTesterComponent
}
