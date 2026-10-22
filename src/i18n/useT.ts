import { useLanguage } from './LanguageProvider';

export function useT() {
  const { t, language, isRTL } = useLanguage();
  return { t, language, isRTL };
}
