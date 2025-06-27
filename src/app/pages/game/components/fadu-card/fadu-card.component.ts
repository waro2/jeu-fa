import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

export interface FaduCard {
  name: string;
  image: string;
  pfh?: number;
}

export interface StrategyOption {
  value: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-fadu-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fadu-card.component.html',
  styleUrls: ['./fadu-card.component.scss'],
  animations: [
    trigger('cardFlip', [
      state('front', style({ transform: 'rotateY(0)' })),
      state('back', style({ transform: 'rotateY(180deg)' })),
      transition('front <=> back', [
        animate('400ms cubic-bezier(0.4,0.2,0.2,1)')
      ])
    ]),
    trigger('cardDraw', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8) translateY(40px)' }),
        animate('400ms cubic-bezier(0.4,0.2,0.2,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ])
  ]
})
export class FaduCardComponent {
  @Input() card!: FaduCard;
  @Input() isActive: boolean = false;
  @Input() isProcessing: boolean = false;
  @Input() currentPlayer: string = '';
  @Input() gamePhase: 'draw' | 'strategy' | 'sacrifice' | string = '';
  @Input() selectedStrategy?: string;
  @Input() strategies: StrategyOption[] = [];
  @Input() cardState: 'front' | 'back' = 'front';
  @Input() cardImage?: string;

  @Output() selectCard = new EventEmitter<void>();
  @Output() selectStrategy = new EventEmitter<string>();
  @Output() sacrificeDecision = new EventEmitter<boolean>();

  onSelectCard() {
    this.selectCard.emit();
  }
  onSelectStrategy(strat: string) {
    this.selectStrategy.emit(strat);
  }
  onSacrificeDecision(decision: boolean) {
    this.sacrificeDecision.emit(decision);
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/boconon-okpele.png';
  }
}
