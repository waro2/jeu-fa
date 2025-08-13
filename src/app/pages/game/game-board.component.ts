import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FaduCardComponent, FaduCard } from './components/fadu-card/fadu-card.component';
import { StrateggySelectorComponent } from './components/strateggy-selector/strateggy-selector.component';
import { WebsocketService, WebSocketStatus } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { GameService } from './services/game.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-game-board',
    standalone: true,
    imports: [CommonModule, FaduCardComponent, StrateggySelectorComponent],
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit, OnDestroy {
    isProcessing: boolean = false;
    deck: FaduCard[] = [
        { name: 'di_gbe', image: '/assets/cards/di_gbe.jpg' },
        { name: 'di_woli', image: '/assets/cards/di_woli.jpg' },
        { name: 'di_yeku', image: '/assets/cards/di_yeku.jpg' },
        { name: 'gbe_abla', image: '/assets/cards/gbe_abla.jpg' },
        { name: 'gbe_aklan', image: '/assets/cards/gbe_aklan.jpg' },
        { name: 'gbe_di', image: '/assets/cards/gbe_di.jpg' },
        { name: 'gbe_fu', image: '/assets/cards/gbe_fu.jpg' },
        { name: 'gbe_guda', image: '/assets/cards/gbe_guda.jpg' },
        { name: 'gbe_ka', image: '/assets/cards/gbe_ka.jpg' },
        { name: 'gbe_lete', image: '/assets/cards/gbe_lete.jpg' },
        { name: 'gbe_loso', image: '/assets/cards/gbe_loso.jpg' },
        { name: 'gbe_sa', image: '/assets/cards/gbe_sa.jpg' },
        { name: 'gbe_tche', image: '/assets/cards/gbe_tche.jpg' },
        { name: 'gbe_trukpin', image: '/assets/cards/gbe_trukpin.jpg' },
        { name: 'gbe_tula', image: '/assets/cards/gbe_tula.jpg' },
        { name: 'gbe_wlin', image: '/assets/cards/gbe_wlin.jpg' },
        { name: 'gbe_woli', image: '/assets/cards/gbe_woli.jpg' },
        { name: 'gbe_yeku', image: '/assets/cards/gbe_yeku.jpg' },
        { name: 'woli_abla', image: '/assets/cards/woli_abla.jpg' },
        { name: 'woli_aklan', image: '/assets/cards/woli_aklan.jpg' },
        { name: 'woli_di', image: '/assets/cards/woli_di.jpg' },
        { name: 'woli_fu', image: '/assets/cards/woli_fu.jpg' },
        { name: 'woli_gbe', image: '/assets/cards/woli_gbe.jpg' },
        { name: 'woli_guda', image: '/assets/cards/woli_guda.jpg' },
        { name: 'woli_ka', image: '/assets/cards/woli_ka.jpg' },
        { name: 'woli_lete', image: '/assets/cards/woli_lete.jpg' },
        { name: 'woli_loso', image: '/assets/cards/woli_loso.jpg' },
        { name: 'woli_medji', image: '/assets/cards/woli_medji.jpg' },
        { name: 'woli_sa', image: '/assets/cards/woli_sa.jpg' },
        { name: 'woli_tche', image: '/assets/cards/woli_tche.jpg' },
        { name: 'woli_trukpin', image: '/assets/cards/woli_trukpin.jpg' },
        { name: 'woli_tula', image: '/assets/cards/woli_tula.jpg' },
        { name: 'woli_wlin', image: '/assets/cards/woli_wlin.jpg' },
        { name: 'woli_yeku', image: '/assets/cards/woli_yeku.jpg' },
        { name: 'yeku_aklan', image: '/assets/cards/yeku_aklan.jpg' },
        { name: 'yeku_di', image: '/assets/cards/yeku_di.jpg' },
        { name: 'yeku_fu', image: '/assets/cards/yeku_fu.jpg' },
        { name: 'yeku_gbe', image: '/assets/cards/yeku_gbe.jpg' },
        { name: 'yeku_guda', image: '/assets/cards/yeku_guda.jpg' },
        { name: 'yeku_ka', image: '/assets/cards/yeku_ka.jpg' },
        { name: 'yeku_lete', image: '/assets/cards/yeku_lete.jpg' },
        { name: 'yeku_loso', image: '/assets/cards/yeku_loso.jpg' },
        { name: 'yeku_medji', image: '/assets/cards/yeku_medji.jpg' },
        { name: 'yeku_sa', image: '/assets/cards/yeku_sa.jpg' },
        { name: 'yeku_tche', image: '/assets/cards/yeku_tche.jpg' },
        { name: 'yeku_trukpin', image: '/assets/cards/yeku_trukpin.jpg' },
        { name: 'yeku_tula', image: '/assets/cards/yeku_tula.jpg' },
        { name: 'yeku_wlin', image: '/assets/cards/yeku_wlin.jpg' },
        { name: 'yeku_woli', image: '/assets/cards/yeku_woli.jpg' }
    ];

    drawnCard: FaduCard | null = null;

    // Ajout de l'état pour chaque joueur
    playerStates = {
        player1: {
            card: null as FaduCard | null,
            strategy: null as string | null,
            sacrifice: false,
            sacrificeCard: null as FaduCard | null,
            pfh: 100
        },
        player2: {
            card: null as FaduCard | null,
            strategy: null as string | null,
            sacrifice: false,
            sacrificeCard: null as FaduCard | null,
            pfh: 100
        }
    };
    currentPlayer: 'player1' | 'player2' = 'player1';
    phase: 'draw' | 'strategy' | 'sacrifice' | 'reveal' | 'results' = 'draw';
    turn: number = 1;
    maxTurns: number = 20;
    winner: string | null = null;
    gameHistory: any[] = [];

    strategies = [
        { value: 'V', label: 'Soumission', description: 'Défendre, minimiser les pertes.' },
        { value: 'C', label: 'Coopération', description: 'Partager les gains.' },
        { value: 'G', label: 'Guerre', description: 'Tenter de tout gagner.' }
    ];
    cardState: 'front' | 'back' = 'front';
    strateggySelectorVisible = { player1: false, player2: false };

    // Ajout d'un état pour savoir si le joueur courant peut tirer une carte
    canDraw: boolean = false;

    wsStatus: WebSocketStatus = 'CLOSED';
    wsMessages: any[] = [];
    private wsStatusSub?: Subscription;
    private wsMsgSub?: Subscription;
    gameId: number = 1;
    playerId: number = 1;
    opponentId: number = 2;

    player1: any = null;
    player2: any = null;
    gameDetails: any = null;
    token: string = '';

    player1DisplayName = 'Loading...';
    player2DisplayName = 'Loading...';
    player1DisplayId = '';
    player2DisplayId = '';
    player1DisplayPfh = '100';
    player2DisplayPfh = '100';

    constructor(
        private readonly ws: WebsocketService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly gameService: GameService,
        private readonly http: HttpClient
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.gameId = Number(params.get('gameId'));
        });
        this.route.queryParamMap.subscribe(params => {
            this.playerId = Number(params.get('player_id'));
            this.opponentId = Number(params.get('opponent_id'));
        });
        this.token = localStorage.getItem('auth_token') || '';
        this.playerId = Number(localStorage.getItem('user_id')) || this.playerId;
        this.fetchGameDetails();
        this.fetchPlayers();

        // Connect to the game WebSocket endpoint
        this.ws.connectGame(this.gameId.toString(), this.playerId.toString());
        this.wsStatusSub = this.ws.status$.subscribe((status: WebSocketStatus) => {
            this.wsStatus = status;
            if (status === 'OPEN') {
                // Optionally, request initial game state or send a ping
                this.ws.sendMessage('ping', { content: 'Hello from GameBoard!' });
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

    fetchGameDetails() {
        if (!this.gameId || !this.token) {
            return;
        }
        this.gameService.fetchGameDetails(this.gameId, this.token).subscribe({
            next: (data) => {
                this.gameDetails = data;
                // Determine which player is the logged-in user
                const p1 = data.data.player1;
                const p2 = data.data.player2;
                
                if (String(p1.id) === String(this.playerId)) {
                    this.player1DisplayName = p1.username || 'Player 1';
                    this.player1DisplayId = String(p1.id);
                    this.player1DisplayPfh = String(p1.current_pfh);
                    this.player2DisplayName = p2.username || 'Player 2';
                    this.player2DisplayId = String(p2.id);
                    this.player2DisplayPfh = String(p2.current_pfh);
                } else {
                    this.player1DisplayName = p2.username || 'Player 2';
                    this.player1DisplayId = String(p2.id);
                    this.player1DisplayPfh = String(p2.current_pfh);
                    this.player2DisplayName = p1.username || 'Player 1';
                    this.player2DisplayId = String(p1.id);
                    this.player2DisplayPfh = String(p1.current_pfh);
                }
                
            },
            error: (err) => {
                // Handle error silently or with user notification
            }
        });
    }

    fetchPlayers() {
        // Replace with actual API call to backend
        this.ws.sendMessage('get_players', {
            game_id: this.gameId,
            player_id: this.playerId,
            opponent_id: this.opponentId
        });
        this.wsMsgSub = this.ws.messages$.subscribe((msg: any) => {
            if (msg.type === 'players_info') {
                this.player1 = msg.data.player1;
                this.player2 = msg.data.player2;
            }
            this.handleWsMessage(msg);
        });
    }

    handleWsMessage(msg: any) {
        this.wsMessages.push(msg);
        // Handle game state updates, turn events, etc.
        if (msg.type === 'game_state_update') {
            // Update local game state
            // Example: this.updateGameState(msg.data);
        } else if (['turn_start', 'turn_result', 'game_end'].includes(msg.type)) {
            // Handle turn events and game end
        }
    }

    sendTurnAction(strategy: string, sacrifice: boolean = false) {
        if (this.wsStatus === 'OPEN') {
            this.ws.sendMessage('turn_action', { strategy, sacrifice });
        }
    }

    // Méthode appelée quand le joueur clique sur "À vous de jouer"
    onPlayClick() {
        if (this.phase === 'draw') {
            this.canDraw = true;
        }
    }

    drawCard() {
        if (this.deck.length > 0 && this.canDraw) {
            const idx = Math.floor(Math.random() * this.deck.length);
            const card = this.deck[idx];
            this.playerStates[this.currentPlayer].card = card;
            this.phase = 'strategy';
            this.canDraw = false;
        }
    }

    onSelectCard() {
        // Exemple : passer à la phase stratégie
        this.phase = 'strategy';
    }
    showStrateggySelector() {
        this.strateggySelectorVisible[this.currentPlayer] = true;
        // Correction : forcer le template à se mettre à jour
        // (utile si le bouton est dans une zone qui ne se met pas à jour)
    }
    hideStrateggySelector() {
        this.strateggySelectorVisible[this.currentPlayer] = false;
    }
    onStrategySelected(strat: string) {
        this.playerStates[this.currentPlayer].strategy = strat;
        this.hideStrateggySelector();
        this.phase = 'sacrifice'; // Ajout : passer à la phase de sacrifice après le choix de stratégie
    }
    onSacrificeDecision(decision: boolean) {
        if (this.playerStates[this.currentPlayer].strategy == null) {
            // Sécurité : ne rien faire si aucune stratégie n'est choisie
            return;
        }
        if (decision && this.playerStates[this.currentPlayer].pfh >= 14) {
            this.playerStates[this.currentPlayer].pfh -= 14;
            const idx = Math.floor(Math.random() * this.deck.length);
            const sacrificeCard = this.deck[idx];
            this.playerStates[this.currentPlayer].sacrifice = true;
            this.playerStates[this.currentPlayer].sacrificeCard = sacrificeCard;
        } else {
            this.playerStates[this.currentPlayer].sacrifice = false;
            this.playerStates[this.currentPlayer].sacrificeCard = null;
        }
        this.phase = this.currentPlayer === 'player1' ? 'draw' : 'reveal';
        if (this.currentPlayer === 'player1') {
            this.currentPlayer = 'player2';
        } else {
            setTimeout(() => this.revealAndComputeGains(), 1000);
        }
    }

    revealAndComputeGains() {
        // Révélation des cartes et stratégies
        this.phase = 'reveal';
        // Calcul des gains avec la matrice (exemple simplifié)
        const X = this.playerStates.player1.sacrifice && this.playerStates.player1.sacrificeCard
            ? this.playerStates.player1.sacrificeCard.pfh
            : (this.playerStates.player1.card?.pfh || 0);
        const Y = this.playerStates.player2.sacrifice && this.playerStates.player2.sacrificeCard
            ? this.playerStates.player2.sacrificeCard.pfh
            : (this.playerStates.player2.card?.pfh || 0);
        const strat1 = this.playerStates.player1.strategy as 'V' | 'C' | 'G';
        const strat2 = this.playerStates.player2.strategy as 'V' | 'C' | 'G';
        // Utiliser le GameService pour le calcul réel si besoin
        // const [gain1, gain2] = this.gameService.computeGains(strat1, strat2, X, Y);
        // Pour l'instant, exemple simple :
        const gain1 = X;
        const gain2 = Y;
        this.playerStates.player1.pfh += gain1 ?? 0;
        this.playerStates.player2.pfh += gain2 ?? 0;
        // Historique
        this.gameHistory.push({
            turn: this.turn,
            player1: { ...this.playerStates.player1, gain: gain1 },
            player2: { ...this.playerStates.player2, gain: gain2 }
        });
        // Préparer le prochain tour
        setTimeout(() => this.nextTurn(), 2000);
    }

    nextTurn() {
        this.turn++;
        if (this.turn > this.maxTurns || this.playerStates.player1.pfh >= 280 || this.playerStates.player2.pfh >= 280) {
            this.phase = 'results';
            this.winner = this.playerStates.player1.pfh > this.playerStates.player2.pfh ? 'player1' : 'player2';
            return;
        }
        // Reset pour le prochain tour
        this.playerStates.player1.card = null;
        this.playerStates.player1.strategy = null;
        this.playerStates.player1.sacrifice = false;
        this.playerStates.player1.sacrificeCard = null;
        this.playerStates.player2.card = null;
        this.playerStates.player2.strategy = null;
        this.playerStates.player2.sacrifice = false;
        this.playerStates.player2.sacrificeCard = null;
        this.currentPlayer = 'player1';
        this.phase = 'draw';
        this.strateggySelectorVisible = { player1: false, player2: false };
    }

    quitGame() {
        // Close WebSocket connection
        this.ws.close();
        
        // Navigate back to home page
        this.router.navigate(['/']);
    }
}
