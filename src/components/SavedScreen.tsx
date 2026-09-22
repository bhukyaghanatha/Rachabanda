import React from 'react';
import { NewsItem } from '../types';
import { Bookmark, ArrowRight, Trash2 } from 'lucide-react';
import { NewsCard } from './NewsCard';

interface SavedScreenProps {
  savedNews: NewsItem[];
  onSelectNews: (news: NewsItem) => void;
  onPlayVoice: (news: NewsItem, e: React.MouseEvent) => void;
  onToggleSave: (newsId: string, e: React.MouseEvent) => void;
  onShare: (news: NewsItem, e: React.MouseEvent) => void;
  onExploreNews: () => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  savedNews,
  onSelectNews,
  onPlayVoice,
  onToggleSave,
  onShare,
  onExploreNews,
}) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 px-3 pt-3">
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-base font-black text-neutral-900 telugu-heading flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-[#E41E26] fill-[#E41E26]" />
          సేవ్ చేసుకున్న వార్తలు ({savedNews.length})
        </h2>
      </div>

      {savedNews.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-2xs mt-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-[#E41E26] flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 telugu-heading">
            ఇంకా ఏ వార్తలను సేవ్ చేయలేదు
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            మీకు నచ్చిన వార్తలను తర్వాత చదవడానికి బుక్‌మార్క్ చిహ్నాన్ని నొక్కండి.
          </p>
          <button
            onClick={onExploreNews}
            className="mt-4 px-4 py-2 bg-[#E41E26] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#B71C1C] transition-colors"
          >
            తాజా వార్తలను చూడండి
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
