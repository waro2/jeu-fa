import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type WebSocketStatus = 'OPEN' | 'CLOSED' | 'ERROR' | 'CONNECTING';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
    private ws?: WebSocket;
    private messageSubject = new Subject<any>();
    private statusSubject = new Subject<WebSocketStatus>();
    private currentUrl: string = '';


    connectPlayer(playerId: string, baseUrl: string = 'ws://localhost:8000') {
        const url = `${baseUrl}/api/v1/websocket/websocket/ws/player/${playerId}`;
        this.connect(url);
    }

    connectGame(gameId: string, playerId: string, baseUrl: string = 'ws://localhost:8000') {
        const url = `${baseUrl}/api/v1/websocket/websocket/ws/game/${gameId}?player_id=${playerId}`;
        this.connect(url);
    }

    connectMatchmaking(baseUrl: string = 'ws://localhost:8000') {
        const url = `${baseUrl}/api/v1/websocket/websocket/ws/matchmaking`;
        this.connect(url);
    }

    private connect(url: string) {
        this.currentUrl = url;
        this.statusSubject.next('CONNECTING');

        if (this.ws) {
            this.ws.close();
        }

        try {
            this.ws = new WebSocket(url);
            console.log('ws', this.ws);
            this.ws.onopen = () => {
                this.statusSubject.next('OPEN');
            };

            this.ws.onclose = (event) => {
                this.statusSubject.next('CLOSED');
            };

            this.ws.onerror = (error) => {
                this.statusSubject.next('ERROR');
            };

            this.ws.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data);
                    this.messageSubject.next(parsedData);
                } catch (parseError) {
                    this.messageSubject.next(event.data);
                }
            };
        } catch (error) {
            this.statusSubject.next('ERROR');
        }
    }

    connectTest(baseUrl: string = 'ws://localhost:8000') {
        const url = `${baseUrl}/api/v1/websocket/websocket/ws/test`;
        this.connect(url);
    }

    sendMessage(type: string, data: any = {}) {
        const message = {
            type,
            data,
            timestamp: new Date().toISOString()
        };
        this.send(message);
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageToSend = typeof data === 'string' ? data : JSON.stringify(data);
            this.ws.send(messageToSend);
        } else {
            console.warn('WebSocket not open, cannot send message');
        }
    }

    get messages$(): Observable<any> {
        return this.messageSubject.asObservable();
    }

    get status$(): Observable<WebSocketStatus> {
        return this.statusSubject.asObservable();
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    ngOnDestroy() {
        this.close();
    }
}
