import { Component, OnDestroy } from '@angular/core';
import { WebsocketService, WebSocketStatus } from './services/websocket.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from './pages/shared/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './pages/shared/header/header.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, FormsModule, FooterComponent, RouterOutlet, HeaderComponent],
  providers: [WebsocketService],
  standalone: true
})
export class AppComponent implements OnDestroy {
  wsType: 'player' | 'game' | 'matchmaking' | 'test' = 'test';
  playerId: number = 1;
  gameId: number = 1;
  testMsg: string = '';
  status: WebSocketStatus = 'CLOSED';
  messages: string[] = [];

  private statusSub?: Subscription;
  private msgSub?: Subscription;

  constructor(private ws: WebsocketService) {
    this.statusSub = this.ws.status$.subscribe(status => this.status = status);
    this.msgSub = this.ws.messages$.subscribe(msg => this.messages.push(typeof msg === 'string' ? msg : JSON.stringify(msg)));
  }

  connect() {
    this.messages = [];
    console.log('connect', this.wsType);
    if (this.wsType === 'player') {
      this.ws.connectPlayer(this.playerId.toString());
    } else if (this.wsType === 'game') {
      this.ws.connectGame(this.gameId.toString(), this.playerId.toString());
    } else if (this.wsType === 'matchmaking') {
      this.ws.connectMatchmaking();
    } else {
      this.ws.connectTest();
    }
  }

  disconnect() {
    this.ws.close();
  }

  sendTestMsg() {
    if (this.status === 'OPEN') {
      if (this.wsType === 'test') {
        this.ws.send(this.testMsg || 'Hello from Angular!');
      } else {
        this.ws.sendMessage('test', this.testMsg || 'Hello from Angular!');
      }
    }
  }

  ngOnDestroy() {
    this.statusSub?.unsubscribe();
    this.msgSub?.unsubscribe();
    this.ws.close();
  }
}
