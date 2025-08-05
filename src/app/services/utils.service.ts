import { Injectable } from '@angular/core';
import { Player } from '../pages/matchmaking/player-list.component';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  // Add your utility methods here
  public static isNullOrEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  public static capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  public getUsersExceptMe(users: Player[], meId: string | number){
    return users.filter(user => user?.id !== meId);
  }
}
