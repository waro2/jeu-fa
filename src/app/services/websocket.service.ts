import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type WebSocketStatus = 'OPEN' | 'CLOSED' | 'ERROR' | 'CONNECTING';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
    private playerWs?: WebSocket;
    private matchmakingWs?: WebSocket;
    public readonly messageSubject = new Subject<any>();
    public readonly statusSubject = new Subject<WebSocketStatus>();
    private currentPlayerUrl: string = '';
    private currentMatchmakingUrl: string = '';

    online_users: any[] = [];


    connectPlayer(playerId: string, baseUrl?: string) {
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/player/${playerId}`;
        this.connectPlayerWebSocket(url);
    }

    connectGame(gameId: string, playerId: string, baseUrl?: string) {
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/game/${gameId}?player_id=${playerId}`;
        this.connectPlayerWebSocket(url);
    }

    connectMatchmaking(playerId: string, baseUrl?: string) {
        // Use environment-specific base URL or default to localhost
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/matchmaking?player_id=${playerId}`;
        this.connectMatchmakingWebSocket(url);
    }
    
    /**
     * Get the appropriate WebSocket base URL depending on environment
     */
    private getWebSocketBaseUrl(): string {
        // Get the current hostname to determine if we're in production
        const { protocol, hostname } = window.location;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'ws://localhost:8000';
        } else {
            // Use secure WebSocket in production
            const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
            return `${wsProtocol}//${hostname}`;
        }
    }

    private connectPlayerWebSocket(url: string) {
        this.currentPlayerUrl = url;
        this.statusSubject.next('CONNECTING');

        if (this.playerWs) {
            this.playerWs.close();
        }

        try {
            this.playerWs = new WebSocket(url);
            this.playerWs.onopen = () => {
                this.statusSubject.next('OPEN');
            };

            this.playerWs.onclose = (event: CloseEvent) => {
                this.statusSubject.next('CLOSED');
                // Auto-reconnect after 3 seconds if not manually closed
                if (event.code !== 1000) { // 1000 is normal closure
                    setTimeout(() => {
                        this.connectPlayerWebSocket(this.currentPlayerUrl);
                    }, 3000);
                }
            };

            this.playerWs.onerror = (error: Event) => {
                this.statusSubject.next('ERROR');
            };

            this.playerWs.onmessage = (event: MessageEvent) => {
                this.handleWebSocketMessage(event, 'player');
            };
        } catch (error) {
            this.statusSubject.next('ERROR');
        }
    }

    private connectMatchmakingWebSocket(url: string) {
        this.currentMatchmakingUrl = url;
        this.statusSubject.next('CONNECTING');

        if (this.matchmakingWs) {
            this.matchmakingWs.close();
        }

        try {
            this.matchmakingWs = new WebSocket(url);
            // Add a connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.matchmakingWs && this.matchmakingWs.readyState === WebSocket.CONNECTING) {
                    this.matchmakingWs.close();
                    this.statusSubject.next('ERROR');
                }
            }, 10000); // 10 second timeout
            
            this.matchmakingWs.onopen = () => {
                clearTimeout(connectionTimeout);
                this.statusSubject.next('OPEN');
            };

            this.matchmakingWs.onclose = (event: CloseEvent) => {
                clearTimeout(connectionTimeout);
                this.statusSubject.next('CLOSED');
                // Auto-reconnect after 3 seconds if not manually closed
                if (event.code !== 1000) { // 1000 is normal closure
                    setTimeout(() => {
                        this.connectMatchmakingWebSocket(this.currentMatchmakingUrl);
                    }, 3000);
                }
            };

            this.matchmakingWs.onerror = (error: Event) => {
                clearTimeout(connectionTimeout);
                this.statusSubject.next('ERROR');
            };

            this.matchmakingWs.onmessage = (event: MessageEvent) => {
                this.handleWebSocketMessage(event, 'matchmaking');
            };
        } catch (error) {
            this.statusSubject.next('ERROR');
        }
    }

    private handleWebSocketMessage(event: MessageEvent, source: 'player' | 'matchmaking') {
        try {
            let parsedData;
            // Try to parse as JSON
            try {
                parsedData = JSON.parse(event.data);
            } catch (parseError) {
                // If not JSON, try to normalize the data
                if (typeof event.data === 'string') {
                    // Try to create a simple object with the string as a message property
                    parsedData = { 
                        type: 'text_message',
                        data: event.data,
                        timestamp: new Date().toISOString(),
                        source
                    };
                } else {
                    parsedData = event.data;
                }
            }
            // Add source information
            if (parsedData && typeof parsedData === 'object') {
                parsedData.source = source;
            }
            // Normalize the data structure if needed
            if (parsedData && !parsedData.type) {
                // Try to infer the message type
                if (parsedData.players || (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].pseudo)) {
                    parsedData = {
                        type: 'online_players',
                        data: { players: Array.isArray(parsedData) ? parsedData : parsedData.players || [] },
                        timestamp: new Date().toISOString(),
                        source
                    };
                } else if (parsedData.player || (parsedData.id && parsedData.pseudo)) {
                    parsedData = {
                        type: 'player_joined',
                        data: { player: parsedData.player || parsedData },
                        timestamp: new Date().toISOString(),
                        source
                    };
                }
            }
            this.messageSubject.next(parsedData);
            if (parsedData.type === "online_players_response") {
                this.online_users = parsedData.data.players;
            }
        } catch (error) {
            // Still emit the raw data so we don't lose any messages
            this.messageSubject.next(event.data);
        }
    }

    connectTest(baseUrl?: string) {
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/test`;
        this.connectPlayerWebSocket(url);
    }

    sendMessage(type: string, data: any = {}) {
        // Get auth token from local storage if available
        const token = localStorage.getItem('auth_token');
        const message = {
            type,
            data,
            timestamp: new Date().toISOString(),
            // Include auth info if available
            auth: token ? { token } : undefined
        };
        // Remove undefined fields
        if (!message.auth) {
            delete message.auth;
        }
        this.send(message);
        // For specific message types, emit a local event for immediate UI feedback
        if (type === 'get_online_players') {
            this.messageSubject.next({
                type: 'request_sent',
                data: { message_type: type },
                timestamp: new Date().toISOString()
            });
        }
    }

    send(data: any) {
        // Try to send to matchmaking WebSocket first (for matchmaking messages)
        if (this.matchmakingWs && this.matchmakingWs.readyState === WebSocket.OPEN) {
            const messageToSend = typeof data === 'string' ? data : JSON.stringify(data);
            this.matchmakingWs.send(messageToSend);
            return;
        }
        // Fallback to player WebSocket
        if (this.playerWs && this.playerWs.readyState === WebSocket.OPEN) {
            const messageToSend = typeof data === 'string' ? data : JSON.stringify(data);
            this.playerWs.send(messageToSend);
            return;
        }
    }

    get messages$(): Observable<any> {
        return this.messageSubject.asObservable();
    }

    get status$(): Observable<WebSocketStatus> {
        return this.statusSubject.asObservable();
    }

    close() {
        if (this.playerWs) {
            this.playerWs.close(1000, 'Manual close'); // 1000 = normal closure
        }
        if (this.matchmakingWs) {
            this.matchmakingWs.close(1000, 'Manual close');
        }
    }

    reconnect() {
        if (this.currentPlayerUrl) {
            this.connectPlayerWebSocket(this.currentPlayerUrl);
        }
        if (this.currentMatchmakingUrl) {
            this.connectMatchmakingWebSocket(this.currentMatchmakingUrl);
        }
    }

    ngOnDestroy() {
        this.close();
    }
}
