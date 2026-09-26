import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NewsItem, ReactionType, ReactionCounts } from '../types';
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
  Heart,
  Flame,
  Flag,
  Check,
} from 'lucide-react';
import { voiceNewsService } from '../utils/audioPlayer';
import { ReportDialog } from './ReportDialog';
import { useAuth } from '../hooks/useAuth';
import {
  fetchUserReaction,
  setReaction,
  removeReaction,
  fetchReactionCounts,
  VALID_REACTIONS,
} from '../services/reactionService';

const REACTION_CONFIG: Record<
  ReactionType,
  { label: string; teluguLabel: string; icon: React.FC<{ className?: string }>; color: string; bg: string }
> = {
  like: {
    label: 'Like',
    teluguLabel: 'లైక్',
    icon: ThumbsUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50 text-blue-600 border border-blue-200',
  },
  love: {
    label: 'Love',
    teluguLabel: 'లవ్',
    icon: Heart,
    color: 'text-red-600',
    bg: 'bg-red-50 text-red-600 border border-red-200',
  },
  support: {
    label: 'Support',
    teluguLabel: 'మద్దతు',
    icon: Sparkles,
    color: 'text-amber-600',
    bg: 'bg-amber-50 text-amber-600 border border-amber-200',
  },
  angry: {
    label: 'Angry',
    teluguLabel: 'కోపం',
    icon: Flame,
    color: 'text-orange-600',
    bg: 'bg-orange-50 text-orange-600 border border-orange-200',
  },
};

interface NewsDetailScreenProps {
  news?: NewsItem;
  newsList?: NewsItem[];
  onBack?: () => void;
  onOpenVoicePlayer?: (news: NewsItem) => void;
  onSelectRelatedNews?: (news: NewsItem) => void;
  relatedNews?: NewsItem[];
  isSaved?: boolean;
  savedNewsIds?: string[];
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
  savedNewsIds = [],
  onToggleSave,
  onOpenComments,
  onShare,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const news = directNews || newsList.find((n) => n.id === id);
  const isArticleSaved = isSaved || (news?.id ? savedNewsIds.includes(news.id) : false);
  const relatedNews =
    directRelatedNews || (news ? newsList.filter((n) => n.id !== news.id) : []);

