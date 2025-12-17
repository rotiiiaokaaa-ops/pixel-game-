export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER
}

export enum RoleType {
  SOLDIER = 'Prajurit',
  SCOUT = 'Pengintai',
  MEDIC = 'Medis',
  TANK = 'Tank'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Position;
  size: number;
  color: string;
  speed: number;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  role: RoleType;
  inventory: Item[];
  xp: number;
  level: number;
  isAttacking: boolean;
  direction: 'left' | 'right';
}

export interface Enemy extends Entity {
  hp: number;
  type: 'zombie' | 'raider' | 'wolf';
  aggroRange: number;
  damage: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'food' | 'material';
  value: number; // Damage or Heal amount
  icon: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: string;
  reward: string;
  completed: boolean;
}

export interface GameSaveData {
  player: Player;
  seed: string; // "Invite Code" / Map Seed
  quests: Quest[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}