import React, { useState } from 'react';
import { X, Send, MessageCircle, ThumbsUp } from 'lucide-react';
import { NewsComment } from '../types';

interface CommentsDrawerProps {
  newsId: string;
  newsTitle: string;
  comments: NewsComment[];
  onClose: () => void;
  onAddComment: (newsId: string, text: string, userName: string) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  newsId,
  newsTitle,
  comments,
  onClose,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [name, setName] = useState('ఖమ్మం పౌరుడు');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(newsId, commentText.trim(), name || 'పౌరుడు');
    setCommentText('');
  };

  const newsComments = comments.filter((c) => c.newsId === newsId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#E41E26]" />
            <h3 className="font-bold text-neutral-900 telugu-heading text-sm">
              కామెంట్లు ({newsComments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-500 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-4 py-2 text-xs text-neutral-500 bg-neutral-100/60 line-clamp-1 border-b border-neutral-100 font-medium">
          వార్త: {newsTitle}
        </p>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {newsComments.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              ఇంకా ఎటువంటి కామెంట్లు లేవు. మీ అభిప్రాయాన్ని మొదటగా తెలపండి!
            </div>
          ) : (
            newsComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/70 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-800">
                    {comment.userName}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {comment.timeAgo}
                  </span>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                  {comment.comment}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 pt-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{comment.likes} లైక్స్</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="మీ అభిప్రాయాన్ని రాయండి..."
              className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-red-200 outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-xs active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
