import React from 'react';
import { NewsItem } from '../types';
import { Play, Share2 } from 'lucide-react';

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
    <div role="region" aria-label="లైవ్ & వీడియో వార్తలు (Shorts & Videos)" className="min-h-screen bg-[#111111] text-white pb-24 md:pb-12 px-3 sm:px-4 pt-4">
      <div className="flex items-center justify-between px-1 mb-3">
        <h1 className="text-base font-black telugu-heading flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          లైవ్ & వీడియో వార్తలు (Shorts & Videos)
        </h1>
        <span className="text-xs text-neutral-400">తాజా అప్‌డేట్స్</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {newsList.map((item) => (
          <div
            key={item.id}
            role="article"
            tabIndex={0}
            aria-label={item.title}
            onClick={() => onSelectNews(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectNews(item);
              }
            }}
            className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-lg cursor-pointer group focus-visible:ring-2 focus-visible:ring-red-500 outline-none"
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
              <h2 className="text-sm font-bold leading-snug line-clamp-2 telugu-heading group-hover:text-red-400 transition-colors">
                {item.title}
              </h2>

              <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span>{item.timeAgo}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(item);
                  }}
                  aria-label={`${item.title} షేర్ చేయండి (Share video)`}
                  className="p-1 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white rounded-md"
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
