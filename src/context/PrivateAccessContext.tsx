import React, { createContext, useContext, useState, useCallback } from 'react';

const MASTER_PASSWORD = "Chango2003*";
const SESSION_KEY = "sm_digitals_access_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface PrivateAccessContextType {
  isUnlocked: boolean;
  unlock: (password: string) => boolean;
  lock: () => void;
  error: string | null;
}

const PrivateAccessContext = createContext<PrivateAccessContextType | undefined>(undefined);

export const PrivateAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { timestamp, valid } = JSON.parse(saved);
        if (valid && (Date.now() - timestamp < SESSION_DURATION)) {
          return true;
        }
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [error, setError] = useState<string | null>(null);

  const unlock = useCallback((password: string) => {
    if (password === MASTER_PASSWORD) {
      const session = {
        timestamp: Date.now(),
        valid: true
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setIsUnlocked(true);
      setError(null);
      return true;
    } else {
      setError("Contraseña incorrecta. Acceso denegado.");
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsUnlocked(false);
  }, []);

  return (
    <PrivateAccessContext.Provider value={{ isUnlocked, unlock, lock, error }}>
      {children}
    </PrivateAccessContext.Provider>
  );
};

export const usePrivateAccessContext = () => {
  const context = useContext(PrivateAccessContext);
  if (context === undefined) {
    throw new Error('usePrivateAccessContext must be used within a PrivateAccessProvider');
  }
  return context;
};