  const { isAuthenticated, openAuthModal } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({
    like: 0,
    love: 0,
    support: 0,
    angry: 0,
    total: 0,
  });
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);

  const hasRealAudio = Boolean(
    news?.audioUrl && (news.audioUrl.startsWith('http') || news.audioUrl.startsWith('/'))
  );

  // Load user's reaction & reaction counts from Supabase
  useEffect(() => {
    if (!news?.id) return;

    let isMounted = true;
    if (isAuthenticated) {
      fetchUserReaction(news.id).then(({ reaction }) => {
        if (isMounted) setUserReaction(reaction);
      });
    } else {
      setUserReaction(null);
    }

    fetchReactionCounts(news.id).then(({ counts }) => {
      if (isMounted) setReactionCounts(counts);
    });

    return () => {
      isMounted = false;
    };
  }, [news?.id, isAuthenticated]);

  useEffect(() => {
    // Scroll to top on news change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPlayingAudio(false);
    setPlaybackProgress(0);
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
      htmlAudioRef.current.currentTime = 0;
    }
    return () => {
      voiceNewsService.stop();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      }
    };
  }, [news?.id]);

  // Audio timer simulation during speech synthesis (if not real audio)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio && !hasRealAudio) {
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
  }, [isPlayingAudio, hasRealAudio]);

  const handleToggleAudio = () => {
    if (hasRealAudio && htmlAudioRef.current) {
      if (isPlayingAudio) {
        htmlAudioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        htmlAudioRef.current.play().then(() => {
          setIsPlayingAudio(true);
        }).catch((err) => {
          console.warn('Real audio playback error, falling back to TTS:', err);
          fallbackToTTS();
        });
      }
    } else {
      fallbackToTTS();
    }
  };

  const fallbackToTTS = () => {
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

  const handleToggleReaction = async (targetReaction: ReactionType = 'like') => {
    if (!news?.id) return;

    // Guest protection: open AuthModal, do not write to DB
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (isReactionLoading) return;
    setIsReactionLoading(true);

    const prevReaction = userReaction;
    const isRemoving = userReaction === targetReaction;
    const nextReaction = isRemoving ? null : targetReaction;

    // Optimistic UI update
    setUserReaction(nextReaction);
    setReactionCounts((prev) => {
      const next = { ...prev };
      if (prevReaction) {
        next[prevReaction] = Math.max(0, next[prevReaction] - 1);
        next.total = Math.max(0, next.total - 1);
      }
      if (nextReaction) {
        next[nextReaction] = (next[nextReaction] || 0) + 1;
        next.total = next.total + 1;
      }
      return next;
    });

    try {
      if (isRemoving) {
        const { success, error } = await removeReaction(news.id);
        if (!success || error) {
          // Revert on failure
          setUserReaction(prevReaction);
          fetchReactionCounts(news.id).then(({ counts }) => setReactionCounts(counts));
        }
      } else {
        const { data, error } = await setReaction(news.id, targetReaction);
        if (!data || error) {
          // Revert on failure
          setUserReaction(prevReaction);
          fetchReactionCounts(news.id).then(({ counts }) => setReactionCounts(counts));
        }
      }
    } finally {
      setIsReactionLoading(false);
      setShowReactionPicker(false);
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
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            id="detail-back-btn"
            onClick={handleBack}
            aria-label="వెనుకకు వెళ్లండి (Go back)"
            className="p-1.5 -ml-1.5 text-neutral-800 hover:text-neutral-900 rounded-full hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-1 text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="text-base font-bold text-neutral-900 telugu-heading">
            వార్త వివరాలు
          </span>

          <button
            id="detail-share-top-btn"
            onClick={handleShareClick}
            aria-label="వార్తను షేర్ చేయండి (Share news)"
            className="p-1.5 -mr-1.5 text-neutral-700 hover:text-[#E41E26] rounded-full hover:bg-neutral-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 pt-3 sm:pt-6">
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
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Video Player (if news has uploaded video) */}
        {news.videoUrl && (
          <div className="my-3 rounded-2xl overflow-hidden shadow-md bg-black">
            <video
              src={news.videoUrl}
              controls
              playsInline
              poster={news.imageUrl}
              className="w-full max-h-[380px] object-contain"
            />
          </div>
        )}

        {/* Real Audio Element (hidden player) */}
        {hasRealAudio && (
          <audio
            ref={htmlAudioRef}
            src={news.audioUrl!}
            onEnded={() => {
              setIsPlayingAudio(false);
              setPlaybackProgress(100);
            }}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              if (el.duration && !isNaN(el.duration)) {
                setPlaybackProgress((el.currentTime / el.duration) * 100);
              }
            }}
            className="hidden"
          />
        )}

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
              aria-label={isPlayingAudio ? "ఆడియో పాజ్ చేయండి (Pause audio)" : "ఆడియో ప్లే చేయండి (Play audio)"}
              className="w-11 h-11 rounded-full bg-[#E41E26] hover:bg-[#B71C1C] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform flex-shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
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

        {/* Social Action Bar matching Screen 2 (Likes / Reactions, Comments, Share, Save) */}
        <div className="mt-6 pt-3 pb-3 border-y border-neutral-100 flex items-center justify-around text-neutral-600 relative">
          {/* Reaction Button with Popover Picker */}
          <div className="relative flex items-center">
            <button
              id="detail-like-btn"
              onClick={() => handleToggleReaction(userReaction || 'like')}
              disabled={isReactionLoading}
              aria-label={userReaction ? `${REACTION_CONFIG[userReaction].teluguLabel} ప్రతిస్పందన` : "లైక్ చేయండి (Like)"}
              aria-pressed={Boolean(userReaction)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                userReaction
                  ? `${REACTION_CONFIG[userReaction].bg} shadow-xs`
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title={userReaction ? `${REACTION_CONFIG[userReaction].teluguLabel} (ప్రస్తుత ప్రతిస్పందన)` : 'లైక్ చేయండి'}
            >
              {userReaction ? (
                React.createElement(REACTION_CONFIG[userReaction].icon, {
                  className: `w-4 h-4 ${REACTION_CONFIG[userReaction].color} fill-current`,
                })
              ) : (
                <ThumbsUp className="w-4 h-4" />
              )}
              <span>{reactionCounts.total}</span>
            </button>

            {/* Quick Picker dropdown trigger */}
            <button
              id="detail-reaction-picker-trigger"
              onClick={() => setShowReactionPicker((prev) => !prev)}
              aria-label="ఇతర ప్రతిస్పందనలు ఎంచుకోండి (Choose reactions)"
              aria-expanded={showReactionPicker}
              className="text-[10px] text-neutral-400 hover:text-neutral-700 px-1 py-1 rounded transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
              title="ఇతర ప్రతిస్పందనలు (Reactions)"
            >
              ▾
            </button>

            {showReactionPicker && (
              <div
                id="detail-reaction-picker-menu"
                className="absolute bottom-full mb-2 left-0 z-30 bg-white border border-neutral-200 shadow-xl rounded-full px-2 py-1.5 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
              >
                {VALID_REACTIONS.map((r) => {
                  const cfg = REACTION_CONFIG[r];
                  const Icon = cfg.icon;
                  const isSelected = userReaction === r;
                  return (
                    <button
                      key={r}
                      id={`reaction-picker-btn-${r}`}
                      onClick={() => handleToggleReaction(r)}
                      title={`${cfg.teluguLabel} (${cfg.label})`}
                      aria-label={`${cfg.teluguLabel} (${cfg.label})`}
                      className={`p-1.5 rounded-full transition-all transform hover:scale-125 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                        isSelected ? `${cfg.bg} scale-110` : 'hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.color} ${isSelected ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            id="detail-comment-btn"
            onClick={() => onOpenComments(news.id)}
            aria-label={`కామెంట్లు చూడండి (${news.commentsCount})`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{news.commentsCount}</span>
          </button>

          <button
            id="detail-share-btn"
            onClick={() => onShare(news)}
            aria-label="వార్తను షేర్ చేయండి (Share news)"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
          >
            <Share2 className="w-4 h-4 text-green-600" />
            <span>పంపండి</span>
          </button>

          <button
            id="detail-save-btn"
            onClick={() => onToggleSave && onToggleSave(news.id)}
            aria-label={isArticleSaved ? "వార్త సేవ్ చేయబడింది (Saved)" : "వార్తను సేవ్ చేయండి (Save news)"}
            aria-pressed={isArticleSaved}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
              isArticleSaved
                ? 'text-[#E41E26] bg-red-50'
                : 'hover:bg-neutral-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isArticleSaved ? 'fill-[#E41E26]' : ''}`} />
            <span>{isArticleSaved ? 'సేవ్ చేయబడింది' : 'సేవ్'}</span>
          </button>

          <button
            id="detail-report-btn"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal();
              } else {
                setIsReportDialogOpen(true);
              }
            }}
            aria-label="ఈ వార్తను రిపోర్ట్ చేయండి (Report news)"
            title="రిపోర్ట్ చేయండి / Report"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-red-600 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
          >
            <Flag className="w-4 h-4" />
            <span>రిపోర్ట్</span>
          </button>
        </div>

        {/* 'ఇంకా చదవండి' (Read More / Related News) matching bottom of Screen 2 */}
        <div className="mt-6">
          <h2 className="text-base font-bold text-neutral-900 mb-3 telugu-heading">
            ఇంకా చదవండి
          </h2>
          <div className="space-y-3 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0">
            {relatedNews.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  onSelectRelatedNews
                    ? onSelectRelatedNews(item)
                    : navigate(`/news/${item.id}`)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSelectRelatedNews
                      ? onSelectRelatedNews(item)
                      : navigate(`/news/${item.id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={item.title}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-snug telugu-heading">
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    {item.timeAgo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Report News Dialog */}
      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        contentType="news"
        contentId={news.id}
        contentTitle={news.title}
        onSuccess={() => {
          setToastMessage('రిపోర్ట్ పంపబడింది / Report submitted');
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
        >
          <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
