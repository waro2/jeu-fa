import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameRulesModalComponent } from '../../components/game-rules-modal/game-rules-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [GameRulesModalComponent]
})
export class HomeComponent {
  isRulesModalOpen = false;

  constructor(private readonly router: Router) { }

  goToMatchmaking() {
    this.router.navigate(['/matchmaking']);
  }

  openRulesModal() {
    this.isRulesModalOpen = true;
  }

  closeRulesModal() {
    this.isRulesModalOpen = false;
  }
}
