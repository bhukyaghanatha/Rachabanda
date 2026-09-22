import React from 'react';
import { NewsItem } from '../types';
import { Play, Heart, MessageSquare, Share2, Bookmark, CheckCircle2 } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
  onSelectNews: (news: NewsItem) => void;
  onPlayVoice: (news: NewsItem, e: React.MouseEvent) => void;
  isSaved?: boolean;
  onToggleSave?: (newsId: string, e: React.MouseEvent) => void;
  onShare?: (news: NewsItem, e: React.MouseEvent) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  news,
  onSelectNews,
  onPlayVoice,
  isSaved = false,
  onToggleSave,
  onShare,
}) => {
  return (
    <article
      id={`news-card-${news.id}`}
      onClick={() => onSelectNews(news)}
      className="bg-white rounded-xl p-3 border border-neutral-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
    >
      <div className="flex gap-3">
        {/* Left Thumbnail with Duration Badge */}
        <div className="relative w-28 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {news.factChecked && (
            <div className="absolute top-1 left-1 bg-white/90 rounded-full p-0.5 shadow-xs" title="Fact Checked">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          )}
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            {news.audioDuration}
          </span>
        </div>

        {/* Right Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2 telugu-heading">
              {news.title}
            </h4>
            <p className="mt-1 text-xs text-neutral-600 line-clamp-1">
              {news.shortSummary}
            </p>
          </div>

          {/* Location & Time tag */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 truncate font-medium">
              <span className="text-[#E41E26] font-bold">{news.location}</span>
              <span>•</span>
              <span>{news.timeAgo}</span>
            </div>

            {/* Red '▶ వినండి' button matching mockup */}
            <button
              id={`card-play-btn-${news.id}`}
              onClick={(e) => onPlayVoice(news, e)}
              className="flex items-center gap-1 bg-[#E41E26] text-white hover:bg-[#B71C1C] px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs active:scale-95 transition-transform flex-shrink-0"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>వినండి</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar (Likes, Comments, Share, Save) */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-neutral-100/70 text-xs text-neutral-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 hover:text-red-600">
            <Heart className="w-3.5 h-3.5" />
            <span>{news.likes}</span>
          </span>
          <span className="flex items-center gap-1 hover:text-blue-600">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{news.commentsCount}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={(e) => onShare(news, e)}
              className="p-1 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
              title="వాట్సాప్ లో పంపండి"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onToggleSave && (
            <button
              onClick={(e) => onToggleSave(news.id, e)}
              className={`p-1 rounded transition-colors ${
                isSaved
                  ? 'text-[#E41E26] fill-[#E41E26]'
                  : 'hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title="సేవ్ చేయండి"
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#E41E26]' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
