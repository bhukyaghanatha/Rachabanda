import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NewsItem } from '../types';
import {
  ArrowLeft,
  Share2,
  Play,
  Pause,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Volume2,
  CheckCircle2,
  Sparkles,
  Home,
} from 'lucide-react';
import { voiceNewsService } from '../utils/audioPlayer';

interface NewsDetailScreenProps {
  news?: NewsItem;
  newsList?: NewsItem[];
  onBack?: () => void;
  onOpenVoicePlayer?: (news: NewsItem) => void;
  onSelectRelatedNews?: (news: NewsItem) => void;
  relatedNews?: NewsItem[];
  isSaved?: boolean;
  onToggleSave?: (newsId: string) => void;
  onOpenComments?: (newsId: string) => void;
  onShare?: (news: NewsItem) => void;
}

export const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({
  news: directNews,
  newsList = [],
  onBack,
  onOpenVoicePlayer,
  onSelectRelatedNews,
  relatedNews: directRelatedNews,
  isSaved = false,
  onToggleSave,
  onOpenComments,
  onShare,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const news = directNews || newsList.find((n) => n.id === id);
  const relatedNews =
    directRelatedNews || (news ? newsList.filter((n) => n.id !== news.id) : []);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [likesCount, setLikesCount] = useState(news?.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  useEffect(() => {
    if (news) {
      setLikesCount(news.likes);
      setHasLiked(false);
    }
  }, [news?.id]);

  useEffect(() => {
    // Scroll to top on news change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPlayingAudio(false);
    setPlaybackProgress(0);
    return () => {
      voiceNewsService.stop();
    };
  }, [news?.id]);

  // Audio timer simulation during speech
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      voiceNewsService.pause();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = news.audioNarratedText || `${news.title}. ${news.shortSummary}`;
      voiceNewsService.speak(
        textToSpeak,
        1.0,
        () => setIsPlayingAudio(true),
        () => {
          setIsPlayingAudio(false);
          setPlaybackProgress(100);
        },
        () => setIsPlayingAudio(false)
      );
      setIsPlayingAudio(true);
    }
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  if (!news) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-lg font-bold text-neutral-900 telugu-heading">
          వార్త కనుగొనబడలేదు (Article Not Found)
        </h2>
        <p className="text-xs text-neutral-500 mt-2">
          మీరు కోరిన వార్త అందుబాటులో లేదు లేదా తొలగించబడి ఉండవచ్చు.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-[#E41E26] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#B71C1C] transition-all"
        >
          హోమ్‌కి వెళ్లండి
        </button>
      </div>
    );
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare(news);
    } else {
      const shareText = `*రచ్చ బండ - VOICE*\n${news.title}\n${news.shortSummary}\n\n👉 ప్రజల మాటే... మా వార్త: ${window.location.origin}/news/${news.id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Top Bar matching Screen 2: Back button, 'వార్త వివరాలు', Share button */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-neutral-100 flex items-center justify-between shadow-2xs">
        <button
          id="detail-back-btn"
          onClick={handleBack}
          className="p-1.5 -ml-1.5 text-neutral-800 hover:text-neutral-900 rounded-full hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-1 text-sm font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-neutral-900 telugu-heading">
          వార్త వివరాలు
        </h2>

        <button
          id="detail-share-top-btn"
          onClick={handleShareClick}
          className="p-1.5 -mr-1.5 text-neutral-700 hover:text-[#E41E26] rounded-full hover:bg-neutral-100 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <article className="max-w-2xl mx-auto px-4 pt-3">
        {/* Location & Time Tags */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#E41E26] text-white text-xs font-bold px-2.5 py-0.5 rounded shadow-2xs">
              {news.location}
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              {news.timeAgo}
            </span>
          </div>

          {news.factChecked && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>నిజ నిర్ధారణ పూర్తి</span>
            </span>
          )}
        </div>

        {/* Feature Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm my-2 aspect-video bg-neutral-100">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Headline */}
        <h1 className="text-xl sm:text-2xl font-black text-neutral-950 leading-snug mt-3 telugu-heading">
          {news.title}
        </h1>

        {/* Reporter Credit */}
        <div className="flex items-center gap-2 mt-2 pb-3 border-b border-neutral-100 text-xs text-neutral-500 font-medium">
          <span>రిపోర్టర్: <strong className="text-neutral-800">{news.reporterName}</strong></span>
          <span>•</span>
          <span>ID: {news.reporterId}</span>
        </div>

        {/* Dedicated Audio Player Card matching Screen 2 from mockup */}
        <div
          id="news-audio-player-card"
          className="my-4 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border border-red-200 rounded-2xl p-3.5 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E41E26] flex items-center justify-center text-white shadow-xs">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-[#E41E26] tracking-wide block leading-none">
                  రచ్చ బండ – VOICE
                </span>
                <span className="text-[10px] text-neutral-600 font-medium">
                  వార్తను ఆడియో రూపంలో వినండి
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                onOpenVoicePlayer
                  ? onOpenVoicePlayer(news)
                  : navigate(`/voice/${news.id}`)
              }
              className="text-[11px] font-bold text-[#E41E26] hover:underline flex items-center gap-1"
            >
              <span>స్టూడియో వ్యూ</span>
              <Sparkles className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {/* Play/Pause Button */}
            <button
              id="audio-play-pause-btn"
              onClick={handleToggleAudio}
              className="w-11 h-11 rounded-full bg-[#E41E26] hover:bg-[#B71C1C] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform flex-shrink-0"
            >
              {isPlayingAudio ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Waveform Visualizer */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-1 h-8 px-2 bg-white/70 rounded-lg border border-red-100">
                {[14, 24, 18, 32, 20, 28, 16, 36, 22, 18, 30, 24, 14, 28, 34, 20, 16, 26, 18, 22].map(
                  (height, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlayingAudio
                          ? 'bg-[#E41E26] animate-pulse'
                          : 'bg-neutral-300'
                      }`}
                      style={{
                        height: isPlayingAudio
                          ? `${Math.max(8, (height * ((idx % 3) + 1)) % 32)}px`
                          : `${height / 2}px`,
                      }}
                    />
                  )
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-1 px-1">
                <span>{isPlayingAudio ? '0:15' : '0:00'}</span>
                <span>{news.audioDuration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* News Body Text */}
        <div className="mt-4 text-base text-neutral-800 leading-relaxed space-y-3 font-normal">
          {news.content.split('\n\n').map((para, index) => (
            <p key={index}>{para}</p>
          ))}
        </div>

        {/* Social Action Bar matching Screen 2 (125 Likes, 18 Comments, Share, Save) */}
        <div className="mt-6 pt-3 pb-3 border-y border-neutral-100 flex items-center justify-around text-neutral-600">
          <button
            id="detail-like-btn"
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
              hasLiked
                ? 'text-[#E41E26] bg-red-50'
                : 'hover:bg-neutral-100'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-[#E41E26]' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            id="detail-comment-btn"
            onClick={() => onOpenComments(news.id)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{news.commentsCount}</span>
          </button>

          <button
            id="detail-share-btn"
            onClick={() => onShare(news)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <Share2 className="w-4 h-4 text-green-600" />
            <span>పంపండి</span>
          </button>

          <button
            id="detail-save-btn"
            onClick={() => onToggleSave(news.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              isSaved
                ? 'text-[#E41E26] bg-red-50'
                : 'hover:bg-neutral-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#E41E26]' : ''}`} />
            <span>సేవ్</span>
          </button>
        </div>

        {/* 'ఇంకా చదవండి' (Read More / Related News) matching bottom of Screen 2 */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-neutral-900 mb-3 telugu-heading">
            ఇంకా చదవండి
          </h3>
          <div className="space-y-3">
            {relatedNews.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  onSelectRelatedNews
                    ? onSelectRelatedNews(item)
                    : navigate(`/news/${item.id}`)
                }
                className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all cursor-pointer"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-snug telugu-heading">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    {item.timeAgo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};
