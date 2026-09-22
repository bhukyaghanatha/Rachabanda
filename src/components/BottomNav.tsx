import React from 'react';
import { Home, Video, Mic, Bookmark, User } from 'lucide-react';
import { MobileTab } from '../types';

interface BottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  savedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  savedCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200/80 shadow-lg select-none">
      <div className="max-w-md mx-auto flex items-center justify-around h-15 px-2 relative">
        {/* 1. హోం (Home) */}
        <button
          id="nav-home"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 ${
            activeTab === 'home' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">హోం</span>
        </button>

        {/* 2. వీడియో (Video) */}
        <button
          id="nav-video"
          onClick={() => onSelectTab('video')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 ${
            activeTab === 'video' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Video className={`w-5 h-5 ${activeTab === 'video' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">వీడియో</span>
        </button>

        {/* 3. CENTER ELEVATED BUTTON: మీ వార్త పంపండి (Submit News / Mic) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            id="nav-submit-news-mic"
            onClick={() => onSelectTab('submit')}
            className={`w-13 h-13 rounded-full bg-gradient-to-tr from-[#B71C1C] to-[#E41E26] text-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl active:scale-90 transition-transform border-4 border-white ${
              activeTab === 'submit' ? 'ring-2 ring-[#E41E26]' : ''
            }`}
            title="మీ వార్త పంపండి"
          >
            <Mic className="w-6 h-6" />
          </button>
        </div>

        {/* 4. సేవ్డ్ (Saved) */}
        <button
          id="nav-saved"
          onClick={() => onSelectTab('saved')}
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 ${
            activeTab === 'saved' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${activeTab === 'saved' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">సేవ్డ్</span>
          {savedCount > 0 && (
            <span className="absolute top-1 right-3 w-3.5 h-3.5 bg-[#E41E26] text-white font-mono text-[8px] rounded-full flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </button>

        {/* 5. ప్రొఫైల్ (Profile / Reporter) */}
        <button
          id="nav-profile"
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 ${
            activeTab === 'profile' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">Profile</span>
        </button>
      </div>
    </nav>
  );
};
