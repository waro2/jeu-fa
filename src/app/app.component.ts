import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './pages/shared/footer/footer.component';
import { HeaderComponent } from './pages/shared/header/header.component';
import { WebsocketService } from './services/websocket.service';
import { CommonModule } from '@angular/common';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, HeaderComponent, CommonModule, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'jeu-fa';
  status: string = '';
  messages: any[] = [];
  private wsStatus: string = '';

  constructor(private ws: WebsocketService) { }

  ngOnInit() {
    console.log('AppComponent: Initializing WebSocket connection...');
    // Connect to player WebSocket (replace '1' with actual playerId as needed)
    this.ws.connectPlayer('1');

    this.ws.status$.subscribe(status => {
      console.log('WebSocket status:', status);
      this.status = status;
      this.wsStatus = status;
      // Send test message only when connection is open
      if (status === 'OPEN') {
        this.ws.sendMessage('ping', { content: 'Hello server!' });
      }
    });
    
    this.ws.messages$.subscribe(msg => {
      console.log('AppComponent: Received WebSocket message:', msg);
      this.messages.push(msg);
    });
  }

  sendTest() {
    if (this.wsStatus === 'OPEN') {
      this.ws.sendMessage('ping', { content: 'Hello server!' });
    } else {
      console.warn('WebSocket not open, cannot send message');
    }
  }

  ngOnDestroy() {
    this.ws.close();
  }
}
