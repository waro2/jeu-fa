import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Player {
  pseudo: string;
  avatar: string;
}

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {
  players: Player[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.http.get<Player[]>('/api/players/online').subscribe({
      next: (data: Player[]) => this.players = data,
      error: () => this.players = []
    });
  }
}
