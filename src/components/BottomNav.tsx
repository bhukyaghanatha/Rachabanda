import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Video, Mic, Bookmark, User, Shield } from 'lucide-react';
import { MobileTab } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useAppLanguage } from '../i18n';

interface BottomNavProps {
  activeTab?: MobileTab;
  onSelectTab?: (tab: MobileTab) => void;
  savedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  savedCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isEditor } = useAuth();
  const { t } = useAppLanguage();
  const isStaff = isAdmin || isEditor;

  const isDashboardOrProfile =
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/reporter') ||
    location.pathname.startsWith('/my-submissions') ||
    location.pathname.startsWith('/my-reports') ||
    location.pathname.startsWith('/guidelines') ||
    location.pathname.startsWith('/help');

  const currentTab: MobileTab =
    activeTab ||
    (location.pathname === '/'
      ? 'home'
      : location.pathname.startsWith('/video')
      ? 'video'
      : location.pathname.startsWith('/submit')
      ? 'submit'
      : location.pathname.startsWith('/saved')
      ? 'saved'
      : isDashboardOrProfile
      ? 'profile'
      : location.pathname.startsWith('/admin')
      ? 'admin'
      : 'home');

  const handleNav = (tab: MobileTab, path: string) => {
    if (onSelectTab) onSelectTab(tab);
    navigate(path);
  };

  return (
    <nav aria-label="మొబైల్ నావిగేషన్ (Mobile Navigation)" className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200/80 shadow-lg select-none md:hidden">
      <div className={`max-w-md mx-auto flex items-center justify-around h-15 ${isStaff ? 'px-1' : 'px-2'} relative`}>
        {/* 1. హోం (Home) */}
        <button
          id="nav-home"
          onClick={() => handleNav('home', '/')}
          aria-current={currentTab === 'home' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] rounded-lg ${
            currentTab === 'home' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">{t('nav.home')}</span>
        </button>

        {/* 2. వీడియో (Video) */}
        <button
          id="nav-video"
          onClick={() => handleNav('video', '/video')}
          aria-current={currentTab === 'video' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] rounded-lg ${
            currentTab === 'video' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Video className={`w-5 h-5 ${currentTab === 'video' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">{t('nav.video')}</span>
        </button>

        {/* 3. CENTER ELEVATED BUTTON: మీ వార్త పంపండి (Submit News / Mic) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            id="nav-submit-news-mic"
            onClick={() => handleNav('submit', '/submit')}
            aria-label="మీ వార్త పంపండి (Submit News)"
            aria-current={currentTab === 'submit' ? 'page' : undefined}
            className={`w-13 h-13 rounded-full bg-gradient-to-tr from-[#B71C1C] to-[#E41E26] text-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl active:scale-90 transition-transform border-4 border-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
              currentTab === 'submit' ? 'ring-2 ring-[#E41E26]' : ''
            }`}
            title="మీ వార్త పంపండి"
          >
            <Mic className="w-6 h-6" />
          </button>
        </div>

        {/* 4. సేవ్డ్ (Saved) */}
        <button
          id="nav-saved"
          onClick={() => handleNav('saved', '/saved')}
          aria-current={currentTab === 'saved' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] rounded-lg ${
            currentTab === 'saved' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${currentTab === 'saved' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">{t('nav.saved')}</span>
          {savedCount > 0 && (
            <span className="absolute top-1 right-2 sm:right-3 w-3.5 h-3.5 bg-[#E41E26] text-white font-mono text-[8px] rounded-full flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </button>

        {/* 5. డ్యాష్‌బోర్డ్ / ప్రొఫైల్ (Dashboard / Profile) */}
        <button
          id="nav-profile"
          onClick={() => handleNav('profile', '/dashboard')}
          aria-current={currentTab === 'profile' ? 'page' : undefined}
          aria-label={t('nav.dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] rounded-lg ${
            currentTab === 'profile' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1 telugu-heading">{t('nav.dashboard')}</span>
        </button>

        {/* 6. అడ్మిన్ డెస్క్ (Admin Desk - Only for Admin / Editor) */}
        {isStaff && (
          <button
            id="nav-admin"
            onClick={() => handleNav('admin', '/admin')}
            aria-current={currentTab === 'admin' ? 'page' : undefined}
            aria-label="అడ్మిన్ డ్యాష్‌బోర్డ్ (Admin Dashboard)"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] rounded-lg ${
              currentTab === 'admin' ? 'text-[#E41E26]' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Shield className={`w-5 h-5 ${currentTab === 'admin' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-bold mt-1 telugu-heading truncate max-w-full">{t('nav.admin')}</span>
          </button>
        )}
      </div>
    </nav>
  );
};
