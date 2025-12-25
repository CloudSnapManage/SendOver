import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  delay?: number;
  baseTextColor?: string;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  delay = 0,
  baseTextColor = 'text-slate-400',
  className = ''
}) => {
  const [currentText, setCurrentText] = useState('');
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // 1. Initial Delay
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      if (!isMounted) return;

      // 2. Typing Phase
      // Increased speed: 15ms per character (was 30ms)
      for (let i = 0; i <= text.length; i++) {
        if (!isMounted) return;
        setCurrentText(text.slice(0, i));
        await new Promise(r => setTimeout(r, 15));
      }

      // 3. Glow Phase
      if (!isMounted) return;
      setGlow(true);

      // Wait for animation to finish
      // Duration = stagger (0.02s * length) + animation duration (1.5s)
      const animationDuration = (text.length * 20) + 1500;
      await new Promise(r => setTimeout(r, animationDuration));

      // 4. Static Phase
      if (!isMounted) return;
      setGlow(false); // Removes animation class, reverting to baseTextColor
    };

    run();

    return () => { isMounted = false; };
  }, [text, delay]);

  return (
    <span className={`inline-block whitespace-pre-wrap ${className}`}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-colors duration-500 ${
            i < currentText.length ? 'opacity-100' : 'opacity-0'
          } ${
            glow ? 'animate-popglow' : baseTextColor
          }`}
          style={{ 
            animationDelay: glow ? `${i * 0.02}s` : '0s'
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};