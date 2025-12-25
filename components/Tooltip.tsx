import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      <div 
        className={`
          absolute left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 
          bg-slate-900 text-slate-200 text-xs font-medium rounded-lg 
          border border-slate-700 shadow-xl pointer-events-none whitespace-nowrap
          transition-all duration-200 ease-out origin-center
          ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          ${isVisible 
            ? 'opacity-100 transform scale-100 translate-y-0' 
            : `opacity-0 transform scale-95 ${position === 'top' ? 'translate-y-2' : '-translate-y-2'}`
          }
        `}
      >
        {content}
        {/* Tiny arrow */}
        <div 
          className={`
            absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-slate-700 transform rotate-45
            ${position === 'top' ? 'bottom-[-5px] border-b border-r' : 'top-[-5px] border-t border-l'}
          `}
        />
      </div>
    </div>
  );
};