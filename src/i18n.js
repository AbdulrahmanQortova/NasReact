// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './locales';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

// تغيير الفونت تلقائياً عند تغيير اللغة
i18n.on('languageChanged', (lng) => {
  const root = document.documentElement;
  if (lng === 'ar') {
    root.style.fontFamily = 'var(--font-ar)';
    root.dir = 'rtl';
  } else {
    root.style.fontFamily = 'var(--font-en)';
    root.dir = 'ltr';
  }
});

export default i18n;