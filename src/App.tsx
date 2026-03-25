/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Terminal, Volume2, Cpu, Zap } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIR = { x: 0, y: -1 };

const TRACKS = [
  { id: '0x01', title: "AI_GEN_01.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: '0x02', title: "NEURAL_NET_02.MP3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: '0x03', title: "SYNTH_VOID_03.FLAC", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const dirRef = useRef(INITIAL_DIR);

  // Music State
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Terminal State
  const [hexDump, setHexDump] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHexDump(prev => {
        const newRow = Array.from({length: 4}, () => Math.floor(Math.random() * 65535).toString(16).padStart(4, '0').toUpperCase()).join(' ');
        return [...prev.slice(-9), newRow];
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    dirRef.current = INITIAL_DIR;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    if (!gameStarted && e.key === ' ') {
      setGameStarted(true);
      return;
    }
    
    if (gameOver && e.key === ' ') {
      resetGame();
      return;
    }

    const currentDir = dirRef.current;
    switch(e.key) {
      case 'ArrowUp': case 'w': if (currentDir.y === 0) dirRef.current = {x: 0, y: -1}; break;
      case 'ArrowDown': case 's': if (currentDir.y === 0) dirRef.current = {x: 0, y: 1}; break;
      case 'ArrowLeft': case 'a': if (currentDir.x === 0) dirRef.current = {x: -1, y: 0}; break;
      case 'ArrowRight': case 'd': if (currentDir.x === 0) dirRef.current = {x: 1, y: 0}; break;
    }
  }, [gameStarted, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const currentDir = dirRef.current;
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Collision with walls
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }
        
        // Collision with self
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];
        
        // Eat food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          });
        } else {
          newSnake.pop();
        }
        
        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, 70);
    return () => clearInterval(intervalId);
  }, [gameStarted, gameOver, food]);

  // Music Controls
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Ignore AbortError caused by rapid track switching or pausing
          if (error.name !== 'AbortError') {
            setIsPlaying(false);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#00ffff] font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden crt-overlay">
      <div className="static-noise"></div>
      
      {/* Header */}
      <header className="mb-8 text-center screen-tear z-10">
        <h1 className="text-5xl md:text-7xl font-bold glitch uppercase tracking-widest" data-text="NEON_SERPENT.EXE">
          NEON_SERPENT.EXE
        </h1>
        <p className="text-[#ff00ff] mt-2 text-sm md:text-base tracking-widest">
          [ SYS_STATE: {gameOver ? 'ERR_CRITICAL_FAILURE' : gameStarted ? 'EXECUTION_ACTIVE' : 'AWAITING_SIGNAL'} ]
        </p>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 items-start z-10">
        
        {/* Game Board */}
        <div className="relative border-4 border-[#ff00ff] p-1 bg-[#0a0a0a] shadow-[0_0_20px_rgba(255,0,255,0.3)]">
          <div 
            className="grid bg-[#050505]" 
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: 'min(80vw, 400px)',
              height: 'min(80vw, 400px)'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
              const isSnake = snakeIndex !== -1;
              const isHead = snakeIndex === 0;
              const isFood = food.x === x && food.y === y;
              
              const tailIntensity = isSnake && !isHead ? Math.max(0.15, 1 - (snakeIndex / snake.length)) : 0;

              return (
                <div 
                  key={i} 
                  className={`w-full h-full border-[0.5px] border-[#00ffff]/10 flex items-center justify-center transition-all duration-75 ${
                    isHead ? 'bg-[#00ffff]/20 shadow-[0_0_15px_#00ffff] z-10' :
                    isFood ? 'bg-[#ff00ff]/20 shadow-[0_0_15px_#ff00ff] animate-pulse z-10' : ''
                  }`}
                  style={{
                    ...(isSnake && !isHead ? {
                      backgroundColor: `rgba(0, 255, 255, ${tailIntensity * 0.8})`,
                      boxShadow: `0 0 ${15 * tailIntensity}px rgba(0, 255, 255, ${tailIntensity})`,
                      zIndex: 5
                    } : {})
                  }}
                >
                  {isHead && <Cpu size="80%" className="text-[#00ffff] drop-shadow-[0_0_8px_#00ffff]" />}
                  {isFood && <Zap size="80%" className="text-[#ff00ff] drop-shadow-[0_0_8px_#ff00ff]" />}
                </div>
              );
            })}
          </div>

          {/* Overlays */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
              <p className="text-[#ff00ff] animate-pulse text-xl text-center">AWAITING_EXECUTION_SIGNAL // [SPACE]</p>
            </div>
          )}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
              <h2 className="text-6xl md:text-8xl text-[#ff00ff] font-bold mb-4 glitch tracking-widest" data-text="KERNEL_PANIC">KERNEL_PANIC</h2>
              <p className="text-2xl mb-4">DATA_HARVESTED: 0x{score.toString(16).toUpperCase().padStart(4, '0')}</p>
              <p className="text-[#00ffff] animate-pulse text-center text-xl">INITIATE_REBOOT_SEQUENCE // [SPACE]</p>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-6 w-full lg:w-80 z-10">
          {/* Score Panel */}
          <div className="border-2 border-[#00ffff] p-4 bg-[#0a0a0a] shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <div className="flex items-center gap-2 mb-2 text-[#ff00ff]">
              <Terminal size={18} />
              <h3 className="text-lg tracking-widest">SECTOR_ALLOCATION</h3>
            </div>
            <div className="text-5xl font-bold text-[#00ffff] glitch" data-text={`0x${score.toString(16).toUpperCase().padStart(4, '0')}`}>
              0x{score.toString(16).toUpperCase().padStart(4, '0')}
            </div>
          </div>

          {/* Music Player */}
          <div className="border-2 border-[#ff00ff] p-4 bg-[#0a0a0a] shadow-[0_0_15px_rgba(255,0,255,0.2)]">
            <div className="flex items-center gap-2 mb-4 text-[#00ffff]">
              <Volume2 size={18} />
              <h3 className="text-lg tracking-widest">AUDIO_PROCESSOR</h3>
            </div>
            
            <div className="mb-4 p-2 bg-[#050505] border border-[#00ffff]/30 overflow-hidden">
              <p className="text-xs text-[#ff00ff] mb-1">ACTIVE_WAVEFORM:</p>
              <p className="text-sm truncate animate-pulse">{TRACKS[currentTrack].title}</p>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={prevTrack} className="p-2 hover:bg-[#ff00ff]/20 text-[#ff00ff] transition-colors border border-transparent hover:border-[#ff00ff] cursor-pointer">
                <SkipBack size={24} />
              </button>
              <button onClick={togglePlay} className="p-3 bg-[#00ffff]/10 hover:bg-[#00ffff]/30 text-[#00ffff] transition-colors border border-[#00ffff] cursor-pointer">
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button onClick={nextTrack} className="p-2 hover:bg-[#ff00ff]/20 text-[#ff00ff] transition-colors border border-transparent hover:border-[#ff00ff] cursor-pointer">
                <SkipForward size={24} />
              </button>
            </div>

            {/* Hidden Audio Element */}
            <audio 
              ref={audioRef} 
              src={TRACKS[currentTrack].url} 
              onEnded={nextTrack}
              crossOrigin="anonymous"
            />
          </div>

          {/* Hex Dump Terminal */}
          <div className="border-2 border-[#00ffff]/50 p-2 bg-[#050505] h-32 overflow-hidden opacity-70">
            {hexDump.map((row, i) => (
              <div key={i} className="text-[10px] text-[#ff00ff] leading-tight opacity-80">
                {row}
              </div>
            ))}
          </div>
          
          {/* Instructions */}
          <div className="text-xs text-[#00ffff]/60 mt-2 space-y-2 border-l-2 border-[#ff00ff] pl-4">
            <p>&gt; OVERRIDE_NAV_CONTROLS: W,A,S,D</p>
            <p>&gt; WARNING: BOUNDARY_COLLISION_FATAL</p>
            <p>&gt; DIRECTIVE: ASSIMILATE_MAGENTA_PACKETS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
