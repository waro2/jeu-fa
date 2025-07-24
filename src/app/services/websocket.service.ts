import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type WebSocketStatus = 'OPEN' | 'CLOSED' | 'ERROR' | 'CONNECTING';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
    private playerWs?: WebSocket;
    private matchmakingWs?: WebSocket;
    private readonly messageSubject = new Subject<any>();
    private readonly statusSubject = new Subject<WebSocketStatus>();
    private currentPlayerUrl: string = '';
    private currentMatchmakingUrl: string = '';


    connectPlayer(playerId: string, baseUrl?: string) {
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/player/${playerId}`;
        console.log(typeof playerId)
        this.connectPlayerWebSocket(url);
    }

    connectGame(gameId: string, playerId: string, baseUrl?: string) {
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/game/${gameId}?player_id=${playerId}`;
        console.log('Connecting to game WebSocket at:', url);
        this.connectPlayerWebSocket(url);
    }

    connectMatchmaking(playerId: string, baseUrl?: string) {
        // Use environment-specific base URL or default to localhost
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/matchmaking?player_id=${playerId}`;
        console.log('Connecting to matchmaking WebSocket at:', url);
        console.log('Player ID type:', typeof playerId, 'Player ID value:', playerId);
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
            console.log('Player WebSocket connecting to:', url);
            
            this.playerWs.onopen = () => {
                console.log('Player WebSocket connection established');
                this.statusSubject.next('OPEN');
            };

            this.playerWs.onclose = (event: CloseEvent) => {
                console.log('Player WebSocket connection closed, code:', event.code);
                this.statusSubject.next('CLOSED');
                
                // Auto-reconnect after 3 seconds if not manually closed
                if (event.code !== 1000) { // 1000 is normal closure
                    setTimeout(() => {
                        console.log('Attempting to reconnect player WebSocket...');
                        this.connectPlayerWebSocket(this.currentPlayerUrl);
                    }, 3000);
                }
            };

            this.playerWs.onerror = (error: Event) => {
                console.error('Player WebSocket error:', error);
                this.statusSubject.next('ERROR');
            };

            this.playerWs.onmessage = (event: MessageEvent) => {
                this.handleWebSocketMessage(event, 'player');
            };
        } catch (error) {
            console.error('Error creating player WebSocket connection:', error);
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
            console.log('Matchmaking WebSocket connecting to:', url);
            console.log('WebSocket ready state after creation:', this.matchmakingWs.readyState);
            
            // Add a connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.matchmakingWs && this.matchmakingWs.readyState === WebSocket.CONNECTING) {
                    console.error('Matchmaking WebSocket connection timeout after 10 seconds');
                    console.log('WebSocket ready state on timeout:', this.matchmakingWs.readyState);
                    this.matchmakingWs.close();
                    this.statusSubject.next('ERROR');
                }
            }, 10000); // 10 second timeout
            
            this.matchmakingWs.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('Matchmaking WebSocket connection established');
                this.statusSubject.next('OPEN');
            };

            this.matchmakingWs.onclose = (event: CloseEvent) => {
                clearTimeout(connectionTimeout);
                console.log('Matchmaking WebSocket connection closed, code:', event.code);
                this.statusSubject.next('CLOSED');
                
                // Auto-reconnect after 3 seconds if not manually closed
                if (event.code !== 1000) { // 1000 is normal closure
                    setTimeout(() => {
                        console.log('Attempting to reconnect matchmaking WebSocket...');
                        this.connectMatchmakingWebSocket(this.currentMatchmakingUrl);
                    }, 3000);
                }
            };

            this.matchmakingWs.onerror = (error: Event) => {
                clearTimeout(connectionTimeout);
                console.error('Matchmaking WebSocket error:', error);
                this.statusSubject.next('ERROR');
            };

            this.matchmakingWs.onmessage = (event: MessageEvent) => {
                this.handleWebSocketMessage(event, 'matchmaking');
            };
        } catch (error) {
            console.error('Error creating matchmaking WebSocket connection:', error);
            this.statusSubject.next('ERROR');
        }
    }

    private handleWebSocketMessage(event: MessageEvent, source: 'player' | 'matchmaking') {
        try {
            let parsedData;
            
            // Try to parse as JSON
            try {
                parsedData = JSON.parse(event.data);
                console.log(parsedData)
            } catch (parseError) {
                console.warn('Failed to parse WebSocket message as JSON:', parseError);
                
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
            
            console.log(`Processed WebSocket message from ${source}:`, parsedData);
            this.messageSubject.next(parsedData);
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            // Still emit the raw data so we don't lose any messages
            this.messageSubject.next(event.data);
        }
    }

    connectTest(baseUrl?: string) {
        const serverUrl = baseUrl || this.getWebSocketBaseUrl();
        const url = `${serverUrl}/api/v1/websocket/ws/test`;
        console.log('Connecting to test WebSocket at:', url);
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
        
        console.log('Sending WebSocket message:', message);
        this.send(message);
        
        // For specific message types, emit a local event for immediate UI feedback
        if (type === 'get_online_players') {
            console.log('Emitting local get_online_players confirmation');
            // We don't have data yet, but we can confirm the request was sent
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
            console.log('Sending WebSocket message to matchmaking:', messageToSend);
            this.matchmakingWs.send(messageToSend);
            return;
        }
        
        // Fallback to player WebSocket
        if (this.playerWs && this.playerWs.readyState === WebSocket.OPEN) {
            const messageToSend = typeof data === 'string' ? data : JSON.stringify(data);
            console.log('Sending WebSocket message to player:', messageToSend);
            this.playerWs.send(messageToSend);
            return;
        }
        
        console.warn('No WebSocket connections are open, cannot send message');
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
            console.log('Manually reconnecting player WebSocket...');
            this.connectPlayerWebSocket(this.currentPlayerUrl);
        }
        if (this.currentMatchmakingUrl) {
            console.log('Manually reconnecting matchmaking WebSocket...');
            this.connectMatchmakingWebSocket(this.currentMatchmakingUrl);
        }
        if (!this.currentPlayerUrl && !this.currentMatchmakingUrl) {
            console.warn('Cannot reconnect - no previous connection URLs');
        }
    }

    ngOnDestroy() {
        this.close();
    }
}
