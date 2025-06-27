// Types et interfaces pour le jeu Fa
export type PlayerType = 'player1' | 'player2';
export type Strategy = 'V' | 'C' | 'G';

export interface FaduCard {
  id: string;
  name: string;
  pfh: number;
  isSacrifice: boolean;
  image: string;
  type: 'standard' | 'sacrifice';
}

export interface SacrificeResult {
  success: boolean;
  card?: FaduCard;
  new_pfh: number;
  previous_pfh: number;
  pfh_change: number;
  message: string;
}

export interface StrategySelection {
  player: PlayerType;
  strategy: Strategy;
  sacrifice: boolean;
}

export interface StrategyOption {
  value: Strategy;
  label: string;
  description: string;
}

export interface Player {
  name: string;
  pfh: number;
  card: FaduCard | null;
  strategy: Strategy | null;
  sacrifice: boolean;
  sacrificeCard: FaduCard | null;
}

export interface GameTurn {
  turn: number;
  player1: Player;
  player2: Player;
}

export interface GameState {
  currentTurn: number;
  maxTurns: number;
  currentPlayer: PlayerType;
  phase: 'draw' | 'strategy' | 'sacrifice' | 'results';
  player1: Player;
  player2: Player;
  gameOver: boolean;
  winner: PlayerType | 'draw' | null;
  gameHistory: GameTurn[];
}
