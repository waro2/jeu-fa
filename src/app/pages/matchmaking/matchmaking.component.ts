import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebsocketService, WebSocketStatus } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  players = [
    { pseudo: 'FaviMaster', avatar: 'assets/images/avatar1.png' },
    { pseudo: 'YovoKing', avatar: 'assets/images/avatar2.png' },
    { pseudo: 'QueenFa', avatar: 'assets/images/avatar3.png' },
    { pseudo: 'StratPro', avatar: 'assets/images/avatar4.png' }
  ];

  wsStatus: WebSocketStatus = 'CLOSED';
  wsMessages: any[] = [];
  private wsStatusSub?: Subscription;
  private wsMsgSub?: Subscription;

  constructor(private router: Router, private ws: WebsocketService) { }

  ngOnInit() {
    // Connect to the matchmaking WebSocket endpoint
    this.ws.connectMatchmaking();
    this.wsStatusSub = this.ws.status$.subscribe((status: WebSocketStatus) => {
      this.wsStatus = status;
      if (status === 'OPEN') {
        // Optionally, send a ping or join_queue message
        this.ws.sendMessage('ping', { content: 'Hello from Matchmaking!' });
      }
    });
    this.wsMsgSub = this.ws.messages$.subscribe((msg: any) => {
      this.handleWsMessage(msg);
    });
  }

  ngOnDestroy() {
    this.wsStatusSub?.unsubscribe();
    this.wsMsgSub?.unsubscribe();
    this.ws.close();
  }

  handleWsMessage(msg: any) {
    this.wsMessages.push(msg);
    // Handle matchmaking status, match found, etc.
    if (msg.type === 'matchmaking_status') {
      // Update local queue status
    } else if (msg.type === 'match_found') {
      // Handle match found (navigate to game, etc.)
      // Example: this.router.navigate(['/game-board'], { queryParams: { gameId: msg.data.game_id } });
    }
  }

  joinQueue() {
    if (this.wsStatus === 'OPEN') {
      this.ws.sendMessage('join_queue', {});
    }
  }

  leaveQueue() {
    if (this.wsStatus === 'OPEN') {
      this.ws.sendMessage('leave_queue', {});
    }
  }

  startGame() {
    this.router.navigate(['/game-board']);
  }
}
