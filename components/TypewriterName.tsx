import React, { useState, useEffect } from 'react';

const FULL_NAME = "SHRIJAN PAUDEL";
const TYPING_SPEED = 100; // ms per character

export const TypewriterName: React.FC = () => {
  const [text, setText] = useState('');
  const [glow, setGlow] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const runSequence = async () => {
      // 1. Initial Typing (Once)
      for (let i = 0; i <= FULL_NAME.length; i++) {
        if (!isMounted) return;
        setText(FULL_NAME.slice(0, i));
        await new Promise(r => setTimeout(r, TYPING_SPEED));
      }

      // 2. Pause 0.6s before starting the glow loop
      await new Promise(r => setTimeout(r, 600));
      
      // Hide cursor after typing is done to clean up the look for the glow loop
      if (isMounted) setShowCursor(false);

      // 3. Infinite Glow Loop
      while (isMounted) {
        setGlow(true);
        
        // Calculate glow sequence duration
        // (14 chars * 0.1s stagger) + 1.5s animation duration = ~2.9s
        const glowDuration = (FULL_NAME.length * 100) + 1500;
        
        // Wait for glow to finish
        await new Promise(r => setTimeout(r, glowDuration));
        
        if (!isMounted) return;
        setGlow(false); // Reset animation class so it can be re-triggered

        // 4. Wait 4 seconds before next loop
        await new Promise(r => setTimeout(r, 4000));
      }
    };

    runSequence();

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex justify-end select-none pointer-events-none mt-1">
      <div className="relative font-mono font-bold tracking-widest text-[10px] sm:text-xs text-right whitespace-pre min-h-[16px]">
        {FULL_NAME.split('').map((char, i) => (
           <span
             key={i}
             className={`inline-block transition-colors duration-300 ${i < text.length ? 'opacity-100' : 'opacity-0'} ${glow ? 'animate-popglow' : 'text-slate-600'}`}
             style={{ 
               animationDelay: glow ? `${i * 0.1}s` : '0s'
             }}
           >
             {char}
           </span>
        ))}
        {/* Blinking Cursor - fades out after typing */}
        <span className={`inline-block w-1 h-3 bg-indigo-500 ml-0.5 align-middle transition-opacity duration-500 ${showCursor ? 'animate-pulse opacity-100' : 'opacity-0'}`}></span>
      </div>
    </div>
  );
};