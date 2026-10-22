import React, { createContext, useContext, useState } from 'react';
import { StoreSettingsMap } from '../types/database';
import { settingsService } from '../services/settingsService';

interface SettingsContextType {
  settings: StoreSettingsMap;
  updateSettings: (newSettings: Partial<StoreSettingsMap>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettingsMap>(() => {
    try {
      const saved = localStorage.getItem('arts_apparel_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      store_name: 'ARTS APPAREL',
      tagline_en: 'Sharp Tailoring, Locked On Target',
      tagline_ur: 'شاندار سلائی، مکمل معیار',
      whatsapp_number: '923058165623',
      phone_number: '0305 8165623',
      email: 'artsapparel@gmail.com',
      address: 'Club Road, Near New Cafe Sajawal, Sadiqabad, Pakistan',
      tiktok_url: 'https://tiktok.com/@artsapparel3',
      facebook_url: 'https://www.facebook.com/people/ARTS-Apparel/61583782181056/',
      instagram_url: '',
      announcement_en: 'FREE nationwide delivery on all orders above Rs. 10,000 | Cash on Delivery available across Pakistan',
      announcement_ur: '10,000 روپے سے زائد کے آرڈرز پر مفت ڈیلیوری | پورے پاکستان میں کیش آن ڈیلیوری کی سہولت',
      currency: 'PKR',
      cod_enabled: true,
      jazzcash_enabled: true,
      easypaisa_enabled: true,
      bank_transfer_enabled: true,
      card_enabled: false,
      jazzcash_account: {
        title: 'ARTS APPAREL SADIQABAD',
        number: '03058165623',
      },
      easypaisa_account: {
        title: 'ARTS APPAREL OFFICIAL',
        number: '03058165623',
      },
      bank_account: {
        bank_name: 'Meezan Bank Limited',
        account_title: 'ARTS APPAREL RETAIL',
        account_number: '01020304050607',
        iban: 'PK12MEZN0001020304050607',
      },
      default_delivery_charge: 250,
      free_delivery_threshold: 10000,
      low_stock_threshold: 5,
      return_window_days: 7,
    };
  });

  const updateSettings = (newSettings: Partial<StoreSettingsMap>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      settingsService.updateSettings(newSettings);
      return merged;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
