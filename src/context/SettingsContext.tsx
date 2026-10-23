import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettingsMap } from '../types/database';
import { settingsService } from '../services/settingsService';
import { DEMO_SETTINGS } from '../demo/demoData';

interface SettingsContextType {
  settings: StoreSettingsMap;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<StoreSettingsMap>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettingsMap>(DEMO_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const fetched = await settingsService.getSettings();
      if (fetched && Object.keys(fetched).length > 0) {
        setSettings((prev) => ({ ...prev, ...fetched }));
      }
    } catch (e) {
      console.warn('Could not load remote settings, using current defaults:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettingsMap>) => {
    // Await authoritative persistence before updating local React state
    const saved = await settingsService.updateSettings(newSettings);
    setSettings((prev) => ({ ...prev, ...saved }));
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
