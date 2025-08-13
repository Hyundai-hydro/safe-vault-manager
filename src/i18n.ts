import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pl: {
    translation: {
      settings: {
        open: 'Ustawienia',
        title: 'Ustawienia aplikacji',
        language: 'Język',
        uiLanguage: 'Język interfejsu',
        chooseLanguage: 'Wybierz język',
      },
      common: {
        close: 'Zamknij',
      },
      theme: {
        light: 'Jasny',
        dark: 'Ciemny',
        forest: 'Leśny',
      },
      languages: {
        pl: 'Polski',
        en: 'English',
        de: 'Deutsch',
      },
    },
  },
  en: {
    translation: {
      settings: {
        open: 'Settings',
        title: 'App Settings',
        language: 'Language',
        uiLanguage: 'Interface language',
        chooseLanguage: 'Choose language',
      },
      common: {
        close: 'Close',
      },
      theme: {
        light: 'Light',
        dark: 'Dark',
        forest: 'Forest',
      },
      languages: {
        pl: 'Polish',
        en: 'English',
        de: 'German',
      },
    },
  },
  de: {
    translation: {
      settings: {
        open: 'Einstellungen',
        title: 'App-Einstellungen',
        language: 'Sprache',
        uiLanguage: 'Oberflächensprache',
        chooseLanguage: 'Sprache wählen',
      },
      common: {
        close: 'Schließen',
      },
      theme: {
        light: 'Hell',
        dark: 'Dunkel',
        forest: 'Wald',
      },
      languages: {
        pl: 'Polnisch',
        en: 'Englisch',
        de: 'Deutsch',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: document.documentElement.getAttribute('lang') || 'pl',
    fallbackLng: 'pl',
    interpolation: { escapeValue: false },
  });

export default i18n;
