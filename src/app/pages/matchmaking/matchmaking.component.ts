import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebsocketService, WebSocketStatus } from '../../services/websocket.service';
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

  constructor(private readonly router: Router, private readonly ws: WebsocketService) { }

  ngOnInit() {
    // Set demo data by default
    this.setDemoPlayers();
    
    // Connect to the matchmaking WebSocket endpoint
    this.ws.connectMatchmaking();
    
    // Monitor WebSocket status and update UI accordingly
    this.wsStatusSub = this.ws.status$.subscribe((status: WebSocketStatus) => {
      console.log('WebSocket status changed:', status);
      this.wsStatus = status;
      
      if (status === 'OPEN') {
        console.log('WebSocket connected, requesting online players');
        // Request the list of online players when connection is established
        setTimeout(() => {
          this.ws.sendMessage('get_online_players');
          console.log('Sent get_online_players request');
        }, 500); // Small delay to ensure connection is fully established
      } else {
        // If connection is closed/failed, use demo data
        console.log('WebSocket not connected, using demo data');
        this.setDemoPlayers();
      }
    });
    
    // Listen for WebSocket messages
    this.wsMsgSub = this.ws.messages$.subscribe((msg: any) => {
      console.log('Matchmaking received WebSocket message:', msg);
      this.handleWsMessage(msg);
    });
    
    // Set up timer to update the wait time display
    this.timerInterval = setInterval(() => {
      if (this.inQueue) {
        // This will trigger change detection to update the timer display
        this.getWaitTimeString();
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
    
    this.ws.close();
  }

  handleWsMessage(msg: any) {
    this.wsMessages.push(msg);
    console.log(`Handling message type: ${msg.type}`, msg);
    
    // Handle various WebSocket message types
    switch (msg.type) {
      case 'matchmaking_status':
        this.handleMatchmakingStatus(msg);
        break;
        
      case 'match_found':
        this.handleMatchFound(msg);
        break;
        
      case 'online_players':
        this.handleOnlinePlayers(msg);
        break;
        
      case 'player_joined':
        this.handlePlayerJoined(msg);
        break;
        
      case 'player_left':
        this.handlePlayerLeft(msg);
        break;
        
      case 'request_sent':
        // Handle confirmation that a request was sent
        if (msg.data?.message_type === 'get_online_players') {
          console.log('Request for online players was sent successfully');
        }
        break;
        
      default:
        console.log('Unhandled message type:', msg.type);
        // Try to infer what the message might be based on its content
        if (msg.data?.players || (Array.isArray(msg.data) && msg.data.length > 0)) {
          console.log('Message appears to contain player data, treating as online_players');
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
    console.log('Matchmaking status update:', msg);
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
    this.showMatchFoundPopup = true;
    setTimeout(() => {
      this.router.navigate(['/game-board'], { queryParams: { gameId: msg.data?.game_id } });
    }, 3000);
  }
  
  /**
   * Handle online players list update
   */
  private handleOnlinePlayers(msg: any) {
    console.log('Handling online_players message:', msg);
    
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
      console.log('Found players data:', playersData);
      
      // Make sure each player has the required fields
      const validPlayers = playersData.filter(p => p?.pseudo)
        .map(p => ({
          id: p.id || `player-${Math.random().toString(36).substring(2, 11)}`,
          pseudo: p.pseudo,
          avatar: p.avatar || 'assets/images/boconon-okpele.png',
          status: p.status || 'Disponible',
          rating: p.rating
        }));
      
      if (validPlayers.length > 0) {
        console.log('Updating with valid players:', validPlayers);
        this.players = validPlayers;
        this.usingDemoData = false; // We're using live data now
        return;
      }
    }
    
    // If we couldn't find any valid players data
    console.log('No valid players found in the response, keeping current players');
    if (!this.usingDemoData && this.players.length === 0) {
      // If we don't have any current players and we're not using demo data,
      // switch to an empty array (real empty state)
      this.players = [];
    }
  }
  
  /**
   * Handle player joined event
   */
  private handlePlayerJoined(msg: any) {
    console.log('Handling player_joined message:', msg);
    
    // Extract player data from various possible formats
    let newPlayer = null;
    
    if (msg.data?.player) {
      newPlayer = msg.data.player;
    } else if (typeof msg.data === 'object' && msg.data !== null) {
      // The player data might be directly in the data field
      newPlayer = msg.data;
    }
    
    if (newPlayer?.pseudo) {
      console.log('New player joined:', newPlayer);
      
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
        console.log('Switching from demo data to live data with new player');
        this.players = [validPlayer];
        this.usingDemoData = false;
      } 
      // Otherwise add to the existing live players if not already there
      else if (!this.players.some(p => p.id === validPlayer.id)) {
        console.log('Adding new player to existing list');
        this.players = [...this.players, validPlayer];
      }
    } else {
      console.log('Received invalid player_joined message without player data');
    }
  }
  
  /**
   * Handle player left event
   */
  private handlePlayerLeft(msg: any) {
    console.log('Handling player_left message:', msg);
    
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
        console.log('Player left with ID:', leftPlayerId);
        this.players = this.players.filter(p => p.id !== leftPlayerId);
      } else {
        console.log('Received invalid player_left message without player ID');
      }
    }
  }

  joinQueue() {
    if (this.wsStatus === 'OPEN') {
      this.inQueue = true;
      this.queueStartTime = new Date();
      this.ws.sendMessage('join_queue', {});
    }
  }

  leaveQueue() {
    if (this.wsStatus === 'OPEN') {
      this.inQueue = false;
      this.queueStartTime = undefined;
      this.ws.sendMessage('leave_queue', {});
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
      console.log('Manually refreshing player list');
      
      // Show a loading indicator or feedback to the user
      // For now, we'll just add a temporary "refreshing" player
      if (!this.usingDemoData) {
        const refreshingIndicator = {
          id: 'refreshing',
          pseudo: 'Actualisation en cours...',
          avatar: 'assets/images/boconon-okpele.png',
          status: 'Chargement'
        };
        
        // Only add the refreshing indicator if we're not showing demo data
        if (this.players.length === 0) {
          this.players = [refreshingIndicator];
        }
        
        // Send the message to request online players
        this.ws.sendMessage('get_online_players');
        
        // If we don't get a response within 5 seconds, revert to demo data
        setTimeout(() => {
          if (this.players.some(p => p.id === 'refreshing')) {
            console.log('No response received for get_online_players, using demo data');
            this.setDemoPlayers();
          }
        }, 5000);
      } else {
        // If we're showing demo data, just send the message without UI changes
        this.ws.sendMessage('get_online_players');
      }
    } else {
      console.log('Cannot refresh players - WebSocket not connected');
      // Reconnect and then try to get players
      this.ws.reconnect();
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
    console.log('Using demo player data');
    this.players = [
      { id: '1', pseudo: 'FaviMaster', avatar: 'assets/images/avatar1.png', status: 'En recherche' },
      { id: '2', pseudo: 'YovoKing', avatar: 'assets/images/avatar2.png', status: 'Disponible' },
      { id: '3', pseudo: 'QueenFa', avatar: 'assets/images/avatar3.png', status: 'En jeu' },
      { id: '4', pseudo: 'StratPro', avatar: 'assets/images/avatar4.png', status: 'Disponible' }
    ];
    this.usingDemoData = true;
  }
}
