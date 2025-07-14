import { Component, OnDestroy } from '@angular/core';
import { WebsocketService, WebSocketStatus } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-websocket-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './websocket-tester.component.html',
  styleUrls: ['./websocket-tester.component.scss']
})
export class WebsocketTesterComponent implements OnDestroy {
  wsType: 'player' | 'game' | 'matchmaking' | 'test' = 'test';
  playerId: number = 1;
  gameId: number = 1;
  testMsg: string = '';
  status: WebSocketStatus = 'CLOSED';
  messages: string[] = [];

  private readonly statusSub?: Subscription;
  private readonly msgSub?: Subscription;

  constructor(private readonly ws: WebsocketService) {
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
