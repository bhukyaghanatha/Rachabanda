/**
 * @file LanguageContext.tsx
 * @description React Context and Provider for Rachabanda application language (UI i18n).
 * Independent of news language and authentication.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppLanguage, APP_LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './types';
import { te } from './translations/te';
import { en } from './translations/en';
import { hi } from './translations/hi';

const dictionaries: Record<AppLanguage, Record<string, string>> = {
  te,
  en,
  hi,
};

export interface LanguageContextType {
  language: AppLanguage;
  hasSelectedLanguage: boolean;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
  isSelectingLanguage: boolean;
  openLanguageSelection: () => void;
  closeLanguageSelection: () => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Read stored language from localStorage synchronously on initial state
  const [storedLanguage, setStoredLanguage] = useState<AppLanguage | null>(() => {
    try {
      const saved = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
      if (saved && (saved === 'te' || saved === 'en' || saved === 'hi')) {
        return saved as AppLanguage;
      }
    } catch {
      // Ignore localStorage access failures
    }
    return null;
  });

  const [isSelectingLanguage, setIsSelectingLanguage] = useState<boolean>(() => {
    // If no language stored, show first-time selection screen
    return storedLanguage === null;
  });

  // Default active language is stored language, or 'te' (Telugu default)
  const activeLanguage: AppLanguage = storedLanguage || 'te';

  const setLanguage = useCallback((newLang: AppLanguage) => {
    try {
      localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.warn('Failed to save language to localStorage:', err);
    }
    setStoredLanguage(newLang);
    setIsSelectingLanguage(false);
  }, []);

  const openLanguageSelection = useCallback(() => {
    setIsSelectingLanguage(true);
  }, []);

  const closeLanguageSelection = useCallback(() => {
    // Only allow closing if a language has already been established
    if (storedLanguage) {
      setIsSelectingLanguage(false);
    }
  }, [storedLanguage]);

  // Translation lookup function
  const t = useCallback(
    (key: string, fallback?: string): string => {
      const activeDict = dictionaries[activeLanguage];
      if (activeDict && activeDict[key]) {
        return activeDict[key];
      }

      // Fallback to Telugu
      if (dictionaries.te && dictionaries.te[key]) {
        return dictionaries.te[key];
      }

      // Fallback to English
      if (dictionaries.en && dictionaries.en[key]) {
        return dictionaries.en[key];
      }

      return fallback !== undefined ? fallback : key;
    },
    [activeLanguage]
  );

  const value: LanguageContextType = {
    language: activeLanguage,
    hasSelectedLanguage: storedLanguage !== null,
    setLanguage,
    t,
    isSelectingLanguage,
    openLanguageSelection,
    closeLanguageSelection,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useAppLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useAppLanguage must be used within a LanguageProvider');
  }
  return context;
}
