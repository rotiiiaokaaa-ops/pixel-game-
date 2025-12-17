import React, { useRef, useState, useEffect } from 'react';

interface JoystickProps {
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
  size?: number;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, onStop, size = 100 }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  const radius = size / 2;

  const handleStart = (clientX: number, clientY: number) => {
    setActive(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (active) {
      updatePosition(clientX, clientY);
    }
  };

  const handleEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onStop();
    touchId.current = null;
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const centerX = rect.left + radius;
    const centerY = rect.top + radius;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    let x = deltaX;
    let y = deltaY;

    if (distance > radius) {
      const angle = Math.atan2(deltaY, deltaX);
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    }

    setPosition({ x, y });
    
    // Normalize output -1 to 1
    onMove(x / radius, y / radius);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-full bg-black/30 border-2 border-white/20 backdrop-blur-sm touch-none"
      style={{ width: size, height: size }}
      onTouchStart={(e) => {
        touchId.current = e.changedTouches[0].identifier;
        handleStart(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }}
      onTouchMove={(e) => {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
        if (touch) handleMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(e) => {
         const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
         if(touch) handleEnd();
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
    >
      <div
        ref={knobRef}
        className="absolute bg-white/50 rounded-full shadow-lg pointer-events-none transition-transform duration-75"
        style={{
          width: size / 2,
          height: size / 2,
          left: '25%',
          top: '25%',
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
      />
    </div>
  );
};

export default Joystick;