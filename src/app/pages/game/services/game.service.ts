import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import type {
  Strategy
} from '../interfaces/game.interface';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly apiBaseUrl = 'http://localhost:8000';
  // Matrice de gains (statique, accessible partout)
  private readonly gainMatrix = {
    VV: (X: number, Y: number, params: any) => [
      Math.floor((1 - params.a) * X + params.b * Y),
      Math.floor(params.a * X + (1 - params.b) * Y)
    ],
    VC: (X: number, Y: number, params: any) => [
      Math.floor(X + (1 - params.f) * params.c * (X + Y)),
      Math.floor(Y + params.f * params.c * (X + Y))
    ],
    VG: (X: number, Y: number, params: any) => [
      Math.floor((1 - params.e) * X),
      Math.floor(Y + params.e * X)
    ],
    CV: (X: number, Y: number, params: any) => [
      Math.floor(X + params.f * params.c * (X + Y)),
      Math.floor(Y + (1 - params.f) * params.c * (X + Y))
    ],
    CC: (X: number, Y: number, params: any) => [
      Math.floor((1 + params.c) * X),
      Math.floor((1 + params.c) * Y)
    ],
    CG: (X: number, Y: number, params: any) => [
      Math.floor((1 - params.e) * (1 + params.c) * X),
      Math.floor((1 + params.c) * (Y + params.e * X))
    ],
    GV: (X: number, Y: number, params: any) => [
      Math.floor(X + params.e * Y),
      Math.floor((1 - params.e) * Y)
    ],
    GC: (X: number, Y: number, params: any) => [
      Math.floor((1 + params.c) * (X + params.e * Y)),
      Math.floor((1 - params.e) * (1 + params.c) * Y)
    ],
    GG: (X: number, Y: number, params: any) => {
      const I_X_gt_Y = X > Y ? 1 : 0;
      const I_Y_gt_X = Y > X ? 1 : 0;
      return [
        Math.floor((1 - params.d) * X + params.e * Y * I_X_gt_Y - params.e * X * I_Y_gt_X),
        Math.floor((1 - params.d) * Y + params.e * X * I_Y_gt_X - params.e * Y * I_X_gt_Y)
      ];
    }
  };

  // Paramètres de la matrice (modifiable si besoin)
  private readonly matrixParams = {
    a: 0.0, b: 0.0, c: 0.2, d: 0.2, e: 0.3, f: 0.8
  };

  constructor(private readonly http: HttpClient) {}

  // Utilitaire public pour tous les calculs de gains
  computeGains(strat1: Strategy, strat2: Strategy, X: number, Y: number): [number, number] {
    const key = (strat1 + strat2) as keyof typeof this.gainMatrix;
    const fn = this.gainMatrix[key];
    if (!fn) return [0, 0];
    const [g1, g2] = fn(X, Y, this.matrixParams);
    return [Math.max(g1, 0), Math.max(g2, 0)];
  }

  fetchGameDetails(gameId: number, token: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/api/v1/game/${gameId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}