import React from 'react';
import { NewsItem } from '../types';
import { Bookmark, LogIn, Loader2 } from 'lucide-react';
import { NewsCard } from './NewsCard';

interface SavedScreenProps {
  savedNews: NewsItem[];
  onSelectNews: (news: NewsItem) => void;
  onPlayVoice: (news: NewsItem, e: React.MouseEvent) => void;
  onToggleSave: (newsId: string, e: React.MouseEvent) => void;
  onShare: (news: NewsItem, e: React.MouseEvent) => void;
  onExploreNews: () => void;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  isLoading?: boolean;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  savedNews,
  onSelectNews,
  onPlayVoice,
  onToggleSave,
  onShare,
  onExploreNews,
  isAuthenticated = false,
  onOpenAuthModal,
  isLoading = false,
}) => {
  return (
    <div role="region" aria-label="సేవ్ చేసుకున్న వార్తలు (Saved News)" className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-12 px-3 sm:px-4 pt-4">
      <div className="flex items-center justify-between px-1 mb-3">
        <h1 className="text-base font-black text-neutral-900 telugu-heading flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-[#E41E26] fill-[#E41E26]" />
          <span>సేవ్ చేసుకున్న వార్తలు</span>
          {isAuthenticated && (
            <span className="text-xs bg-red-100 text-[#E41E26] font-bold px-2 py-0.5 rounded-full">
              {savedNews.length}
            </span>
          )}
        </h1>
      </div>

      {!isAuthenticated ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200/90 shadow-2xs mt-4 space-y-3 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-red-50 text-[#E41E26] flex items-center justify-center mx-auto mb-1">
            <Bookmark className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 telugu-heading">
            సేవ్ చేసిన వార్తలను చూడటానికి లాగిన్ అవ్వండి
          </h2>
          <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
            మీకు నచ్చిన వార్తలను తర్వాత చదవడానికి బుక్‌మార్క్ చేయండి. మీ ఖాతాలోకి లాగిన్ అయితే మీ బుక్‌మార్క్‌లు ఎల్లప్పుడూ భద్రంగా ఉంటాయి.
          </p>
          {onOpenAuthModal && (
            <button
              id="saved-screen-login-btn"
              onClick={onOpenAuthModal}
              aria-label="లాగిన్ లేదా సైన్ అప్ అవ్వండి (Login or Sign Up)"
              className="mt-2 px-5 py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 mx-auto focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>లాగిన్ / సైన్ అప్ (Sign In)</span>
            </button>
          )}
        </div>
      ) : isLoading ? (
        <div role="status" aria-live="polite" className="bg-white rounded-2xl p-12 text-center border border-neutral-200 shadow-2xs mt-4 flex flex-col items-center justify-center gap-2 text-neutral-600 text-xs max-w-lg mx-auto">
          <Loader2 className="w-6 h-6 animate-spin text-[#E41E26]" />
          <span>బుక్‌మార్క్‌లను లోడ్ చేస్తోంది...</span>
        </div>
      ) : savedNews.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-2xs mt-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 telugu-heading">
            ఇంకా ఏ వార్తలను సేవ్ చేయలేదు
          </h2>
          <p className="text-xs text-neutral-600 mt-1 max-w-xs mx-auto">
            మీకు నచ్చిన వార్తలను తర్వాత చదవడానికి బుక్‌మార్క్ చిహ్నాన్ని నొక్కండి.
          </p>
          <button
            onClick={onExploreNews}
            aria-label="తాజా వార్తలను చూడండి (Explore Breaking News)"
            className="mt-4 px-4 py-2 bg-[#E41E26] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#B71C1C] transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
          >
            తాజా వార్తలను చూడండి
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {savedNews.map((news) => (
            <NewsCard
              key={news.id}
              news={news}
              onSelectNews={onSelectNews}
              onPlayVoice={onPlayVoice}
              isSaved={true}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </div>
  );
};
