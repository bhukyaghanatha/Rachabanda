import React from 'react';
import { NewsItem } from '../types';
import { Play, Share2, Eye, Volume2 } from 'lucide-react';

interface VideoScreenProps {
  newsList: NewsItem[];
  onSelectNews: (news: NewsItem) => void;
  onShare: (news: NewsItem) => void;
}

export const VideoScreen: React.FC<VideoScreenProps> = ({
  newsList,
  onSelectNews,
  onShare,
}) => {
  return (
    <div className="min-h-screen bg-[#111111] text-white pb-24 px-3 pt-3">
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-base font-black telugu-heading flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          లైవ్ & వీడియో వార్తలు (Shorts & Videos)
        </h2>
        <span className="text-xs text-neutral-400">తాజా అప్‌డేట్స్</span>
      </div>

      <div className="space-y-4">
        {newsList.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onSelectNews(item)}
            className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-lg cursor-pointer group"
          >
            {/* Video Thumbnail with Play Overlay */}
            <div className="relative aspect-video w-full bg-neutral-950 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#E41E26]/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-white ml-1" />
                </div>
              </div>

              <div className="absolute top-2.5 left-2.5 bg-[#E41E26] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                {item.location}
              </div>

              <div className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-xs font-mono px-2 py-0.5 rounded">
                {item.audioDuration}
              </div>
            </div>

            {/* Video Caption & Info */}
            <div className="p-3.5">
              <h3 className="text-sm font-bold leading-snug line-clamp-2 telugu-heading group-hover:text-red-400 transition-colors">
                {item.title}
              </h3>

              <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{(index + 1) * 1.4}k వీక్షణలు</span>
                  </span>
                  <span>•</span>
                  <span>{item.timeAgo}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(item);
                  }}
                  className="p-1 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
