import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-rules-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-rules-modal.component.html',
  styleUrls: ['./game-rules-modal.component.scss']
})
export class GameRulesModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
