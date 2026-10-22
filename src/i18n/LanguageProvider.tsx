import React, { createContext, useContext, useEffect, useState } from 'react';
import enDict from './en.json';
import urDict from './ur.json';
import { PreferredLanguage } from '../types/database';

interface LanguageContextType {
  language: PreferredLanguage;
  setLanguage: (lang: PreferredLanguage) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (keyPath: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<PreferredLanguage>(() => {
    const saved = localStorage.getItem('arts_lang');
    return saved === 'ur' ? 'ur' : 'en';
  });

  const isRTL = language === 'ur';

  const setLanguage = (lang: PreferredLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('arts_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (keyPath: string, fallback?: string): string => {
    const dict = language === 'ur' ? urDict : enDict;
    const parts = keyPath.split('.');
    let cur: any = dict;

    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in cur) {
        cur = cur[part];
      } else {
        cur = undefined;
        break;
      }
    }

    if (typeof cur === 'string') return cur;

    // Fallback to English if Urdu key is missing
    if (language === 'ur') {
      let enCur: any = enDict;
      for (const part of parts) {
        if (enCur && typeof enCur === 'object' && part in enCur) {
          enCur = enCur[part];
        } else {
          enCur = undefined;
          break;
        }
      }
      if (typeof enCur === 'string') return enCur;
    }

    return fallback ?? keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
