import React from 'react';
import { X, Bell, Volume2, Sparkles } from 'lucide-react';
import { NewsItem } from '../types';

interface NotificationsDrawerProps {
  notifications: NewsItem[];
  onClose: () => void;
  onSelectNews: (news: NewsItem) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  notifications,
  onClose,
  onSelectNews,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-[#E41E26] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-300" />
            <h3 className="font-bold telugu-heading text-sm">
              తాజా బ్రేకింగ్ నోటిఫికేషన్లు
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onClose();
                onSelectNews(item);
              }}
              className="p-3 bg-red-50/40 hover:bg-red-50 rounded-xl border border-red-100 transition-all cursor-pointer flex gap-3 items-start"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#E41E26] uppercase">
                    {item.location}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {item.timeAgo}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 mt-0.5 leading-snug telugu-heading">
                  {item.title}
                </h4>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-neutral-100 text-center text-xs text-neutral-500 bg-neutral-50">
          రచ్చ బండ లైవ్ న్యూస్ అలర్ట్స్ సక్రియం చేయబడ్డాయి.
        </div>
      </div>
    </div>
  );
};
