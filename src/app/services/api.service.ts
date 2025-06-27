import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly baseUrl = '/api';

    constructor(private http: HttpClient) { }

    // --- Players ---
    createPlayer(name: string) {
        return this.http.post(`${this.baseUrl}/players`, { name });
    }

    getPlayers(gameId?: string) {
        if (gameId) {
            return this.http.get(`${this.baseUrl}/players/game/${gameId}/players`);
        }
        return this.http.get(`${this.baseUrl}/players`);
    }

    getPlayerStats(playerId: number) {
        return this.http.get(`${this.baseUrl}/players/${playerId}/stats`);
    }

    deletePlayer(playerId: number) {
        return this.http.delete(`${this.baseUrl}/players/${playerId}`);
    }

    getRandomPlayer(excludeCurrent?: number) {
        let params = new HttpParams();
        if (excludeCurrent) params = params.set('exclude_current', excludeCurrent);
        return this.http.get(`${this.baseUrl}/players/random`, { params });
    }

    searchPlayers(query: string, limit?: number) {
        let params = new HttpParams().set('query', query);
        if (limit) params = params.set('limit', limit);
        return this.http.get(`${this.baseUrl}/players/search`, { params });
    }

    getPlayer(playerId: number) {
        return this.http.get(`${this.baseUrl}/players/${playerId}`);
    }

    getPlayersPaginated(page = 1, limit = 20, activeOnly = false) {
        let params = new HttpParams().set('page', page).set('limit', limit).set('active_only', activeOnly);
        return this.http.get(`${this.baseUrl}/players`, { params });
    }

    // --- Game Actions ---
    createGame(mode: string, roomCode?: string) {
        return this.http.post(`${this.baseUrl}/game-actions/create`, { mode, room_code: roomCode });
    }

    getGameStatus(gameId: string) {
        return this.http.get(`${this.baseUrl}/game-actions/${gameId}/status`);
    }

    drawCard(gameId: string) {
        return this.http.post(`${this.baseUrl}/game-actions/${gameId}/cards/draw`, {});
    }

    drawSacrificeCard(gameId: string) {
        return this.http.post(`${this.baseUrl}/game-actions/${gameId}/cards/sacrifice`, {});
    }

    chooseStrategy(gameId: string, strategy: string) {
        return this.http.post(`${this.baseUrl}/game-actions/${gameId}/strategy`, { strategy });
    }

    decideSacrifice(gameId: string, sacrifice: boolean) {
        return this.http.post(`${this.baseUrl}/game-actions/${gameId}/sacrifice`, { sacrifice });
    }

    nextPhase(gameId: string) {
        return this.http.post(`${this.baseUrl}/game-actions/${gameId}/next-phase`, {});
    }

    // --- FADU ---
    drawFaduCard(cardType: 'standard' | 'sacrifice') {
        return this.http.post(`${this.baseUrl}/fadu/draw`, { card_type: cardType });
    }

    doSacrifice(currentPfh: number) {
        return this.http.post(`${this.baseUrl}/fadu/sacrifice`, { current_pfh: currentPfh });
    }

    getFaduProbabilities() {
        return this.http.get(`${this.baseUrl}/fadu/probabilities`);
    }

    getFaduCard(cardId: string) {
        return this.http.get(`${this.baseUrl}/fadu/cards/${cardId}`);
    }

    getFaduStats() {
        return this.http.get(`${this.baseUrl}/fadu/stats`);
    }

    // --- Matchmaking ---
    joinMatchmaking(userId: string) {
        return this.http.post(`${this.baseUrl}/matchmaking`, { user_id: userId });
    }

    getMatchmakingStatus(userId: string) {
        return this.http.get(`${this.baseUrl}/matchmaking/status/${userId}`);
    }

    quitMatchmaking(userId: string) {
        return this.http.delete(`${this.baseUrl}/matchmaking/${userId}`);
    }

    getMatchmakingQueueInfo() {
        return this.http.get(`${this.baseUrl}/matchmaking/queue/info`);
    }

    // --- Admin ---
    resetDb(apiKey: string) {
        return this.http.post(`${this.baseUrl}/admin/reset-db`, {}, { headers: { 'X-API-KEY': apiKey } });
    }

    getSystemStatus() {
        return this.http.get(`${this.baseUrl}/admin/system-status`);
    }

    // --- Auth ---
    login(username: string, password: string) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        return this.http.post(`${this.baseUrl}/auth/login`, formData);
    }

    register(username: string, email: string, password: string, confirmPassword: string) {
        return this.http.post(`${this.baseUrl}/auth/register`, {
            username,
            email,
            password,
            confirm_password: confirmPassword
        });
    }

    getMe(token: string) {
        return this.http.get(`${this.baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    }

    refreshToken(refreshToken: string) {
        return this.http.post(`${this.baseUrl}/auth/refresh`, { refresh_token: refreshToken });
    }

    logout(token: string) {
        return this.http.post(`${this.baseUrl}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
    }
}
