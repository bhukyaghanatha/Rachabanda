/**
 * @file types.ts
 * @description Internationalization (i18n) types for Rachabanda application language.
 */

export type AppLanguage = 'en' | 'te' | 'hi';

export interface LanguageOption {
  code: AppLanguage;
  nativeLabel: string;
  englishLabel: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', englishLabel: 'English' },
  { code: 'te', nativeLabel: 'తెలుగు', englishLabel: 'Telugu' },
  { code: 'hi', nativeLabel: 'हिंदी', englishLabel: 'Hindi' },
];

export const APP_LANGUAGE_STORAGE_KEY = 'rachabanda_app_language';
