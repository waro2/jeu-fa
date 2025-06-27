import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
    private ws?: WebSocket;
    private messageSubject = new Subject<any>();
    private statusSubject = new Subject<'OPEN' | 'CLOSED' | 'ERROR'>();

    connect(url: string = 'ws://localhost:8000/ws') {
        if (this.ws) {
            this.ws.close();
        }
        this.ws = new WebSocket(url);
        console.log('Connecting to WebSocket:', (this.ws));

        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
            this.statusSubject.next('OPEN');
        };
        this.ws.onclose = () => this.statusSubject.next('CLOSED');
        this.ws.onerror = () => this.statusSubject.next('ERROR');
        this.ws.onmessage = (event) => {
            try {
                console.log('Received message:', event.data);
                // Attempt to parse JSON data
                this.messageSubject.next(JSON.parse(event.data));
            } catch {
                this.messageSubject.next(event.data);
                console.warn('Received non-JSON message:', event.data);
            }
        };
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Sending message:', data);
            this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }

    get messages$(): Observable<any> {
        return this.messageSubject.asObservable();
    }

    get status$(): Observable<'OPEN' | 'CLOSED' | 'ERROR'> {
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
