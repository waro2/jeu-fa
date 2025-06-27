import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './pages/shared/footer/footer.component';
import { HeaderComponent } from './pages/shared/header/header.component';
import { WebsocketService } from './services/websocket.service';
import { CommonModule } from '@angular/common';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, HeaderComponent, CommonModule, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'jeu-fa';
  status = '';
  messages: any[] = [];

  constructor(private ws: WebsocketService) { }

  ngOnInit() {
    this.ws.connect();
    this.ws.status$.subscribe(s => this.status = s);
    this.ws.messages$.subscribe(msg => this.messages.push(msg));
  }

  sendTest() {
    this.ws.send({ type: 'ping', content: 'Hello server!' });
  }

  ngOnDestroy() {
    this.ws.close();
  }
}
