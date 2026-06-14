// src/locales/index.js
import en from './en/translation.json';
import ar from './ar/translation.json';

export const resources = {
  en: {
    translation: en
  },
  ar: {
    translation: ar
  }
};

export const languages = [
  { code: 'en', name: 'English', dir: 'ltr', icon: '🇬🇧' },
  { code: 'ar', name: 'العربية', dir: 'rtl', icon: '🇸🇦' }
];