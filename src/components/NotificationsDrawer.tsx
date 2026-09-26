import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Heart,
  Sparkles,
  Loader2,
  LogIn,
} from 'lucide-react';
import { NotificationItem } from '../types';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import { formatTimeAgo } from '../services/newsService';
import { useAuth } from '../hooks/useAuth';

interface NotificationsDrawerProps {
  onClose: () => void;
  onSelectNotificationLink?: (link: string) => void;
  onNotificationsChange?: () => void;
  // Fallbacks for compatibility
  notifications?: any[];
  onSelectNews?: (news: any) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  onClose,
  onSelectNotificationLink,
  onNotificationsChange,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!isAuthenticated) {
        setIsLoading(false);
        setNotifications([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await fetchUserNotifications();
        if (!isMounted) return;

        if (fetchErr) {
          setError(fetchErr.message);
        } else {
          setNotifications(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'నోటిఫికేషన్లు లోడ్ చేయడంలో లోపం ఏర్పడింది.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = async (item: NotificationItem) => {
    // 1. If unread, mark as read immediately
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      await markNotificationAsRead(item.id);
      if (onNotificationsChange) {
        onNotificationsChange();
      }
    }

    // 2. Navigate if link is present
    if (item.link) {
      onClose();
      if (onSelectNotificationLink) {
        onSelectNotificationLink(item.link);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const { success, error: markErr } = await markAllNotificationsAsRead();
      if (!success || markErr) {
        // Reload if failure
        const { data } = await fetchUserNotifications();
        if (data) setNotifications(data);
      } else if (onNotificationsChange) {
        onNotificationsChange();
      }
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case 'breaking':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#E41E26] bg-red-100 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            బ్రేకింగ్
          </span>
        );
      case 'submission_approved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            ఆమోదం
          </span>
        );
      case 'submission_rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            తిరస్కరణ
          </span>
        );
      case 'comment':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
            <MessageSquare className="w-3 h-3" />
            వ్యాఖ్య
          </span>
        );
      case 'reaction':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
            <Heart className="w-3 h-3" />
            స్పందన
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
            <Bell className="w-3 h-3" />
            సమాచారం
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-drawer-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-[#E41E26] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-300" />
            <div>
              <h3 id="notifications-drawer-title" className="font-bold telugu-heading text-sm">
                నోటిఫికేషన్లు (Notifications)
              </h3>
              {unreadCount > 0 && (
                <p className="text-[10px] text-yellow-200">
                  {unreadCount} చదవని నోటిఫికేషన్లు ఉన్నాయి
                </p>
              )}
            </div>
          </div>
          <button
            id="notifications-close-btn"
            onClick={onClose}
            aria-label="నోటిఫికేషన్ల విండోను మూసివేయండి (Close notifications)"
            className="p-1 rounded-full text-white/80 hover:bg-white/20 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar: Mark all as read */}
        {isAuthenticated && unreadCount > 0 && (
          <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-600 font-medium">
              {unreadCount} కొత్త అప్‌డేట్‌లు
            </span>
            <button
              id="mark-all-read-btn"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              aria-label="అన్ని నోటిఫికేషన్లను చదివినట్లు గుర్తించు"
              className="text-[11px] font-bold text-[#E41E26] hover:text-[#B71C1C] flex items-center gap-1 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
            >
              {isMarkingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              <span>అన్నీ చదివినట్లు గుర్తించు</span>
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5" role="region" aria-label="నోటిఫికేషన్ల జాబితా">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#E41E26] mb-3" />
              <p className="text-xs font-medium">నోటిఫికేషన్లు లోడ్ అవుతున్నాయి...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 bg-red-50 text-[#E41E26] rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Bell className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 telugu-heading mb-1">
                లాగిన్ అవ్వండి / Please Sign In
              </h4>
              <p className="text-xs text-neutral-500 max-w-xs mb-4">
                మీ వ్యక్తిగత నోటిఫికేషన్లు మరియు వార్తా అప్‌డేట్‌లను చూడటానికి దయచేసి లాగిన్ అవ్వండి.
              </p>
              <button
                id="notif-drawer-login-btn"
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="bg-[#E41E26] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>లాగిన్ / Login</span>
              </button>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center text-xs" role="alert">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 text-center px-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-neutral-400" />
              </div>
              <h4 className="text-sm font-bold text-neutral-700 telugu-heading mb-1">
                నోటిఫికేషన్లు లేవు / No Notifications
              </h4>
              <p className="text-xs text-neutral-500 max-w-xs">
                ప్రస్తుతం మీకు ఎలాంటి కొత్త నోటిఫికేషన్లు లేవు. తాజా సమాచారం ఇక్కడ కనిపిస్తుంది.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleItemClick(item);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${item.title}. ${item.message}`}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                  !item.isRead
                    ? 'bg-red-50/40 hover:bg-red-50/70 border-red-200 shadow-2xs'
                    : 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-700'
                }`}
              >
                {!item.isRead && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#E41E26]" aria-label="కొత్త నోటిఫికేషన్" />
                )}
                <div className="flex items-center justify-between mb-1.5 pr-4">
                  {renderBadge(item.type)}
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>
                <h4
                  className={`text-xs telugu-heading line-clamp-2 leading-snug ${
                    !item.isRead ? 'font-bold text-neutral-900' : 'font-medium text-neutral-750'
                  }`}
                >
                  {item.title}
                </h4>
                <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2 leading-normal">
                  {item.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-100 text-center text-xs text-neutral-500 bg-neutral-50">
          రచ్చ బండ లైవ్ న్యూస్ అలర్ట్స్ సక్రియం చేయబడ్డాయి.
        </div>
      </div>
    </div>
  );
};
