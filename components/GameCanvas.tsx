import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, Enemy, Position, RoleType, Particle, GameSaveData, Item } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, INITIAL_PLAYER_STATS, ITEMS, ASSETS } from '../constants';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  playerData: Player;
  seed: string;
  onPlayerUpdate: (p: Player) => void;
  onGameOver: () => void;
  inputVector: { x: number, y: number }; // From Joystick
  isAttacking: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  playerData, 
  seed, 
  onPlayerUpdate, 
  onGameOver,
  inputVector,
  isAttacking
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const playerRef = useRef<Player>(playerData);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mapOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const buildingsRef = useRef<Position[]>([]);
  
  // Asset Refs
  const knightImageRef = useRef<HTMLImageElement | null>(null);
  const grassPatternRef = useRef<CanvasPattern | null>(null);
  
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  
  // Load Assets
  useEffect(() => {
    // Load Knight Sprite
    const img = new Image();
    img.src = ASSETS.KNIGHT_SPRITE;
    img.onload = () => {
      knightImageRef.current = img;
    };

    // Load Grass
    const grassImg = new Image();
    grassImg.src = ASSETS.GROUND_TEXTURE;
    grassImg.onload = () => {
      if (canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) grassPatternRef.current = ctx.createPattern(grassImg, 'repeat');
      }
    };
  }, []);

  // Initialize World
  useEffect(() => {
    const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const enemyCount = 15 + (seedNum % 10);
    const buildingCount = 5 + (seedNum % 5);

    const newEnemies: Enemy[] = [];
    for(let i=0; i<enemyCount; i++) {
      newEnemies.push({
        id: `enemy_${i}`,
        pos: { x: Math.random() * 2000 - 1000, y: Math.random() * 2000 - 1000 },
        size: 24,
        color: '#8b0000',
        speed: 1.5 + Math.random(),
        hp: 30,
        type: Math.random() > 0.7 ? 'raider' : 'zombie',
        aggroRange: 300,
        damage: 5
      });
    }
    enemiesRef.current = newEnemies;

    const newBuildings: Position[] = [];
    for(let i=0; i<buildingCount; i++) {
      newBuildings.push({
         x: Math.random() * 1800 - 900,
         y: Math.random() * 1800 - 900
      });
    }
    buildingsRef.current = newBuildings;

    audioService.init();
    audioService.startBGM();

    return () => {
      audioService.stopBGM();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [seed]);

  useEffect(() => {
    playerRef.current.isAttacking = isAttacking;
    if (isAttacking) audioService.playAttack();
  }, [isAttacking]);

  // Main Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    // --- LOGIC ---

    const player = playerRef.current;
    const speed = player.role === RoleType.SCOUT ? 5 : player.role === RoleType.TANK ? 2 : 3;
    
    // Movement
    let dx = inputVector.x;
    let dy = inputVector.y;
    
    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving) {
      player.pos.x += dx * speed;
      player.pos.y += dy * speed;
      player.direction = dx > 0 ? 'right' : 'left';
      
      if (Math.floor(timestamp / 300) % 2 === 0 && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) {
         if(Math.random() < 0.1) audioService.playWalkStep();
      }
    }

    mapOffsetRef.current = {
      x: CANVAS_WIDTH / 2 - player.pos.x,
      y: CANVAS_HEIGHT / 2 - player.pos.y
    };

    // Enemy Logic
    enemiesRef.current.forEach(enemy => {
      const dist = Math.hypot(player.pos.x - enemy.pos.x, player.pos.y - enemy.pos.y);
      
      if (dist < enemy.aggroRange && dist > 20) {
        const angle = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
        enemy.pos.x += Math.cos(angle) * enemy.speed;
        enemy.pos.y += Math.sin(angle) * enemy.speed;
      }

      if (dist < 30) {
         if (Math.random() < 0.02) { 
           player.hp -= enemy.damage;
           audioService.playHit();
           for(let k=0; k<5; k++) {
             particlesRef.current.push({
               x: player.pos.x, y: player.pos.y,
               vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
               life: 1.0, color: 'red'
             });
           }
         }
      }

      // Hitbox for Attack
      if (player.isAttacking && dist < 70) { // Increased range for visual sword
         const enemyDir = enemy.pos.x > player.pos.x ? 'right' : 'left';
         if (player.direction === enemyDir) {
            // Angle check
            const angleToEnemy = Math.atan2(enemy.pos.y - player.pos.y, enemy.pos.x - player.pos.x);
            // Simple cone check (not perfect but works)
            
            enemy.hp -= 2;
            enemy.pos.x += (enemy.pos.x - player.pos.x) * 0.2;
            enemy.pos.y += (enemy.pos.y - player.pos.y) * 0.2;
            
            // Hit sparks
            particlesRef.current.push({
               x: enemy.pos.x, y: enemy.pos.y,
               vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
               life: 0.5, color: '#fff'
            });

            if(enemy.hp <= 0) {
              player.xp += 10;
              if(Math.random() > 0.7) {
                player.inventory.push(ITEMS.APPLE);
              }
            }
         }
      }
    });

    enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    if (player.xp >= 100 * player.level) {
      player.level++;
      player.xp = 0;
      player.maxHp += 10;
      player.hp = player.maxHp;
    }

    if (player.hp <= 0) {
      onGameOver();
      return; 
    }

    if (Math.floor(timestamp) % 60 === 0) {
      onPlayerUpdate({...player});
    }

    // --- RENDER ---
    
    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(mapOffsetRef.current.x, mapOffsetRef.current.y);

    // Render Ground
    if (grassPatternRef.current) {
        ctx.fillStyle = grassPatternRef.current;
        const visibleX = player.pos.x - CANVAS_WIDTH/2 - 100;
        const visibleY = player.pos.y - CANVAS_HEIGHT/2 - 100;
        ctx.save();
        ctx.translate(visibleX, visibleY);
        ctx.fillRect(-visibleX + visibleX, -visibleY + visibleY, CANVAS_WIDTH + 200, CANVAS_HEIGHT + 200);
        ctx.restore();
    } else {
        // Fallback grid
        const gridSize = 100;
        const startX = Math.floor((player.pos.x - CANVAS_WIDTH/2) / gridSize) * gridSize;
        const startY = Math.floor((player.pos.y - CANVAS_HEIGHT/2) / gridSize) * gridSize;
        for (let x = startX; x < startX + CANVAS_WIDTH + gridSize; x += gridSize) {
            for (let y = startY; y < startY + CANVAS_HEIGHT + gridSize; y += gridSize) {
                ctx.fillStyle = ((x+y) % 200 === 0) ? '#2ecc71' : '#27ae60';
                ctx.fillRect(x, y, gridSize, gridSize);
            }
        }
    }

    // Draw Buildings
    buildingsRef.current.forEach(b => {
       // Shadow
       ctx.fillStyle = 'rgba(0,0,0,0.5)';
       ctx.fillRect(b.x + 10, b.y + 10, 120, 120);
       
       // House
       ctx.fillStyle = '#5d4037';
       ctx.fillRect(b.x, b.y, 100, 100);
       // Detail lines
       ctx.strokeStyle = '#3e2723';
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.moveTo(b.x, b.y+20); ctx.lineTo(b.x+100, b.y+20);
       ctx.moveTo(b.x, b.y+40); ctx.lineTo(b.x+100, b.y+40);
       ctx.stroke();

       // Roof
       ctx.fillStyle = '#8d6e63';
       ctx.beginPath();
       ctx.moveTo(b.x - 10, b.y);
       ctx.lineTo(b.x + 50, b.y - 50);
       ctx.lineTo(b.x + 110, b.y);
       ctx.fill();
       
       // Door
       ctx.fillStyle = '#212121';
       ctx.fillRect(b.x + 35, b.y + 60, 30, 40);

       const distToB = Math.hypot(player.pos.x - (b.x + 50), player.pos.y - (b.y + 50));
       if (distToB < 80) {
         ctx.fillStyle = 'white';
         ctx.font = '16px "Press Start 2P"';
         ctx.fillText("AMAN", b.x + 20, b.y - 60);
       }
    });

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      // Enemy Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(e.pos.x, e.pos.y + 10, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Simple Pixel Enemy
      ctx.fillStyle = e.color;
      const hop = Math.abs(Math.sin(timestamp / 150)) * 5;
      ctx.fillRect(e.pos.x - e.size/2, e.pos.y - e.size/2 - hop, e.size, e.size);
      
      // Eyes
      ctx.fillStyle = 'white';
      ctx.fillRect(e.pos.x - 5, e.pos.y - 5 - hop, 3, 3);
      ctx.fillRect(e.pos.x + 2, e.pos.y - 5 - hop, 3, 3);

      // Health Bar
      ctx.fillStyle = 'red';
      ctx.fillRect(e.pos.x - 15, e.pos.y - 30 - hop, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(e.pos.x - 15, e.pos.y - 30 - hop, (e.hp / 30) * 30, 4);
    });

    // --- DRAW PLAYER (SPRITE) ---
    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);

    // Player Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orientation
    if (player.direction === 'left') {
        ctx.scale(-1, 1);
    }

    // Animation Calculation
    const animSpeed = 200; // ms
    const isWalking = (Math.abs(dx) > 0 || Math.abs(dy) > 0);
    const bob = isWalking ? Math.sin(timestamp / 100) * 2 : 0;
    
    // Rotation for Attack Lunge
    if (player.isAttacking) {
        ctx.rotate(Math.PI / 8); // Tilt forward
    }

    // Draw Sprite OR Fallback Rect
    if (knightImageRef.current && player.role === RoleType.SOLDIER) {
        // Draw the uploaded sprite style
        // Adjust width/height to keep aspect ratio if needed, but fitting to 48x48 looks okay for pixel art
        ctx.drawImage(knightImageRef.current, -24, -48 + bob, 48, 48);
    } else {
        // Fallback for other roles (Tank, Medic, Scout)
        ctx.fillStyle = player.role === RoleType.MEDIC ? '#ecf0f1' : '#3498db';
        ctx.fillRect(-16, -32 + bob, 32, 32); 
        ctx.fillStyle = '#f1c40f'; // Head
        ctx.fillRect(-12, -48 + bob, 24, 24);
        // Backpack/Detail
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-10, -25 + bob, 20, 10);
    }

    // --- WEAPON & ATTACK ANIMATION ---
    // Weapon Position
    const weaponX = 10;
    const weaponY = -20 + bob;

    if (player.isAttacking) {
        // SWING ANIMATION
        const swingProgress = (timestamp % 200) / 200; // Fast swing
        const startAngle = -Math.PI / 4;
        const endAngle = Math.PI / 2;
        const currentAngle = startAngle + (endAngle - startAngle) * Math.sin(timestamp / 50); // Fast oscillation

        // 1. Draw Slash Effect (White Arc)
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.arc(10, -20, 40, -Math.PI/2, Math.PI/2); 
        ctx.stroke();
        ctx.restore();

        // 2. Draw Weapon rotated
        ctx.save();
        ctx.translate(weaponX, weaponY);
        ctx.rotate(currentAngle + Math.PI/4); // Dynamic angle
        
        // Draw detailed pixel sword
        ctx.fillStyle = '#95a5a6'; // Blade
        ctx.fillRect(0, -2, 24, 4);
        ctx.fillStyle = '#7f8c8d'; // Edge
        ctx.fillRect(0, 0, 24, 2);
        ctx.fillStyle = '#e67e22'; // Hilt
        ctx.fillRect(-6, -4, 6, 8); // Guard
        ctx.fillStyle = '#d35400'; // Handle
        ctx.fillRect(-10, -2, 4, 4);

        ctx.restore();
    } else {
        // IDLE WEAPON
        ctx.save();
        ctx.translate(weaponX, weaponY);
        ctx.rotate(-Math.PI / 4 + bob * 0.1); // Slight idle movement
        
        // Draw Sword Idle
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(0, -2, 20, 4); // Blade
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(-5, -4, 5, 8); // Guard
        
        ctx.restore();
    }

    ctx.restore();

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [inputVector, onGameOver, onPlayerUpdate]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameLoop]);

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT}
      className="w-full h-full object-cover rendering-pixelated"
    />
  );
};

export default GameCanvas;