'use client';

import { useToggle } from '../contexts/toggle';
import { Sun, Moon } from 'lucide-react';

interface ToggleButtonProps {
  className?: string;
  size?: 'sm' | 'md';
}

const ToggleButton = ({ className = '', size = 'sm' }: ToggleButtonProps) => {
  const { isToggled, toggle } = useToggle();

  const sizeClasses = {
    sm: {
      button: 'w-11 h-6',
      circle: 'w-4 h-4',
      icon: 'w-2.5 h-2.5',
      translate: isToggled ? 'translate-x-6' : 'translate-x-0.5'
    },
    md: {
      button: 'w-14 h-8',
      circle: 'w-6 h-6',
      icon: 'w-3.5 h-3.5',
      translate: isToggled ? 'translate-x-6' : 'translate-x-1'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      onClick={toggle}
      className={`relative inline-flex items-center justify-center ${currentSize.button} rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isToggled 
          ? 'bg-blue-600 focus:ring-offset-gray-900' 
          : 'bg-gray-200 focus:ring-offset-white'
      } ${className}`}
      aria-pressed={isToggled}
      aria-label={`Switch to ${isToggled ? 'light' : 'dark'} mode`}
    >
      <span
        className={`inline-flex items-center justify-center ${currentSize.circle} transform rounded-full bg-white shadow-md transition-transform duration-300 ${currentSize.translate}`}
      >
        {isToggled ? (
          <Moon className={`${currentSize.icon} text-blue-600`} />
        ) : (
          <Sun className={`${currentSize.icon} text-yellow-500`} />
        )}
      </span>
    </button>
  );
};

export default ToggleButton;