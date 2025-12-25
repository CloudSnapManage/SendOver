import React, { useEffect, useRef, useState } from 'react';

const TRAIL_LENGTH = 12;

export const Cursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Use refs for mutable state to avoid re-renders during animation
  // Initialize off-screen
  const trailPos = useRef(Array(TRAIL_LENGTH).fill({ x: -100, y: -100 }));
  const mouse = useRef({ x: -100, y: -100 });
  const isStarted = useRef(false);

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;
    
    setIsVisible(true);
    document.body.classList.add('custom-cursor-active');

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      
      // CRITICAL: Update main cursor immediately in the event listener
      // This removes the 1-frame delay caused by requestAnimationFrame,
      // making the cursor feel "glued" to the mouse.
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Snap trail to mouse on initial entry to prevent flying in from corner
      if (!isStarted.current) {
        isStarted.current = true;
        trailPos.current.fill({ x: e.clientX, y: e.clientY });
      }
    };

    const onMouseDown = () => {
        if (cursorRef.current) {
            cursorRef.current.classList.add('scale-75');
            cursorRef.current.classList.remove('scale-100');
        }
    };

    const onMouseUp = () => {
        if (cursorRef.current) {
            cursorRef.current.classList.remove('scale-75');
            cursorRef.current.classList.add('scale-100');
        }
    };
    
    // Interaction states
    const onMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInteractive = target.matches('button, a, input, [role="button"], .cursor-pointer, select, textarea');
        
        if (isInteractive && cursorRef.current) {
            cursorRef.current.classList.add('bg-cyan-400', 'ring-2', 'ring-cyan-300', 'ring-opacity-50');
            cursorRef.current.classList.remove('bg-white');
        }
    };

    const onMouseOut = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInteractive = target.matches('button, a, input, [role="button"], .cursor-pointer, select, textarea');
        
        if (isInteractive && cursorRef.current) {
            cursorRef.current.classList.remove('bg-cyan-400', 'ring-2', 'ring-cyan-300', 'ring-opacity-50');
            cursorRef.current.classList.add('bg-white');
        }
    };

    // Use passive listener for performance
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    
    let animationFrameId: number;
    
    const animate = () => {
      // We only animate the trail in the loop. 
      // The main cursor is handled in onMouseMove for zero latency.

      // Physics constants
      // Higher stiffness = tighter trail (less lag)
      // Damping = smoothness
      
      trailPos.current.forEach((pos, i) => {
        const node = trailRefs.current[i];
        if (!node) return;
        
        // The first dot follows the mouse coordinates directly
        // Subsequent dots follow the previous dot's coordinates
        const targetX = i === 0 ? mouse.current.x : trailPos.current[i - 1].x;
        const targetY = i === 0 ? mouse.current.y : trailPos.current[i - 1].y;
        
        // Smooth interpolation (LERP)
        // 0.45 is a sweet spot for "smooth but responsive"
        const speed = 0.45; 
        
        const nextX = pos.x + (targetX - pos.x) * speed;
        const nextY = pos.y + (targetY - pos.y) * speed;
        
        trailPos.current[i] = { x: nextX, y: nextY };
        
        // Taper scale from 1 down to 0
        const scale = Math.max(0, 1 - (i / TRAIL_LENGTH));
        
        node.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${scale})`;
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Trail Dots - Rendered first to be behind the main cursor */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={el => { trailRefs.current[i] = el; }}
          // Smaller size (1.5 = 6px) for a sleeker look
          className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-50 opacity-60 mix-blend-screen will-change-transform"
          style={{
            // Gradient from Cyan (180) -> Purple (270) -> Pink (300)
            backgroundColor: `hsl(${180 + (i * (120 / TRAIL_LENGTH))}, 100%, 60%)`,
            marginLeft: '-3px', // Center alignment
            marginTop: '-3px'
          }}
        />
      ))}
      
      {/* Main Cursor Dot */}
      <div
        ref={cursorRef}
        // Slightly larger than trail (2.5 = 10px)
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-white rounded-full pointer-events-none z-50 transition-colors duration-100 shadow-[0_0_8px_rgba(255,255,255,0.8)] will-change-transform"
        style={{
             marginLeft: '-5px',
             marginTop: '-5px'
        }}
      />
    </>
  );
};