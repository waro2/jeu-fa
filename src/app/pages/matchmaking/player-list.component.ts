import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../services/websocket.service';
import { UtilsService } from '../../services/utils.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { DialogComponent } from '../../components/dialog/dialog.component';

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
  imports: [CommonModule, DialogComponent],
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
  private readonly router = inject(Router);

  showDialog = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogConfirmText = '';
  dialogCancelText = '';
  private dialogConfirmCallback: (() => void) | null = null;

  /**
   * Handle image loading errors
   */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/boconon-okpele.png';
  }

  openDialog(title: string, message: string, confirmText: string, cancelText: string, onConfirm: () => void) {
    this.dialogTitle = title;
    this.dialogMessage = message;
    this.dialogConfirmText = confirmText;
    this.dialogCancelText = cancelText;
    this.dialogConfirmCallback = onConfirm;
    this.showDialog = true;
  }

  onDialogConfirm() {
    if (this.dialogConfirmCallback) {
      this.dialogConfirmCallback();
    }
    this.showDialog = false;
  }

  onDialogCancel() {
    this.showDialog = false;
  }

  handleInvitationReceived(response: any) {
    const fromPlayerId = response?.data?.from_player_id;
    const gameId = response?.data?.game_id;

    this.openDialog(
      'Invitation Received',
      `Vous avez reçu une invitation du joueur ${fromPlayerId} pour la partie ${gameId}. Acceptez-vous ?`,
      'Accept',
      'Decline',
      () => {
        this.ws.send(JSON.stringify({
          type: 'accept_invitation',
          data: {
            from_player_id: fromPlayerId,
            game_id: gameId,
          },
        }));
      }
    );
  }

  handleMatchPossible(response: any) {
    const opponentId = response?.data?.opponent_id;
    const message = response?.data?.message;

    this.openDialog(
      'Match Possible',
      message,
      'Invite',
      'Cancel',
      () => {
        const player_id = this.authService.getUserId();
        if (player_id && opponentId) {
          this.ws.send(JSON.stringify({
            type: 'invite_player',
            data: {
              player_id,
              opponent_id: opponentId,
              game_id: undefined, // Optionally, generate or fetch a game_id here if needed
            },
          }));
        }
      }
    );
  }

  ngOnInit() {
    this.ws.messageSubject.subscribe((response) => {
      const type = response?.data?.type;

      console.log('WebSocket message received:', response);
      if (response?.type === 'matchmaking_status') {
        if (type === 'invitation_received') {
          this.handleInvitationReceived(response);
        } else if (type === 'match_possible') {
          this.handleMatchPossible(response);
        }
      }

      if (type === 'game_created') {
        const gameId = response?.data?.game_id;
        this.router.navigate([`/game/${gameId}`]);
      }

      if (type === 'online_players_response') {
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

  sendInvitation(opponent: Player) {
    const player_id = this.authService.getUserId();
    const opponent_id = opponent.id;
    const game_id = undefined; // Optionally, generate or fetch a game_id here if needed

    if (player_id && opponent_id) {
      this.ws.send(JSON.stringify({
        type: 'invite_player',
        data: {
          player_id,
          opponent_id,
          game_id,
        },
      }));
    }
  }
}
