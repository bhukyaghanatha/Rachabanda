import React from 'react';
import { Logo } from './Logo';
import { Search, Bell, Shield, Sparkles } from 'lucide-react';
import { TopCategoryTab } from '../types';

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
  const topTabs: TopCategoryTab[] = ['హోం', 'వీడియో', 'VOICE', 'ఫోటోలు', 'ఫాలో'];

  return (
    <header className="sticky top-0 z-40 bg-[#E41E26] text-white shadow-md select-none">
      {/* Top Brand Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <Logo variant="header" />

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Quick 60-word Flip Reader toggle */}
          <button
            id="flip-reader-btn"
            onClick={onToggleFlipMode}
            title="Way2News స్టైల్ ఫ్లిప్ కార్డ్ రీడర్"
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all ${
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
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-colors"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            id="search-toggle-btn"
            onClick={onOpenSearch}
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications Bell with Unread Badge */}
          <button
            id="notifications-toggle-btn"
            onClick={onOpenNotifications}
            className="relative p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-yellow-400 text-neutral-900 font-bold text-[9px] rounded-full flex items-center justify-center shadow">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Secondary Category Navigation Tabs (హోం, వీడియో, VOICE, ఫోటోలు, ఫాలో) */}
      <div className="flex items-center px-2 bg-[#B71C1C] overflow-x-auto scrollbar-none border-t border-red-700/50">
        {topTabs.map((tab) => {
          const isActive = activeTopTab === tab;
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => onSelectTopTab(tab)}
              className={`relative px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
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
    </header>
  );
};
