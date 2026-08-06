import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import enUS from '../../../server/i18n/en-us.i18n.json';
import nlNL from '../../../server/i18n/nl-nl.i18n.json';

export type LanguageCode = 'EN' | 'NL';

export const DICTIONARIES: Record<LanguageCode, typeof enUS> = {
  EN: enUS,
  NL: nlNL,
};

const LANGUAGE_STORAGE_KEY = '@app_language';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  i18n: typeof enUS;
  t: (template: string, params: Record<string, string | number>) => string;
  getTaskName: (nameOrKey: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('EN');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'EN' || saved === 'NL') {
          setLanguageState(saved);
        }
      })
      .catch((err) => console.warn('Failed to load language setting:', err));
  }, []);

  const setLanguage = async (newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.warn('Failed to persist language setting:', err);
    }
  };

  const currentI18n = useMemo(() => DICTIONARIES[language], [language]);

  const t = useMemo(() => {
    return (template: string, params: Record<string, string | number>): string => {
      let result = template;
      for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      }
      return result;
    };
  }, []);

  const getTaskName = useMemo(() => {
    return (nameOrKey: string): string => {
      if (currentI18n.tasks && (currentI18n.tasks as Record<string, string>)[nameOrKey]) {
        return (currentI18n.tasks as Record<string, string>)[nameOrKey];
      }
      return nameOrKey;
    };
  }, [currentI18n]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      i18n: currentI18n,
      t,
      getTaskName,
    }),
    [language, currentI18n, t, getTaskName]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback if used outside Provider
    return {
      language: 'EN',
      setLanguage: async () => {},
      i18n: enUS,
      t: (template: string, params: Record<string, string | number>) => {
        let result = template;
        for (const [key, value] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        }
        return result;
      },
      getTaskName: (nameOrKey: string) => {
        if (enUS.tasks && (enUS.tasks as Record<string, string>)[nameOrKey]) {
          return (enUS.tasks as Record<string, string>)[nameOrKey];
        }
        return nameOrKey;
      },
    };
  }
  return context;
};
