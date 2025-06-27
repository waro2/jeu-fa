import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent {
  players = [
    { pseudo: 'FaviMaster', avatar: 'assets/images/avatar1.png' },
    { pseudo: 'YovoKing', avatar: 'assets/images/avatar2.png' },
    { pseudo: 'QueenFa', avatar: 'assets/images/avatar3.png' },
    { pseudo: 'StratPro', avatar: 'assets/images/avatar4.png' }
  ];

  constructor(private router: Router) { }

  startGame() {
    this.router.navigate(['/game-board']);
  }
}
