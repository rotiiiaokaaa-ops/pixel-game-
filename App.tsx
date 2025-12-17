import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player, RoleType, Quest, Item } from './types';
import { INITIAL_PLAYER_STATS, ITEMS, INVITE_CODE_LENGTH } from './constants';
import GameCanvas from './components/GameCanvas';
import Joystick from './components/Joystick';
import { generateQuest } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  // State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [player, setPlayer] = useState<Player>({
    id: 'p1',
    pos: { x: 0, y: 0 },
    size: 32,
    color: 'blue',
    speed: 3,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    role: RoleType.SOLDIER,
    inventory: [ITEMS.SWORD],
    xp: 0,
    level: 1,
    isAttacking: false,
    direction: 'right'
  });
  const [inviteCode, setInviteCode] = useState<string>("");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isGeneratingQuest, setIsGeneratingQuest] = useState(false);
  
  // Controls
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [isAttacking, setIsAttacking] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());

  // Initialization & Load
  useEffect(() => {
    const saved = localStorage.getItem('pixelSurvivorSave');
    if (saved) {
      // Optional: Add logic to resume previous session
      // const parsed = JSON.parse(saved);
      // setPlayer(parsed.player);
    }
    
    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      updateVectorFromKeys();
      if (e.code === 'Space') setIsAttacking(true);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
      updateVectorFromKeys();
      if (e.code === 'Space') setIsAttacking(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('keyup', handleKeyUp);
    }
  }, []);

  const updateVectorFromKeys = () => {
    let x = 0;
    let y = 0;
    if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) y = -1;
    if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) y = 1;
    if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) x = -1;
    if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) x = 1;
    
    // Normalize if diagonal
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x*x + y*y);
      x /= len;
      y /= len;
    }
    setJoystickVector({ x, y });
  };

  const handleStartGame = (role: RoleType, code?: string) => {
    const seed = code && code.length === INVITE_CODE_LENGTH ? code : Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(seed);
    
    setPlayer(prev => ({
      ...prev,
      role,
      ...INITIAL_PLAYER_STATS[role],
      hp: INITIAL_PLAYER_STATS[role].maxHp || 100
    }));

    audioService.init();
    setGameState(GameState.PLAYING);
  };

  const handleSave = () => {
    const data = { player, seed: inviteCode, quests };
    localStorage.setItem('pixelSurvivorSave', JSON.stringify(data));
    alert("Progress Disimpan!");
  };

  const handleQuestGeneration = async () => {
    if (isGeneratingQuest) return;
    setIsGeneratingQuest(true);
    const newQuest = await generateQuest(player);
    setQuests(prev => [newQuest, ...prev]);
    setIsGeneratingQuest(false);
  };

  const consumeItem = (idx: number) => {
    const item = player.inventory[idx];
    if (item.type === 'food') {
      setPlayer(p => {
        const newHp = Math.min(p.maxHp, p.hp + item.value);
        const newInv = [...p.inventory];
        newInv.splice(idx, 1);
        return { ...p, hp: newHp, inventory: newInv };
      });
      // Sound effect here could be added
    }
  };

  // --- RENDER ---

  if (gameState === GameState.MENU) {
    return (
      <div className="w-full h-screen bg-neutral-900 flex flex-col items-center justify-center text-white pixel-font p-4">
        <h1 className="text-4xl md:text-6xl text-red-500 mb-8 text-center animate-pulse">PIXEL SURVIVOR</h1>
        
        <div className="bg-neutral-800 p-6 rounded-lg border-2 border-neutral-600 max-w-md w-full">
          <label className="block mb-2 text-sm text-gray-400">Kode Undangan (Teman):</label>
          <input 
            type="text" 
            placeholder="KOSONGKAN JIKA SOLO" 
            className="w-full bg-neutral-900 border border-gray-600 p-2 mb-6 text-center tracking-widest uppercase"
            maxLength={6}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          />

          <p className="mb-4 text-center text-yellow-500">PILIH PERAN:</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.values(RoleType).map((role) => (
              <button 
                key={role}
                onClick={() => handleStartGame(role, inviteCode)}
                className="p-3 bg-neutral-700 hover:bg-neutral-600 active:bg-red-900 border-2 border-black rounded transition-colors text-xs md:text-sm"
              >
                {role}
              </button>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 text-center mt-4">
            Gunakan kode undangan yang sama untuk bermain di map yang sama (Shared Seed).
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="w-full h-screen bg-black/90 flex flex-col items-center justify-center text-red-600 z-50">
        <h1 className="text-6xl font-bold pixel-font mb-4">MATI</h1>
        <p className="text-white mb-8">Anda gagal bertahan hidup.</p>
        <button 
          onClick={() => setGameState(GameState.MENU)}
          className="px-6 py-3 bg-white text-black pixel-font hover:bg-gray-300"
        >
          MENU UTAMA
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black touch-none">
      {/* Game Rendering Layer */}
      <div className="absolute inset-0">
        <GameCanvas 
          playerData={player}
          seed={inviteCode}
          inputVector={joystickVector}
          isAttacking={isAttacking}
          onPlayerUpdate={setPlayer}
          onGameOver={() => setGameState(GameState.GAME_OVER)}
        />
      </div>

      {/* HUD Layer */}
      <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between items-start pointer-events-none">
        
        {/* Status Bars */}
        <div className="flex flex-col gap-2 w-48 pointer-events-auto">
          {/* Health */}
          <div className="w-full bg-black/50 border border-white/30 h-6 relative">
            <div 
              className="h-full bg-red-600 transition-all duration-300" 
              style={{ width: `${(player.hp / player.maxHp) * 100}%` }} 
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold text-shadow">
              HP {Math.floor(player.hp)}/{player.maxHp}
            </span>
          </div>
          
          {/* XP/Level */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded border border-blue-400">
              LVL {player.level}
            </div>
            <div className="flex-1 bg-black/50 border border-white/30 h-4 relative">
               <div 
                 className="h-full bg-yellow-500 transition-all duration-300"
                 style={{ width: `${(player.xp / (100 * player.level)) * 100}%` }}
               />
            </div>
          </div>

           {/* Room Code */}
           <div className="text-[10px] text-gray-400 bg-black/60 p-1 rounded inline-block">
             ROOM: {inviteCode}
           </div>
        </div>

        {/* Quest & Inventory Panel */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
           <button 
             onClick={handleSave} 
             className="bg-neutral-800 text-white text-xs px-2 py-1 border border-gray-500 hover:bg-neutral-700"
           >
             SIMPAN GAME
           </button>
           
           <div className="bg-black/60 p-2 rounded border border-white/10 w-48 text-white">
             <div className="flex justify-between items-center mb-1">
               <h3 className="text-xs text-yellow-400 font-bold">QUEST</h3>
               <button 
                 onClick={handleQuestGeneration}
                 disabled={isGeneratingQuest}
                 className="text-[10px] bg-blue-900 px-1 rounded animate-pulse"
               >
                 {isGeneratingQuest ? "..." : "+ BARU"}
               </button>
             </div>
             {quests.length === 0 ? (
               <p className="text-[10px] text-gray-400">Belum ada misi.</p>
             ) : (
               <div className="max-h-24 overflow-y-auto">
                  {quests.map(q => (
                    <div key={q.id} className="mb-2 border-b border-gray-700 pb-1">
                      <p className="text-[10px] font-bold">{q.title}</p>
                      <p className="text-[9px] text-gray-300">{q.description}</p>
                      <p className="text-[9px] text-green-400">Hadiah: {q.reward}</p>
                    </div>
                  ))}
               </div>
             )}
           </div>

           {/* Inventory Preview */}
           <div className="flex gap-1">
             {player.inventory.map((item, idx) => (
               <button 
                 key={idx}
                 onClick={() => consumeItem(idx)}
                 className="w-8 h-8 bg-neutral-800 border border-gray-500 flex items-center justify-center text-lg hover:bg-neutral-700"
                 title={item.name}
               >
                 {item.icon}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-8 left-8 pointer-events-auto md:hidden">
        <Joystick 
          size={120} 
          onMove={(x, y) => setJoystickVector({ x, y })} 
          onStop={() => setJoystickVector({ x: 0, y: 0 })}
        />
      </div>

      <div className="absolute bottom-8 right-8 pointer-events-auto md:hidden">
         <button
           className={`w-20 h-20 rounded-full border-4 border-gray-400 flex items-center justify-center text-2xl shadow-lg active:scale-95 ${isAttacking ? 'bg-red-600' : 'bg-red-800'}`}
           onTouchStart={(e) => { e.preventDefault(); setIsAttacking(true); }}
           onTouchEnd={(e) => { e.preventDefault(); setIsAttacking(false); }}
         >
           ⚔️
         </button>
      </div>
      
      {/* PC Controls Hint */}
      <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center pointer-events-none">
        WASD: Gerak | SPASI: Serang
      </div>

    </div>
  );
};

export default App;