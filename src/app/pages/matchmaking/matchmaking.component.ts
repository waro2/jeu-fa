import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebsocketService, WebSocketStatus } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { PlayerListComponent, Player } from './player-list.component';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, PlayerListComponent],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  // Live players data from WebSocket
  players: Player[] = [];
  

  // Indicate if we're using demo data
  usingDemoData = false;
  
  wsStatus: WebSocketStatus = 'CLOSED';
  wsMessages: any[] = [];
  showInviteModal = false;
  showMatchFoundPopup = false;
  inQueue = false;
  queueStartTime?: Date;
  
  private wsStatusSub?: Subscription;
  private wsMsgSub?: Subscription;
  private timerInterval?: any;
  private queueTimeoutInterval?: any;
  private lastPlayersRefresh?: number;

  constructor(private readonly router: Router, private readonly ws: WebsocketService, private readonly authService: AuthService) { }

  ngOnInit() {
    // Set demo data by default
    this.setDemoPlayers();
    
    // Connect to the matchmaking WebSocket endpoint
    const playerId = this.authService.getUserId();

    if (!playerId) {
      console.error('Cannot connect to matchmaking WebSocket: No player ID available. User must be logged in.');
      // You might want to redirect to login or show an error message
      return;
    }
    this.ws.connectMatchmaking(playerId);

    // Monitor WebSocket status and update UI accordingly
    this.wsStatusSub = this.ws.status$.subscribe((status: WebSocketStatus) => {
      this.wsStatus = status;
      
      console.log('WebSocket status:', status);
      if (status === 'OPEN') {
        // Matchmaking WebSocket is connected, ready for queue operations
        // Request the list of online players when connection is established
        this.requestOnlinePlayers();
      } else {
        // If connection is closed/failed, use demo data
        this.setDemoPlayers();
      }
    });
    
    // Listen for WebSocket messages
    this.wsMsgSub = this.ws.messages$.subscribe((msg: any) => {
      this.handleWsMessage(msg);
    });
    
    // Set up timer to update the wait time display
    this.timerInterval = setInterval(() => {
      if (this.inQueue) {
        // This will trigger change detection to update the timer display
        this.getWaitTimeString();
      }
      
      // Also periodically refresh the online players list (every 30 seconds)
      if (this.wsStatus === 'OPEN' && !this.usingDemoData) {
        const now = Date.now();
        if (!this.lastPlayersRefresh || (now - this.lastPlayersRefresh) > 30000) {
          this.requestOnlinePlayers();
          this.lastPlayersRefresh = now;
        }
      }
    }, 1000); // Update every second
  }

  ngOnDestroy() {
    this.wsStatusSub?.unsubscribe();
    this.wsMsgSub?.unsubscribe();
    
    // Clear the timer interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Clear the queue timeout
    if (this.queueTimeoutInterval) {
      clearTimeout(this.queueTimeoutInterval);
    }
    
    this.ws.close();
  }

  handleWsMessage(msg: any) {
    this.wsMessages.push(msg);
    
    // Handle various WebSocket message types
    switch (msg.type) {
      case 'matchmaking_status':
        this.handleMatchmakingStatus(msg);
        break;
        
      case 'match_found':
        this.handleMatchFound(msg);
        break;
        
      case 'online_players':
      case 'connected_players':
      case 'players_list':
        this.handleOnlinePlayers(msg);
        break;
        
      case 'player_joined':
      case 'player_connected':
        this.handlePlayerJoined(msg);
        break;
        
      case 'player_left':
      case 'player_disconnected':
        this.handlePlayerLeft(msg);
        break;
        
      case 'queue_update':
      case 'queue_status':
        this.handleQueueUpdate(msg);
        break;
        
      default:
        // Try to infer what the message might be based on its content
        if (msg.data?.players || (Array.isArray(msg.data) && msg.data.length > 0)) {
          this.handleOnlinePlayers({
            type: 'online_players',
            data: { players: Array.isArray(msg.data) ? msg.data : msg.data.players || [] }
          });
        }
    }
  }
  
  /**
   * Handle matchmaking status updates
   */
  private handleMatchmakingStatus(msg: any) {
    if (msg.data?.in_queue === true) {
      this.inQueue = true;
      this.queueStartTime ??= new Date(); // Using nullish coalescing assignment
    } else if (msg.data?.in_queue === false) {
      this.inQueue = false;
      this.queueStartTime = undefined;
    }
  }
  
  /**
   * Handle match found event
   */
  private handleMatchFound(msg: any) {
    // Clear the queue timeout since match was found
    if (this.queueTimeoutInterval) {
      clearTimeout(this.queueTimeoutInterval);
      this.queueTimeoutInterval = undefined;
    }
    
    this.inQueue = false;
    this.showMatchFoundPopup = true;
    setTimeout(() => {
      this.router.navigate(['/game-board'], { queryParams: { gameId: msg.data?.game_id } });
    }, 3000);
  }
  
  /**
   * Handle online players list update
   */
  private handleOnlinePlayers(msg: any) {
    // Different server implementations might format the response differently
    // Try different possible data structures
    let playersData = null;
    
    if (msg.data?.players && Array.isArray(msg.data.players)) {
      playersData = msg.data.players;
    } else if (Array.isArray(msg.data)) {
      playersData = msg.data;
    } else if (typeof msg.data === 'object' && msg.data !== null) {
      // It might be an object with player properties
      playersData = Object.values(msg.data);
    }
    
    if (playersData && Array.isArray(playersData)) {
      // Make sure each player has the required fields
      const validPlayers = playersData.filter(p => p?.pseudo || p?.username || p?.name)
        .map(p => ({
          id: p.id || p.user_id || `player-${Math.random().toString(36).substring(2, 11)}`,
          pseudo: p.pseudo || p.username || p.name,
          avatar: p.avatar || 'assets/images/boconon-okpele.png',
          status: p.status || p.state || 'Disponible',
          rating: p.rating || p.elo
        }));
      
      if (validPlayers.length > 0) {
        this.players = validPlayers;
        this.usingDemoData = false; // We're using live data now
        return;
      }
    }
    
    // If we couldn't find any valid players data and we don't have any current players
    if (!this.usingDemoData && this.players.length === 0) {
      this.setDemoPlayers();
    }
  }
  
  /**
   * Handle player joined event
   */
  private handlePlayerJoined(msg: any) {
    
    // Extract player data from various possible formats
    let newPlayer = null;
    
    if (msg.data?.player) {
      newPlayer = msg.data.player;
    } else if (typeof msg.data === 'object' && msg.data !== null) {
      // The player data might be directly in the data field
      newPlayer = msg.data;
    }
    
    if (newPlayer?.pseudo) {
      
      // Ensure the player has all required fields
      const validPlayer = {
        id: newPlayer.id || `player-${Math.random().toString(36).substring(2, 11)}`,
        pseudo: newPlayer.pseudo,
        avatar: newPlayer.avatar || 'assets/images/boconon-okpele.png',
        status: newPlayer.status || 'Disponible',
        rating: newPlayer.rating
      };
      
      // If we were using demo data, replace it entirely with this one real player
      if (this.usingDemoData) {
        this.players = [validPlayer];
        this.usingDemoData = false;
      } 
      // Otherwise add to the existing live players if not already there
      else if (!this.players.some(p => p.id === validPlayer.id)) {
        this.players = [...this.players, validPlayer];
      }
    }
  }
  
  /**
   * Handle player left event
   */
  private handlePlayerLeft(msg: any) {
    
    // Only process if we're not using demo data
    if (!this.usingDemoData) {
      // Extract player ID from various possible formats
      let leftPlayerId = null;
      
      if (msg.data?.player_id) {
        leftPlayerId = msg.data.player_id;
      } else if (msg.data?.id) {
        leftPlayerId = msg.data.id;
      } else if (typeof msg.data === 'string') {
        leftPlayerId = msg.data;
      }
      
      if (leftPlayerId) {
        this.players = this.players.filter(p => p.id !== leftPlayerId);
      }
    }
  }

  /**
   * Handle queue update messages (players joining/leaving queue)
   */
  private handleQueueUpdate(msg: any) {
    // This could contain information about players in queue
    // Update the UI accordingly
    if (msg.data?.players_in_queue) {
      // If the server sends info about who's in queue, we can show that
    }
    
    if (msg.data?.queue_size) {
      // Update queue size display if needed
    }
  }

  joinQueue() {
    if (this.wsStatus === 'OPEN') {
      const playerId = this.authService.getUserId();
      
      if (!playerId) {
        console.error('Cannot join queue: No player ID available. User must be logged in.');
        // You might want to redirect to login or show an error message
        return;
      }
      
      this.inQueue = true;
      this.queueStartTime = new Date();
      this.ws.sendMessage('join_queue', { player_id: playerId });
      
      // Set up 1-minute timeout to automatically leave queue
      this.queueTimeoutInterval = setTimeout(() => {
        if (this.inQueue) {
          this.leaveQueue();
          // You can add a notification here to inform the user
        }
      }, 60 * 1000); // 60 seconds = 1 minute
    }
  }

  leaveQueue() {
    if (this.wsStatus === 'OPEN') {
      const playerId = this.authService.getUserId();
      
      this.inQueue = false;
      this.queueStartTime = undefined;
      
      if (playerId) {
        this.ws.sendMessage('leave_queue', { player_id: playerId });
      }
    }
    
    // Clear the timeout when manually leaving queue or when match is found
    if (this.queueTimeoutInterval) {
      clearTimeout(this.queueTimeoutInterval);
      this.queueTimeoutInterval = undefined;
    }
  }

  startGame() {
    this.router.navigate(['/game-board']);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/boconon-okpele.png';
  }
  
  /**
   * Manually reconnect to the WebSocket server
   */
  reconnectWebSocket() {
    this.ws.reconnect();
  }
  
  /**
   * Refresh the list of online players
   */
  refreshPlayersList() {
    if (this.wsStatus === 'OPEN') {
      // Request fresh online players data from the server
      this.requestOnlinePlayers();
    } else {
      // If not connected, try to reconnect and then request players
      this.ws.reconnect();
      this.setDemoPlayers();
    }
  }

  getWaitTimeString(): string {
    if (!this.queueStartTime) {
      return '0:00';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - this.queueStartTime.getTime();
    const diffMin = Math.floor(diffMs / 60000); // minutes
    const diffSec = Math.floor((diffMs % 60000) / 1000); // seconds
    
    return `${diffMin}:${diffSec < 10 ? '0' + diffSec : diffSec}`;
  }
  
  /**
   * Set demo player data
   */
  private setDemoPlayers() {
    this.players = [
      { id: '1', pseudo: 'FaviMaster', avatar: 'assets/images/avatar1.png', status: 'En recherche' },
      { id: '2', pseudo: 'YovoKing', avatar: 'assets/images/avatar2.png', status: 'Disponible' },
      { id: '3', pseudo: 'QueenFa', avatar: 'assets/images/avatar3.png', status: 'En jeu' },
      { id: '4', pseudo: 'StratPro', avatar: 'assets/images/avatar4.png', status: 'Disponible' }
    ];
    this.usingDemoData = true;
  }
  
  /**
   * Request the list of online players from the server
   */
  private requestOnlinePlayers() {
    if (this.wsStatus === 'OPEN') {
      // Send a message to get online players
      this.ws.sendMessage('get_online_players', {});
    }
  }
}
