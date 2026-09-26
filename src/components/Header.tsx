import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Search, Bell, Shield, Sparkles, LogIn, LogOut, Plus, Bookmark } from 'lucide-react';
import { TopCategoryTab } from '../types';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  activeTopTab: TopCategoryTab;
  onSelectTopTab: (tab: TopCategoryTab) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  onSwitchToAdmin: () => void;
  onToggleFlipMode: () => void;
  isFlipMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTopTab,
  onSelectTopTab,
  onOpenSearch,
  onOpenNotifications,
  unreadCount = 3,
  onSwitchToAdmin,
  onToggleFlipMode,
  isFlipMode,
}) => {
  const navigate = useNavigate();
  const { profile, isAuthenticated, openAuthModal, signOut } = useAuth();
  const topTabs: TopCategoryTab[] = ['హోం', 'వీడియో', 'VOICE', 'ఫోటోలు', 'ఫాలో'];

  return (
    <header className="sticky top-0 z-40 bg-[#E41E26] text-white shadow-md select-none">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          aria-label="రచ్చ బండ హోమ్‌పేజీ (Rachabanda Home)"
          className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white rounded-lg p-0.5 text-left"
        >
          <Logo variant="header" />
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Navigation Shortcuts: Submit News & Saved */}
          <button
            id="header-submit-news-btn"
            onClick={() => navigate('/submit')}
            title="మీ వార్త పంపండి (Submit News)"
            aria-label="మీ వార్త పంపండి (Submit News)"
            className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white text-[#E41E26] hover:bg-neutral-100 shadow-xs transition-all active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>వార్త రాయండి</span>
          </button>

          <button
            id="header-saved-btn"
            onClick={() => navigate('/saved')}
            title="సేవ్ చేసుకున్న వార్తలు (Saved Articles)"
            aria-label="సేవ్ చేసుకున్న వార్తలు (Saved Articles)"
            className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>సేవ్డ్</span>
          </button>
          {/* Quick 60-word Flip Reader toggle */}
          <button
            id="flip-reader-btn"
            onClick={onToggleFlipMode}
            title="Way2News స్టైల్ ఫ్లిప్ కార్డ్ రీడర్"
            aria-label="Way2News స్టైల్ ఫ్లిప్ కార్డ్ రీడర్ (Flip Reader)"
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white ${
              isFlipMode
                ? 'bg-yellow-400 text-neutral-900 shadow-sm'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">ఫ్లిప్ రీడర్</span>
          </button>

          {/* Admin shortcut */}
          <button
            id="admin-shortcut-btn"
            onClick={onSwitchToAdmin}
            title="అడ్మిన్ డాష్‌బోర్డ్"
            aria-label="అడ్మిన్ డాష్‌బోర్డ్ (Admin Dashboard)"
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            id="search-toggle-btn"
            onClick={onOpenSearch}
            title="వార్తలను శోధించండి (Search news)"
            aria-label="వార్తలను శోధించండి (Search news)"
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications Bell with Unread Badge */}
          <button
            id="notifications-toggle-btn"
            onClick={onOpenNotifications}
            title={`నోటిఫికేషన్లు${unreadCount > 0 ? ` (${unreadCount} చదవనివి)` : ''}`}
            aria-label={`నోటిఫికేషన్లు${unreadCount > 0 ? ` (${unreadCount} చదవనివి)` : ''}`}
            className="relative p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-yellow-400 text-neutral-900 font-bold text-[9px] rounded-full flex items-center justify-center shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Auth Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1 ml-0.5">
              <button
                id="header-user-profile-btn"
                onClick={() => navigate('/profile')}
                title={`${profile?.full_name || 'యూజర్'} (ప్రొఫైల్)`}
                aria-label={`${profile?.full_name || 'యూజర్'} ప్రొఫైల్`}
                className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 text-white px-2 py-1 rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'యూజర్ అవతార్'}
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white/50"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white text-[#E41E26] text-[9px] font-black flex items-center justify-center">
                    {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] font-bold max-w-[65px] truncate hidden sm:inline">
                  {profile?.full_name?.split(' ')[0] || 'యూజర్'}
                </span>
              </button>
              <button
                id="header-logout-btn"
                onClick={() => signOut()}
                title="లాగౌట్ / Logout"
                aria-label="లాగౌట్ (Logout)"
                className="p-1 text-white/80 hover:text-white hover:bg-white/15 rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={openAuthModal}
              title="లాగిన్ / Login"
              aria-label="లాగిన్ / Login"
              className="flex items-center gap-1 text-[11px] font-bold bg-white text-[#E41E26] hover:bg-neutral-100 active:scale-95 px-2.5 py-1 rounded-full shadow-xs transition-all ml-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>లాగిన్</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Category Navigation Tabs (హోం, వీడియో, VOICE, ఫోటోలు, ఫాలో) */}
      <nav className="bg-[#B71C1C] border-t border-red-700/50" aria-label="ప్రధాన విభాగాలు (Primary Navigation Tabs)">
        <div role="tablist" className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex items-center overflow-x-auto scrollbar-none">
          {topTabs.map((tab) => {
            const isActive = activeTopTab === tab;
            return (
              <button
                key={tab}
                id={`tab-${tab}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTopTab(tab)}
                className={`relative px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white ${
                  isActive
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {tab === 'VOICE' ? (
                  <span className="inline-flex items-center gap-1 bg-white/20 text-yellow-300 px-1.5 py-0.5 rounded text-[11px] font-black">
                    🎙️ VOICE
                  </span>
                ) : (
                  tab
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-yellow-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
