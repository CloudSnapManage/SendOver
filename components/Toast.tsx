import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { Notification } from '../types';

interface ToastProps {
  notification: Notification | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for animation to finish before clearing data
        setTimeout(onDismiss, 300); 
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification && !isVisible) return null;

  const styles = {
    info: 'bg-slate-800 border-slate-700 text-slate-200',
    success: 'bg-green-900/90 border-green-800 text-green-100',
    warning: 'bg-yellow-900/90 border-yellow-800 text-yellow-100',
    error: 'bg-red-900/90 border-red-800 text-red-100'
  };

  const icons = {
    info: <Info size={18} className="text-indigo-400" />,
    success: <CheckCircle size={18} className="text-green-400" />,
    warning: <AlertCircle size={18} className="text-yellow-400" />,
    error: <XCircle size={18} className="text-red-400" />
  };

  // Safe fallback if notification is null but isVisible is true (during exit animation)
  const currentType = notification?.type || 'info';
  const currentMessage = notification?.message || '';

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
    }`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-sm w-full md:w-auto min-w-[300px] ${styles[currentType]}`}>
        <div className="shrink-0">
          {icons[currentType]}
        </div>
        <p className="text-sm font-medium flex-1 mr-2">{currentMessage}</p>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-70 hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};