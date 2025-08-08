import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../services/websocket.service';
import { UtilsService } from '../../services/utils.service';
import { AuthService } from '../../services/auth.service';

export interface Player {
  id?: string;
  pseudo: string;
  avatar?: string;
  status?: string;
  rating?: number;
}

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent {
  @Input() players: Player[] = [];
  @Input() usingDemoData = false;
  @Input() title = ''

  get isMoreThanOneUser() {
    return this.players.length > 1;
  }

  private readonly utils = inject(UtilsService);
  public readonly authService = inject(AuthService)
  private readonly ws: WebsocketService = inject(WebsocketService);

  /**
   * Handle image loading errors
   */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/boconon-okpele.png';
  }

  ngOnInit() {
    this.ws.messageSubject.subscribe((response) => {
       const is_online_players_response = response?.data?.type === 'online_players_response'

      if (is_online_players_response) {
        const userId = this.authService.getUserId() ?? '';
        this.players = this.utils.getUsersExceptMe(this.mapConnectedUsers(
          response?.data?.data?.connected_users
        ), userId);
      }
    });
  }

  mapConnectedUsers(connectedUsers: any[]) {
    return connectedUsers.map((player: any) => ({
      id: player.player_id,
      pseudo: player.name || player.pseudo || '',
      avatar: player.avatar || 'assets/images/boconon-okpele.png',
      status: player.status || '',
    }));
  }

  sendInvitation(){

  }
}
