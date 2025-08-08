import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';

interface UserInfo {
    id: string;
    email: string;
    pseudo?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'user_info';

    constructor(private readonly ws: WebsocketService) {}

    /**
     * Set authentication token and user info, then establish WebSocket connection
     */
    setToken(token: string, userInfo?: UserInfo) {
        localStorage.setItem(this.TOKEN_KEY, token);
        
        if (userInfo) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
            // Establish WebSocket connection for the authenticated user
            this.connectUserToWebSocket(userInfo.id);
        }
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Get current user information
     */
    getUserInfo(): UserInfo | null {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Get current user ID
     */
    getUserId(): string | null {
        const userInfo = this.getUserInfo();
        return userInfo?.id || null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    /**
     * Login with user info and establish WebSocket connection
     */
    login(token: string, userInfo: UserInfo) {
        this.setToken(token, userInfo);
    }

    /**
     * Logout and close WebSocket connections
     */
    logout() {
        this.ws.close(); // Close WebSocket connection
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    /**
     * Establish WebSocket connection for the authenticated user
     */
    private connectUserToWebSocket(userId: string) {
        // Connect to the player WebSocket endpoint to register as online
        this.ws.connectPlayer(userId);
    }

    /**
     * Reconnect WebSocket if user is logged in
     */
    reconnectWebSocket() {
        const userId = this.getUserId();
        if (userId) {
            this.connectUserToWebSocket(userId);
        }
    }
}
