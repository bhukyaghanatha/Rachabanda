import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import {
  X,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Share2,
  Bookmark,
  ThumbsUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { voiceNewsService } from '../utils/audioPlayer';

interface Way2NewsFlipViewProps {
  newsList: NewsItem[];
  initialIndex?: number;
  onClose: () => void;
  onSelectDetail: (news: NewsItem) => void;
  onShare: (news: NewsItem) => void;
}

export const Way2NewsFlipView: React.FC<Way2NewsFlipViewProps> = ({
  newsList,
  initialIndex = 0,
  onClose,
  onSelectDetail,
  onShare,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isNarrating, setIsNarrating] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const currentNews = newsList[currentIndex] || newsList[0];

  useEffect(() => {
    // Read news when card changes if audio was on
    if (isNarrating && currentNews) {
      voiceNewsService.speak(
        `${currentNews.title}. ${currentNews.shortSummary}`,
        1.0,
        () => setIsNarrating(true),
        () => setIsNarrating(false)
      );
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < newsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleVoice = () => {
    if (isNarrating) {
      voiceNewsService.stop();
      setIsNarrating(false);
    } else {
      voiceNewsService.speak(
        `${currentNews.title}. ${currentNews.shortSummary}`,
        1.0,
        () => setIsNarrating(true),
        () => setIsNarrating(false)
      );
    }
  };

  const toggleLike = () => {
    setLikedMap((prev) => ({
      ...prev,
      [currentNews.id]: !prev[currentNews.id],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      {/* Top Bar with Brand & Close */}
      <div className="w-full max-w-md flex items-center justify-between px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <span className="bg-[#E41E26] text-white text-xs font-black px-2 py-0.5 rounded uppercase">
            Way2News ఫ్లిప్ రీడర్
          </span>
          <span className="text-xs text-neutral-400 font-mono">
            {currentIndex + 1} / {newsList.length}
          </span>
        </div>

        <button
          onClick={() => {
            voiceNewsService.stop();
            onClose();
          }}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Way2News Magazine Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[78vh] sm:h-[580px]">
        {/* Top Feature Image */}
        <div className="relative h-[42%] w-full bg-neutral-900 overflow-hidden">
          <img
            src={currentNews.imageUrl}
            alt={currentNews.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-[#E41E26] text-white text-xs font-bold px-2.5 py-0.5 rounded shadow">
            {currentNews.location}
          </div>
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded backdrop-blur-xs">
            {currentNews.timeAgo}
          </div>

          {/* Voice Audio Speaker Toggle on Image */}
          <button
            onClick={toggleVoice}
            className={`absolute bottom-3 right-3 p-2.5 rounded-full text-white shadow-lg active:scale-90 transition-transform ${
              isNarrating ? 'bg-[#E41E26] animate-pulse' : 'bg-black/70 hover:bg-black'
            }`}
            title="వాయిస్ న్యూస్ వినండి"
          >
            {isNarrating ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* 60-Word Way2News Content Area */}
        <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            <h2 className="text-lg font-black text-neutral-900 leading-snug telugu-heading">
              {currentNews.title}
            </h2>

            <p className="mt-2.5 text-sm text-neutral-700 leading-relaxed font-normal">
              {currentNews.shortSummary}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span>✍️ {currentNews.reporterName}</span>
              <button
                onClick={() => {
                  voiceNewsService.stop();
                  onClose();
                  onSelectDetail(currentNews);
                }}
                className="text-[#E41E26] font-bold hover:underline flex items-center gap-1"
              >
                <span>పూర్తి వార్త చదవండి</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Engagement Action Bar */}
            <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-around">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                  likedMap[currentNews.id]
                    ? 'text-red-600 bg-red-50'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${likedMap[currentNews.id] ? 'fill-red-600' : ''}`} />
                <span>{currentNews.likes + (likedMap[currentNews.id] ? 1 : 0)}</span>
              </button>

              <button
                onClick={() => onShare(currentNews)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-full"
              >
                <Share2 className="w-4 h-4" />
                <span>వాట్సాప్</span>
              </button>

              <button
                onClick={toggleVoice}
                className="flex items-center gap-1.5 text-xs font-bold text-[#E41E26] hover:bg-red-50 px-3 py-1.5 rounded-full"
              >
                <Volume2 className="w-4 h-4" />
                <span>వినండి</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Vertical Next / Prev arrows on the side */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-8 h-8 rounded-full bg-white/90 text-neutral-800 shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-white active:scale-95 transition-all"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === newsList.length - 1}
            className="w-8 h-8 rounded-full bg-white/90 text-neutral-800 shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-white active:scale-95 transition-all"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-neutral-400 text-xs mt-3 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
        పైకి/కిందికి స్వైప్ చేసి లేదా బాణపు గుర్తులను నొక్కి వార్తలు చదవండి
      </p>
    </div>
  );
};
