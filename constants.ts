import { RoleType, Player } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = 32;

export const INITIAL_PLAYER_STATS: Record<RoleType, Partial<Player>> = {
  [RoleType.SOLDIER]: { hp: 150, maxHp: 150, speed: 3, maxStamina: 100 },
  [RoleType.SCOUT]: { hp: 80, maxHp: 80, speed: 5, maxStamina: 150 },
  [RoleType.MEDIC]: { hp: 100, maxHp: 100, speed: 4, maxStamina: 100 },
  [RoleType.TANK]: { hp: 200, maxHp: 200, speed: 2, maxStamina: 80 },
};

export const ITEMS = {
  APPLE: { id: 'food_1', name: 'Apel Segar', type: 'food', value: 20, icon: '🍎' },
  SWORD: { id: 'wep_1', name: 'Pedang Karat', type: 'weapon', value: 15, icon: '🗡️' },
  MEDKIT: { id: 'med_1', name: 'P3K', type: 'food', value: 50, icon: '💊' },
} as const;

export const INVITE_CODE_LENGTH = 6;

// Assets
// NOTE: Ganti URL ini dengan path gambar lokal atau Base64 dari gambar pixel ksatria Anda untuk hasil persis.
// Ini adalah placeholder yang mirip dengan gaya pixel art ksatria.
export const ASSETS = {
  KNIGHT_SPRITE: "https://img.itch.zone/aW1nLzEzNDY1NDg1LnBuZw==/original/7h%2B61e.png", // Contoh sprite sheet ksatria umum
  GROUND_TEXTURE: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTQ4NDY2NDNCMjMyMTFFMjlGMTRDSEU0OEQ5NTc5RTMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MTQ4NDY2NDRCMjMyMTFFMjlGMTRDSEU0OEQ5NTc5RTMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxNDg0NjY0MUIyMzIxMUUyOUYxNENIRTQ4RDk1NzlFMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxNDg0NjY0MkIyMzIxMUUyOUYxNENIRTQ4RDk1NzlFMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pso48EwAAAAGUExURZWVlf///497JEQAAAAMdFJOU////////////////6F65lUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAABaSURBVHjaYmBgYGVgAICM/wwMYAAwkB0A4jIwMDIyMjo4ODAzMTEwAAgwMzMzM7GysrKwsDABCTIyMnJycra2trKzs4MJMDIyMjIyMTAwMDIyMoKx0d2AgQEA5xUCk21t1yAAAAAASUVORK5CYII="
};