/**
 * @file LanguageSelectionScreen.tsx
 * @description First-time and on-demand App Language Selection Screen.
 * Uses Rachabanda red branding with bilingual/trilingual labels.
 */

import React, { useState } from 'react';
import { Globe, Check, ArrowRight, X } from 'lucide-react';
import { useAppLanguage, AppLanguage, SUPPORTED_LANGUAGES } from '../i18n';

interface LanguageSelectionScreenProps {
  isModal?: boolean;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({ isModal = false }) => {
  const { language, setLanguage, isSelectingLanguage, closeLanguageSelection, hasSelectedLanguage } = useAppLanguage();
  const [selected, setSelected] = useState<AppLanguage>(language || 'te');

  if (!isSelectingLanguage) return null;

  const handleConfirm = () => {
    setLanguage(selected);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-screen-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Top Header Ribbon with Rachabanda Red branding */}
        <div className="bg-[#E41E26] text-white px-6 py-6 text-center relative">
          {hasSelectedLanguage && (
            <button
              onClick={closeLanguageSelection}
              aria-label="మూసివేయండి (Close language dialog)"
              className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Globe className="w-6 h-6 text-yellow-300" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-black tracking-wider leading-tight telugu-heading">
            రచ్చ బండ
          </h1>
          <p className="text-[11px] text-white/85 font-medium tracking-widest uppercase mt-0.5">
            RACHABANDA • VOICE OF THE PEOPLE
          </p>
        </div>

        {/* Trilingual Subtitle Prompts */}
        <div className="px-6 pt-5 pb-2 text-center border-b border-neutral-100 bg-neutral-50/50">
          <h2 id="lang-screen-title" className="text-base font-bold text-neutral-900 leading-snug">
            Choose your app language
          </h2>
          <p className="text-sm font-bold text-neutral-800 telugu-heading mt-0.5">
            మీ యాప్ భాషను ఎంచుకోండి
          </p>
          <p className="text-xs text-neutral-600 mt-0.5">
            ऐप की भाषा चुनें
          </p>
        </div>

        {/* Language Selection Radio Options */}
        <div className="p-6 space-y-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isChosen = selected === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={isChosen}
                onClick={() => setSelected(lang.code)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                  isChosen
                    ? 'border-[#E41E26] bg-red-50/60 shadow-xs ring-1 ring-[#E41E26]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isChosen ? 'border-[#E41E26] bg-[#E41E26]' : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {isChosen && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-base font-black text-neutral-900 telugu-heading">
                      {lang.nativeLabel}
                    </div>
                    <div className="text-xs text-neutral-500 font-medium">
                      {lang.englishLabel}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isChosen
                      ? 'bg-[#E41E26] text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Confirmation Button */}
        <div className="px-6 pb-6 pt-1">
          <button
            type="button"
            id="lang-continue-btn"
            onClick={handleConfirm}
            aria-label="కొనసాగించండి (Continue)"
            className="w-full py-3.5 bg-[#E41E26] hover:bg-[#B71C1C] active:scale-[0.99] text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <span>
              {selected === 'en'
                ? 'Continue'
                : selected === 'hi'
                ? 'आगे बढ़ें / Continue'
                : 'కొనసాగించండి / Continue'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-center text-neutral-400 mt-2.5">
            You can change this later anytime in Profile / ప్రొఫైల్‌లో ఎప్పుడైనా మార్చుకోవచ్చు.
          </p>
        </div>
      </div>
    </div>
  );
};
