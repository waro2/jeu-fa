import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
    { path: 'matchmaking', loadComponent: () => import('./pages/matchmaking/matchmaking.component').then(m => m.MatchmakingComponent), canActivate: [AuthGuard] },
    { path: 'game-board', loadComponent: () => import('./pages/game/game-board.component').then(m => m.GameBoardComponent), canActivate: [AuthGuard] },
    { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
    { path: 'user-profile', loadComponent: () => import('./pages/auth/user-profile/user-profile.component').then(m => m.UserProfileComponent), canActivate: [AuthGuard] },
    { path: 'ws-test', loadComponent: () => import('./components/websocket-tester/websocket-tester.component').then(m => m.WebsocketTesterComponent) },
    { path: 'game/:gameId', loadComponent: () => import('./pages/game/game-board.component').then(m => m.GameBoardComponent), canActivate: [AuthGuard] },
];
