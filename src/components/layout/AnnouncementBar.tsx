import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../i18n/LanguageProvider';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useSettings();
  const { language } = useLanguage();

  const text = language === 'ur' ? settings.announcement_ur : settings.announcement_en;
  if (!text) return null;

  return (
    <div className="bg-[#111111] text-neutral-300 text-xs py-2 px-4 border-b border-neutral-800 tracking-wide text-center">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <span className="w-1.5 h-1.5 bg-[#E31B23] rounded-full inline-block animate-pulse" />
        <span className="font-medium">{text}</span>
      </div>
    </div>
  );
};
