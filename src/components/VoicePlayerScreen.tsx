import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NewsItem } from '../types';
import { voiceNewsService } from '../utils/audioPlayer';
import { ArrowLeft, Play, Pause, Share2, Radio, Volume2, Home } from 'lucide-react';

interface VoicePlayerScreenProps {
  news?: NewsItem;
  newsList?: NewsItem[];
  onBack?: () => void;
  onShare?: (news: NewsItem, e?: React.MouseEvent) => void;
}

export const VoicePlayerScreen: React.FC<VoicePlayerScreenProps> = ({
  news: directNews,
  newsList = [],
  onBack,
  onShare,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const news =
    directNews ||
    (id ? newsList.find((n) => n.id === id) : null) ||
    newsList.find((n) => n.isBreaking) ||
    newsList[0];

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Stop audio when component unmounts or news changes
    return () => {
      voiceNewsService.stop();
    };
  }, [news?.id]);

  if (!news) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-lg font-bold telugu-heading">
          వాయిస్ వార్త కనుగొనబడలేదు
        </h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-[#E41E26] text-white rounded-xl text-xs font-bold"
        >
          హోమ్‌కి వెళ్లండి
        </button>
      </div>
    );
  }

  const togglePlay = () => {
    if (isPlaying) {
      voiceNewsService.pause();
      setIsPlaying(false);
    } else {
      const textToSpeak = news.audioNarratedText || `${news.title}. ${news.shortSummary}`;
      voiceNewsService.speak(
        textToSpeak,
        1.0,
        () => setIsPlaying(true),
        () => setIsPlaying(false),
        () => setIsPlaying(false)
      );
      setIsPlaying(true);
    }
  };

  const handleBack = () => {
    voiceNewsService.stop();
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    if (onShare) {
      onShare(news, e);
    } else {
      const shareText = `*రచ్చ బండ - VOICE*\n${news.title}\n${news.shortSummary}\n\n👉 వినండి: ${window.location.origin}/voice/${news.id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md">
        <button
          id="voice-player-back-btn"
          onClick={handleBack}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#E41E26] animate-pulse" />
          <h2 className="text-sm font-bold tracking-wide telugu-heading">
            వాయిస్ న్యూస్ స్టూడియో
          </h2>
        </div>
        <button
          id="voice-player-share-btn"
          onClick={handleShareClick}
          className="p-1.5 -mr-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Studio Visual Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto w-full">
        {/* News Thumbnail Card */}
        <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 mb-6 bg-neutral-900">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
            <span className="bg-[#E41E26] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {news.location}
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-lg font-black leading-snug line-clamp-3 telugu-heading text-white">
          {news.title}
        </h1>

        {/* Short Summary */}
        <p className="mt-3 text-xs text-neutral-400 line-clamp-3 leading-relaxed">
          {news.shortSummary}
        </p>

        {/* Animated Sound Waveform Bars */}
        <div className="w-full flex items-center justify-center gap-1.5 h-12 my-6 px-4">
          {[16, 28, 20, 36, 24, 32, 18, 40, 26, 20, 34, 28, 16, 32, 38, 22, 18, 30].map(
            (h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-[#E41E26] animate-pulse' : 'bg-neutral-700'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(10, (h * ((i % 3) + 1)) % 44)}px` : `${h / 2.5}px`,
                }}
              />
            )
          )}
        </div>

        {/* Play / Pause Toggle Button */}
        <div className="flex items-center gap-6">
          <button
            id="voice-player-toggle-btn"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[#E41E26] hover:bg-[#B71C1C] text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>
        </div>

        {/* Duration Label */}
        <span className="mt-3 text-xs font-mono text-neutral-400">
          నిడివి: {news.audioDuration}
        </span>
      </div>

      {/* Footer Branding */}
      <div className="p-4 text-center border-t border-neutral-900 text-xs text-neutral-500">
        రచ్చ బండ AI వాయిస్ న్యూస్ నెట్‌వర్క్
      </div>
    </div>
  );
};
