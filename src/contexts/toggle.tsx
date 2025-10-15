'use client';
// contexts/toggle.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ToggleContextType {
  isToggled: boolean;
  toggle: () => void;
  isLoaded: boolean; // Add this to track loading state
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

export const useToggle = (): ToggleContextType => {

  const context = useContext(ToggleContext);
  if (!context) {
    throw new Error('useToggle must be used within a ToggleProvider');
  }
  return context;
};

interface ToggleProviderProps {
  children: ReactNode;
}

export const ToggleProvider = ({ children }: ToggleProviderProps) => {
  const [isToggled, setIsToggled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    const savedState = localStorage.getItem('toggleState');
    if (savedState !== null) {
      try {
        setIsToggled(JSON.parse(savedState));
      } catch (error) {
        console.warn('Failed to parse toggle state:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('toggleState', JSON.stringify(isToggled));
    }
  }, [isToggled, isLoaded]);

  const toggle = () => {
    setIsToggled(prev => !prev);
  };

  const contextValue = {
    isToggled,
    toggle,
    isLoaded
  };

  return (
    <ToggleContext.Provider value={contextValue}>
      {children}
    </ToggleContext.Provider>
  );
};