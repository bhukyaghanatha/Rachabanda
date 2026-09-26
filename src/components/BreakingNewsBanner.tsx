import React from 'react';
import { NewsItem } from '../types';
import { ChevronRight, Volume2 } from 'lucide-react';

interface BreakingNewsBannerProps {
  news?: NewsItem;
  onSelectNews: (news: NewsItem) => void;
  onPlayVoice: (news: NewsItem, e: React.MouseEvent) => void;
  onViewAllBreaking?: () => void;
}

export const BreakingNewsBanner: React.FC<BreakingNewsBannerProps> = ({
  news,
  onSelectNews,
  onPlayVoice,
  onViewAllBreaking,
}) => {
  if (!news) return null;

  return (
    <div className="px-3 pt-3 pb-1 bg-[#F8F9FA]">
      {/* Header with red pulse & 'మరిన్ని >' */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E41E26] animate-pulse" />
          <span className="text-xs font-black tracking-wider text-[#E41E26] uppercase">
            BREAKING NEWS
          </span>
        </div>
        <button
          onClick={onViewAllBreaking}
          aria-label="మరిన్ని బ్రేకింగ్ వార్తలు చూడండి"
          className="text-xs font-semibold text-neutral-600 hover:text-[#E41E26] flex items-center gap-0.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] rounded-sm"
        >
          <span>మరిన్ని</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Breaking News Card */}
      <div
        id={`breaking-card-${news.id}`}
        role="article"
        tabIndex={0}
        onClick={() => onSelectNews(news)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectNews(news);
          }
        }}
        className="bg-white rounded-xl overflow-hidden border border-neutral-200/80 shadow-xs cursor-pointer hover:shadow-md transition-all active:scale-[0.99] flex flex-col sm:flex-row focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
      >
        <div className="relative sm:w-2/5 h-44 sm:h-auto overflow-hidden">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 bg-[#E41E26] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            {news.location}
          </div>
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
            {news.timeAgo}
          </div>
        </div>

        <div className="p-3.5 sm:w-3/5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 leading-snug line-clamp-2 telugu-heading">
              {news.title}
            </h3>
            <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
              {news.shortSummary}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium">
              <span>👤 {news.reporterName}</span>
            </div>

            {/* Audio pill button as shown in the design ("▶ వినండి") */}
            <button
              id={`listen-breaking-${news.id}`}
              onClick={(e) => onPlayVoice(news, e)}
              aria-label={`వాయిస్ బులెటిన్ వినండి: ${news.title}`}
              className="flex items-center gap-1.5 bg-red-50 text-[#E41E26] hover:bg-[#E41E26] hover:text-white px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>వినండి</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
