import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StrategyOption {
  value: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-strateggy-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './strateggy-selector.component.html',
  styleUrls: ['./strateggy-selector.component.scss']
})
export class StrateggySelectorComponent {
  @Input() strategies: StrategyOption[] = [];
  @Input() selectedStrategy?: string;
  @Input() playerPFH: number = 0;
  @Input() sacrificeCost: number = 14;
  @Output() selectStrategy = new EventEmitter<string>();
  @Output() sacrificeRequested = new EventEmitter<boolean>();

  onSelect(strat: string) {
    this.selectStrategy.emit(strat);
  }
  requestSacrifice(doSacrifice: boolean) {
    this.sacrificeRequested.emit(doSacrifice);
  }
  canSacrifice(): boolean {
    return this.playerPFH >= this.sacrificeCost;
  }
}
