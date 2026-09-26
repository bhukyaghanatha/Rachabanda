import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, MessageCircle, ThumbsUp, Trash2, Loader2, LogIn, AlertCircle, Flag } from 'lucide-react';
import { NewsComment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { fetchCommentsByNewsId, postComment, deleteComment } from '../services/commentService';
import { ReportDialog } from './ReportDialog';

interface CommentsDrawerProps {
  newsId: string;
  newsTitle: string;
  onClose: () => void;
  onCommentCountChange?: (newsId: string, count: number) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  newsId,
  newsTitle,
  onClose,
  onCommentCountChange,
}) => {
  const { user, profile, isAuthenticated, isAdmin, isEditor, openAuthModal } = useAuth();

  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportingComment, setReportingComment] = useState<NewsComment | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Load comments from Supabase for this article
  const loadComments = useCallback(async () => {
    if (!newsId) return;
    setIsLoading(true);
    try {
      const { data, error } = await fetchCommentsByNewsId(newsId);
      if (error) {
        showFeedback('కామెంట్లను లోడ్ చేయడం విఫలమైంది: ' + error.message, 'error');
      } else {
        setComments(data);
        if (onCommentCountChange) {
          onCommentCountChange(newsId, data.length);
        }
      }
    } catch (err: any) {
      showFeedback('కామెంట్లను లోడ్ చేయడంలో లోపం ఏర్పడింది', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [newsId, onCommentCountChange]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Submit comment to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Guest protection: prompt sign-in, do not insert to database
    if (!isAuthenticated || !user) {
      showFeedback('కామెంట్ చేయడానికి దయచేసి లాగిన్ అవ్వండి / Please sign in to post a comment', 'error');
      openAuthModal();
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await postComment({
        newsId,
        comment: commentText.trim(),
        userName: profile?.full_name || user.email?.split('@')[0],
        userLocation: profile?.district || profile?.mandal || 'తెలంగాణ',
      });

      if (error) {
        showFeedback(error.message, 'error');
      } else if (data) {
        setComments((prev) => [data, ...prev]);
        setCommentText('');
        showFeedback('మీ కామెంట్ విజయవంతంగా జోడించబడింది! ✓', 'success');
        if (onCommentCountChange) {
          onCommentCountChange(newsId, comments.length + 1);
        }
      }
    } catch (err: any) {
      showFeedback('కామెంట్ పంపడంలో లోపం ఏర్పడింది', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment from Supabase
  const handleDeleteComment = async (commentId: string) => {
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;

    const canDelete = Boolean(user && (target.userId === user.id || isAdmin || isEditor));
    if (!canDelete) {
      showFeedback('ఈ కామెంట్‌ను తొలగించే అధికారం మీకు లేదు / Not authorized to delete this comment', 'error');
      return;
    }

    if (!window.confirm('ఈ కామెంట్‌ను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా? / Are you sure you want to delete this comment?')) {
      return;
    }

    setDeletingId(commentId);
    try {
      const { success, error } = await deleteComment(commentId);
      if (error || !success) {
        showFeedback(error?.message || 'కామెంట్ తొలగించడం విఫలమైంది', 'error');
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showFeedback('కామెంట్ తొలగించబడింది ✓', 'success');
        if (onCommentCountChange) {
          onCommentCountChange(newsId, Math.max(0, comments.length - 1));
        }
      }
    } catch (err: any) {
      showFeedback('కామెంట్ తొలగించడంలో లోపం ఏర్పడింది', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comments-drawer-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#E41E26]" />
            <h3 id="comments-drawer-title" className="font-bold text-neutral-900 telugu-heading text-sm">
              కామెంట్లు ({isLoading ? '...' : comments.length})
            </h3>
          </div>
          <button
            id="comments-close-btn"
            onClick={onClose}
            aria-label="కామెంట్ల విండోను మూసివేయండి (Close comments)"
            className="p-1 rounded-full text-neutral-600 hover:bg-neutral-200 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-4 py-2 text-xs text-neutral-700 bg-neutral-100/70 line-clamp-1 border-b border-neutral-100 font-medium">
          వార్త: {newsTitle}
        </p>

        {/* Feedback Alert Bar */}
        {feedbackMessage && (
          <div
            role="alert"
            className={`px-4 py-2 text-xs flex items-center gap-2 transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{feedbackMessage.text}</span>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="region" aria-label="కామెంట్ల జాబితా">
          {isLoading ? (
            <div className="text-center py-16 text-neutral-500 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#E41E26]" />
              <span>కామెంట్లను లోడ్ చేస్తోంది...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 text-xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="font-medium text-neutral-700">ఇంకా ఎటువంటి కామెంట్లు లేవు.</p>
              <p className="text-[11px] text-neutral-500">మీ అభిప్రాయాన్ని మొదటగా తెలపండి!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const canDelete = Boolean(
                user && (comment.userId === user.id || isAdmin || isEditor)
              );
              const isDeleting = deletingId === comment.id;

              return (
                <div
                  key={comment.id}
                  className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/70 space-y-1.5 transition-all hover:border-neutral-300"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-800">
                        {comment.userName}
                      </span>
                      {comment.userLocation && (
                        <span className="text-[10px] text-neutral-700 bg-neutral-200 px-1.5 py-0.5 rounded font-medium">
                          {comment.userLocation}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {comment.timeAgo}
                      </span>

                      {/* Report Comment Button */}
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            showFeedback('రిపోర్ట్ చేయడానికి దయచేసి లాగిన్ అవ్వండి / Please sign in to report content', 'error');
                            openAuthModal();
                          } else {
                            setReportingComment(comment);
                          }
                        }}
                        title="కామెంట్‌ను రిపోర్ట్ చేయండి (Report comment)"
                        aria-label={`కామెంట్ రిపోర్ట్ చేయండి: "${comment.comment.slice(0, 25)}" (Report comment)`}
                        className="p-1 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>

                      {/* Authorized Delete Button */}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={isDeleting}
                          title="కామెంట్‌ను తొలగించండి (Delete comment)"
                          aria-label="కామెంట్‌ను తొలగించండి (Delete comment)"
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed font-normal whitespace-pre-wrap">
                    {comment.comment}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-neutral-500 pt-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{comment.likes} లైక్స్</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input or Guest Prompt */}
        {!isAuthenticated ? (
          <div className="p-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-600 text-[11px] leading-tight font-medium">
              కామెంట్ చేయడానికి దయచేసి లాగిన్ అవ్వండి
            </span>
            <button
              id="comments-login-prompt-btn"
              onClick={openAuthModal}
              className="px-3.5 py-2 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs flex-shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>లాగిన్ (Sign In)</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200 bg-white">
            <div className="flex gap-2">
              <input
                id="comment-input-field"
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="మీ అభిప్రాయాన్ని రాయండి..."
                aria-label="మీ అభిప్రాయాన్ని రాయండి (Write your comment)"
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-red-200 outline-none disabled:bg-neutral-100"
              />
              <button
                id="comment-submit-btn"
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                aria-label="కామెంట్‌ను పంపండి (Submit comment)"
                className="px-3.5 py-2 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-xs active:scale-95 disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Report Comment Dialog */}
      {reportingComment && (
        <ReportDialog
          isOpen={Boolean(reportingComment)}
          onClose={() => setReportingComment(null)}
          contentType="comment"
          contentId={reportingComment.id}
          contentTitle={`${reportingComment.userName}: "${reportingComment.comment.slice(0, 60)}${reportingComment.comment.length > 60 ? '...' : ''}"`}
          onSuccess={() => {
            showFeedback('రిపోర్ట్ పంపబడింది / Report submitted', 'success');
            setReportingComment(null);
          }}
        />
      )}
    </div>
  );
};
