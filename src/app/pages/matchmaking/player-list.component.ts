import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface Player {
  id?: string;
  pseudo: string;
  avatar: string;
  status?: string;
  rating?: number;
}

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent {
  @Input() players: Player[] = [];
  @Input() usingDemoData = false;
  
  /**
   * Handle image loading errors
   */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/boconon-okpele.png';
  }
}
