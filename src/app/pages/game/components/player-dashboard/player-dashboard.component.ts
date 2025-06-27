import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PlayerInfo {
  name: string;
  pfh: number;
  isActive: boolean;
}

@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-dashboard.component.html',
  styleUrls: ['./player-dashboard.component.scss']
})
export class PlayerDashboardComponent {
  @Input() player!: PlayerInfo;
  @Input() turn!: number;
  @Input() phase!: string;
}
