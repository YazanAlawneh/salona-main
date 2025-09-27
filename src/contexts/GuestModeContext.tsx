import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GuestModeContextType {
  isGuestMode: boolean;
  setGuestMode: (isGuest: boolean) => void;
  exitGuestMode: () => void;
  exitToLogin: () => void;
  exitToSignup: () => void;
  targetScreen: 'login' | 'signup' | null;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export const GuestModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [targetScreen, setTargetScreen] = useState<'login' | 'signup' | null>(null);

  const setGuestMode = (isGuest: boolean) => {
    setIsGuestMode(isGuest);
    if (isGuest) {
      setTargetScreen(null); // Reset target screen when entering guest mode
    }
  };

  const exitGuestMode = () => {
    setIsGuestMode(false);
    setTargetScreen(null);
  };

  const exitToLogin = () => {
    setIsGuestMode(false);
    setTargetScreen('login');
  };

  const exitToSignup = () => {
    setIsGuestMode(false);
    setTargetScreen('signup');
  };

  const value = {
    isGuestMode,
    setGuestMode,
    exitGuestMode,
    exitToLogin,
    exitToSignup,
    targetScreen,
  };

  return (
    <GuestModeContext.Provider value={value}>
      {children}
    </GuestModeContext.Provider>
  );
};

export const useGuestMode = () => {
  const context = useContext(GuestModeContext);
  if (!context) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
};
