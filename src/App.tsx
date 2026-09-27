import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  NewsItem,
  NewsSubmission,
  NewsComment,
  TopCategoryTab,
} from './types';
import { useNews } from './hooks/useNews';
import { fetchUserBookmarks, addBookmark, removeBookmark } from './services/userService';
import { getUnreadNotificationCount } from './services/notificationService';

import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { BottomNav } from './components/BottomNav';
import { LoadingFallback } from './components/LoadingFallback';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded routes & heavy components for performance & code-splitting
const AdminDashboard = React.lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const Way2NewsFlipView = React.lazy(() =>
  import('./components/Way2NewsFlipView').then((m) => ({ default: m.Way2NewsFlipView }))
);
const NewsDetailScreen = React.lazy(() =>
  import('./components/NewsDetailScreen').then((m) => ({ default: m.NewsDetailScreen }))
);
const VoicePlayerScreen = React.lazy(() =>
  import('./components/VoicePlayerScreen').then((m) => ({ default: m.VoicePlayerScreen }))
);
const SubmitNewsScreen = React.lazy(() =>
  import('./components/SubmitNewsScreen').then((m) => ({ default: m.SubmitNewsScreen }))
);
const ReporterScreen = React.lazy(() =>
  import('./components/ReporterScreen').then((m) => ({ default: m.ReporterScreen }))
);
const ProfileDetailsScreen = React.lazy(() =>
  import('./components/ProfileDetailsScreen').then((m) => ({ default: m.ProfileDetailsScreen }))
);
const MySubmissionsScreen = React.lazy(() =>
  import('./components/MySubmissionsScreen').then((m) => ({ default: m.MySubmissionsScreen }))
);
const MyReportsScreen = React.lazy(() =>
  import('./components/MyReportsScreen').then((m) => ({ default: m.MyReportsScreen }))
);
const GuidelinesScreen = React.lazy(() =>
  import('./components/GuidelinesScreen').then((m) => ({ default: m.GuidelinesScreen }))
);
const HelpSupportScreen = React.lazy(() =>
  import('./components/HelpSupportScreen').then((m) => ({ default: m.HelpSupportScreen }))
);
const VideoScreen = React.lazy(() =>
  import('./components/VideoScreen').then((m) => ({ default: m.VideoScreen }))
);
const SavedScreen = React.lazy(() =>
  import('./components/SavedScreen').then((m) => ({ default: m.SavedScreen }))
);
const NotFoundScreen = React.lazy(() =>
  import('./components/NotFoundScreen').then((m) => ({ default: m.NotFoundScreen }))
);
const CommentsDrawer = React.lazy(() =>
  import('./components/CommentsDrawer').then((m) => ({ default: m.CommentsDrawer }))
);
const NotificationsDrawer = React.lazy(() =>
  import('./components/NotificationsDrawer').then((m) => ({ default: m.NotificationsDrawer }))
);
const SearchModal = React.lazy(() =>
  import('./components/SearchModal').then((m) => ({ default: m.SearchModal }))
);

import { LanguageProvider } from './i18n';
import { LanguageSelectionScreen } from './components/LanguageSelectionScreen';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';

import {
  Smartphone,
  LayoutDashboard,
  Sparkles,
  Check,
  Lock,
  ShieldAlert,
  LogIn,
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Overlays / Modals
  const [isFlipReaderOpen, setIsFlipReaderOpen] = useState(false);
  const [commentingNewsId, setCommentingNewsId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication state
  const { user, profile, isAuthenticated, isAdmin, isEditor, isLoading: isAuthLoading, openAuthModal } = useAuth();

  // App Data State: Live Supabase News hook with graceful fallback
  const {
    newsList,
    setNewsList,
    categories,
    districts,
    locations,
    isLoading: isNewsLoading,
    refreshNews,
  } = useNews();

  const [submissions, setSubmissions] = useState<NewsSubmission[]>([]);
  const [savedNewsIds, setSavedNewsIds] = useState<string[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState<boolean>(false);

  // Load real bookmarks from Supabase when user authenticates
  useEffect(() => {
    let isCancelled = false;

    async function loadBookmarks() {
      if (user?.id) {
        setIsLoadingBookmarks(true);
        try {
          const { data, error } = await fetchUserBookmarks(user.id);
          if (!isCancelled) {
            if (error) {
              console.warn('Could not load user bookmarks:', error);
            } else {
              setSavedNewsIds(data);
            }
          }
        } catch (err) {
          console.warn('Error loading user bookmarks:', err);
        } finally {
          if (!isCancelled) {
            setIsLoadingBookmarks(false);
          }
        }
      } else {
        // Guest user: clear saved bookmarks
        setSavedNewsIds([]);
        setIsLoadingBookmarks(false);
      }
    }

    loadBookmarks();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // Load real unread notifications count from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function loadNotifCount() {
      if (user?.id) {
        try {
          const count = await getUnreadNotificationCount();
          if (!isCancelled) {
            setUnreadNotificationsCount(count);
          }
        } catch (err) {
          console.warn('Error loading unread notifications count:', err);
        }
      } else {
        if (!isCancelled) {
          setUnreadNotificationsCount(0);
        }
      }
    }

    loadNotifCount();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Determine current top tab based on path
  const getActiveTopTab = (): TopCategoryTab => {
    if (location.pathname === '/video') return 'వీడియో';
    if (location.pathname.startsWith('/voice')) return 'VOICE';
    if (location.pathname === '/category/more') return 'ఫోటోలు';
    if (location.pathname === '/category/following' || location.pathname === '/category/khammam') return 'ఫాలో';
    return 'హోం';
  };

  // Top category tab behavior
  const handleSelectTopTab = (tab: TopCategoryTab) => {
    if (tab === 'హోం') {
      navigate('/');
    } else if (tab === 'వీడియో') {
      navigate('/video');
    } else if (tab === 'VOICE') {
      navigate('/voice');
    } else if (tab === 'ఫోటోలు') {
      navigate('/category/more');
    } else if (tab === 'ఫాలో') {
      navigate('/category/following');
    }
  };

  // Toggle Bookmark with Supabase persistence and optimistic UI
  const handleToggleSave = async (newsId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Guest protection: prompt sign-in, do not touch Supabase, do not write fake records
    if (!isAuthenticated || !user?.id) {
      showToast('వార్తను సేవ్ చేయడానికి దయచేసి లాగిన్ అవ్వండి / Please sign in to save');
      openAuthModal();
      return;
    }

    const wasSaved = savedNewsIds.includes(newsId);

    // 1. Optimistic UI update
    if (wasSaved) {
      setSavedNewsIds((prev) => prev.filter((id) => id !== newsId));
      showToast('బుక్‌మార్క్ నుండి తొలగించబడింది');
    } else {
      setSavedNewsIds((prev) => [...prev, newsId]);
      showToast('వార్త సేవ్ చేయబడింది ✓');
    }

    // 2. Supabase DB mutation
    try {
      const { error } = wasSaved
        ? await removeBookmark(user.id, newsId)
        : await addBookmark(user.id, newsId);

      // 3. Rollback if error
      if (error) {
        console.error('Supabase bookmark error:', error);
        setSavedNewsIds((prev) =>
          wasSaved ? [...prev, newsId] : prev.filter((id) => id !== newsId)
        );
        showToast('బుక్‌మార్క్ అప్‌డేట్ చేయడం విఫలమైంది: ' + error.message);
      }
    } catch (err: any) {
      console.error('Supabase bookmark exception:', err);
      setSavedNewsIds((prev) =>
        wasSaved ? [...prev, newsId] : prev.filter((id) => id !== newsId)
      );
      showToast('బుక్‌మార్క్ అప్‌డేట్ చేయడం విఫలమైంది');
    }
  };

  // Share news handler
  const handleShare = (news: NewsItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareText = `*రచ్చ బండ - VOICE*\n${news.title}\n${news.shortSummary}\n\n👉 ప్రజల మాటే... మా వార్త: ${window.location.origin}/news/${news.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('వాట్సాప్ షేర్ మెసేజ్ కాపీ చేయబడింది! ✓');
    } else {
      showToast('వార్త షేర్ చేయండి!');
    }
  };

  // Comment count sync handler (syncs in-memory news items when comments are loaded/added/deleted)
  const handleCommentCountChange = (newsId: string, count: number) => {
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === newsId ? { ...item, commentsCount: count } : item
      )
    );
  };

  // Citizen submission approval in Admin Panel
  const handleApproveSubmission = (subId: string) => {
    // Update status in local submissions state if present
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: 'approved' } : s))
    );

    // Refresh real published news from Supabase
    refreshNews();
    showToast('వార్త ఆమోదించబడింది & లైవ్‌లోకి ప్రచురించబడింది! ✓');
  };

  const handleRejectSubmission = (subId: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: 'rejected' } : s))
    );
    showToast('వార్త తిరస్కరించబడింది.');
  };

  // Add new citizen news from form
  const handleNewCitizenSubmission = (newSub: NewsSubmission) => {
    setSubmissions((prev) => [newSub, ...prev]);
    showToast('మీ వార్త విజయవంతంగా పంపబడింది! న్యూస్ డెస్క్ పరిశీలిస్తుంది.');
  };

  const breakingNewsItem = newsList.find((n) => n.isBreaking) || newsList[0];
  const savedNewsItems = newsList.filter((n) => savedNewsIds.includes(n.id));

  // Determine route-specific display conditions
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDetailRoute = location.pathname.startsWith('/news/');
  const isVoiceRoute = location.pathname.startsWith('/voice');
  const isSubmitRoute = location.pathname === '/submit';

  const hideHeader = isDetailRoute || isVoiceRoute || isSubmitRoute;
  const hideBottomNav = isDetailRoute || isVoiceRoute;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 selection:bg-[#E41E26] selection:text-white">
      {/* Universal Top Switcher Bar (App View vs Admin Dashboard) */}
      <div className="bg-[#0A0A0A] border-b border-neutral-800 text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E41E26] animate-pulse" />
          <span className="font-extrabold text-white tracking-wide telugu-heading">
            రచ్చ బండ – VOICE
          </span>
          <span className="text-neutral-500 hidden sm:inline">|</span>
          <span className="text-neutral-400 hidden sm:inline">
            ప్రజల మాటే... మా వార్త (Telugu News Platform)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* News Portal View Button */}
          <button
            id="switch-view-mobile-btn"
            onClick={() => navigate('/')}
            aria-label="రచ్చ బండ న్యూస్ పోర్టల్ వీక్షణకి మారండి"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
              !isAdminRoute
                ? 'bg-[#E41E26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
            <span>న్యూస్ పోర్టల్</span>
          </button>

          {/* Admin Panel Dashboard Button - Only visible to Admins/Editors */}
          {(isAdmin || isEditor) && (
            <button
              id="switch-view-admin-btn"
              onClick={() => navigate('/admin')}
              aria-label="అడ్మిన్ డ్యాష్‌బోర్డ్‌కి మారండి"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                isAdminRoute
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>అడ్మిన్ డ్యాష్‌బోర్డ్</span>
            </button>
          )}

          {/* Flip Mode shortcut */}
          <button
            id="shortcut-flip-btn"
            onClick={() => setIsFlipReaderOpen(true)}
            aria-label="రచ్చ బండ 60-పదాల కార్డ్ రీడర్ ఫ్లిప్ మోడ్ తెరవండి"
            className="flex items-center gap-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-lg font-bold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400"
            title="రచ్చ బండ 60-పదాల కార్డ్ రీడర్"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">ఫ్లిప్ మోడ్</span>
          </button>
        </div>
      </div>

      {/* Main View Router */}
      <Routes>
        {/* Admin Dashboard Full Screen Route - Protected by Auth & Role */}
        <Route
          path="/admin"
          element={
            isAuthLoading ? (
              <LoadingFallback
                fullScreen
                label="అధికారాల పరిశీలన జరుగుతోంది... (Verifying permissions...)"
              />
            ) : !isAuthenticated ? (
              <div className="min-h-[calc(100vh-42px)] bg-neutral-900 flex items-center justify-center p-4">
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8 max-w-md w-full text-center text-white shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 text-[#E41E26] flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <Lock className="w-8 h-8" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-black telugu-heading mb-2">
                    అడ్మిన్ లాగిన్ అవసరం (Admin Login Required)
                  </h2>
                  <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
                    అడ్మిన్ డ్యాష్‌బోర్డ్ యాక్సెస్ చేయడానికి దయచేసి అడ్మిన్ లేదా ఎడిటర్ ఖాతాతో లాగిన్ అవ్వండి.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={openAuthModal}
                      aria-label="అడ్మిన్ ఖాతాతో లాగిన్ అవ్వండి"
                      className="w-full py-3 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
                    >
                      <LogIn className="w-4 h-4" aria-hidden="true" />
                      <span>లాగిన్ అవ్వండి (Login)</span>
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      aria-label="మొబైల్ యాప్‌కి తిరిగి వెళ్ళండి"
                      className="w-full py-2.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-xl font-bold text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-400"
                    >
                      మొబైల్ యాప్‌కి తిరిగి వెళ్ళండి
                    </button>
                  </div>
                </div>
              </div>
            ) : !isAdmin && !isEditor ? (
              <div className="min-h-[calc(100vh-42px)] bg-neutral-900 flex items-center justify-center p-4">
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8 max-w-md w-full text-center text-white shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                    <ShieldAlert className="w-8 h-8" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-black telugu-heading mb-2 text-amber-400">
                    యాక్సెస్ నిరాకరించబడింది (Access Denied)
                  </h2>
                  <p className="text-sm text-neutral-300 mb-2 leading-relaxed">
                    మీ ఖాతా (<span className="text-amber-300 font-mono text-xs">{user?.email}</span>) కి అడ్మిన్ లేదా ఎడిటర్ అధికారాలు లేవు.
                  </p>
                  <p className="text-xs text-neutral-300 mb-6">
                    మీ ప్రస్తుత పాత్ర: <span className="bg-neutral-700 px-2 py-0.5 rounded font-bold text-white uppercase text-[10px]">{profile?.role || 'reader'}</span>. ఈ విభాగాన్ని కేవలం నిర్వాహకులు మాత్రమే చూడగలరు.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    aria-label="హోమ్ పేజీకి తిరిగి వెళ్ళండి"
                    className="w-full py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl font-bold text-sm transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
                  >
                    హోమ్ పేజీకి తిరిగి వెళ్ళండి
                  </button>
                </div>
              </div>
            ) : (
              <ErrorBoundary fallbackTitle="అడ్మిన్ డ్యాష్‌బోర్డ్ లోడ్ చేయడంలో లోపం (Admin Load Error)">
                <React.Suspense
                  fallback={
                    <LoadingFallback
                      fullScreen
                      label="అడ్మిన్ డ్యాష్‌బోర్డ్ లోడ్ అవుతోంది... (Loading Admin Dashboard...)"
                    />
                  }
                >
                  <AdminDashboard
                    submissions={submissions}
                    onApproveSubmission={handleApproveSubmission}
                    onRejectSubmission={handleRejectSubmission}
                    onSwitchToMobile={() => navigate('/')}
                    publishedCount={newsList.length}
                    totalNewsCount={newsList.length}
                    onArticlePublished={refreshNews}
                  />
                </React.Suspense>
              </ErrorBoundary>
            )
          }
        />

        {/* Main News App Routes Shell */}
        <Route
          path="/*"
          element={
            <div className="w-full min-h-[calc(100vh-42px)] bg-[#F8F9FA] flex flex-col">
              {/* App Header */}
              {!hideHeader && (
                <Header
                  activeTopTab={getActiveTopTab()}
                  onSelectTopTab={handleSelectTopTab}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  unreadCount={unreadNotificationsCount}
                  onSwitchToAdmin={() => navigate('/admin')}
                  onToggleFlipMode={() => setIsFlipReaderOpen(true)}
                  isFlipMode={isFlipReaderOpen}
                />
              )}

              {/* Screen Content Routes */}
              <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
                <ErrorBoundary>
                  <React.Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <HomeScreen
                            newsList={newsList}
                            breakingNews={breakingNewsItem}
                            isLoading={isNewsLoading}
                            categories={categories}
                            districts={districts}
                            locations={locations}
                            onSelectNews={(n) => navigate(`/news/${n.id}`)}
                            onPlayVoice={(n) => navigate(`/voice/${n.id}`)}
                            savedNewsIds={savedNewsIds}
                            onToggleSave={handleToggleSave}
                            onShare={handleShare}
                            onOpenFlipMode={() => setIsFlipReaderOpen(true)}
                          />
                        }
                      />
                      <Route
                        path="/category/:slug"
                        element={
                          <HomeScreen
                            newsList={newsList}
                            breakingNews={breakingNewsItem}
                            isLoading={isNewsLoading}
                            categories={categories}
                            districts={districts}
                            locations={locations}
                            onSelectNews={(n) => navigate(`/news/${n.id}`)}
                            onPlayVoice={(n) => navigate(`/voice/${n.id}`)}
                            savedNewsIds={savedNewsIds}
                            onToggleSave={handleToggleSave}
                            onShare={handleShare}
                            onOpenFlipMode={() => setIsFlipReaderOpen(true)}
                          />
                        }
                      />
                      <Route
                        path="/location/:slug"
                        element={
                          <HomeScreen
                            newsList={newsList}
                            breakingNews={breakingNewsItem}
                            isLoading={isNewsLoading}
                            categories={categories}
                            districts={districts}
                            locations={locations}
                            onSelectNews={(n) => navigate(`/news/${n.id}`)}
                            onPlayVoice={(n) => navigate(`/voice/${n.id}`)}
                            savedNewsIds={savedNewsIds}
                            onToggleSave={handleToggleSave}
                            onShare={handleShare}
                            onOpenFlipMode={() => setIsFlipReaderOpen(true)}
                          />
                        }
                      />
                      <Route
                        path="/news/:id"
                        element={
                          <NewsDetailScreen
                            newsList={newsList}
                            onBack={() => navigate(-1)}
                            onOpenVoicePlayer={(n) => navigate(`/voice/${n.id}`)}
                            onSelectRelatedNews={(n) => navigate(`/news/${n.id}`)}
                            savedNewsIds={savedNewsIds}
                            onToggleSave={handleToggleSave}
                            onOpenComments={(id) => setCommentingNewsId(id)}
                            onShare={handleShare}
                          />
                        }
                      />
                      <Route
                        path="/voice"
                        element={
                          <VoicePlayerScreen
                            newsList={newsList}
                            onBack={() => navigate(-1)}
                            onShare={handleShare}
                          />
                        }
                      />
                      <Route
                        path="/voice/:id"
                        element={
                          <VoicePlayerScreen
                            newsList={newsList}
                            onBack={() => navigate(-1)}
                            onShare={handleShare}
                          />
                        }
                      />
                      <Route
                        path="/video"
                        element={
                          <VideoScreen
                            newsList={newsList}
                            onSelectNews={(n) => navigate(`/news/${n.id}`)}
                            onShare={handleShare}
                          />
                        }
                      />
                      <Route
                        path="/saved"
                        element={
                          <SavedScreen
                            savedNews={savedNewsItems}
                            onSelectNews={(n) => navigate(`/news/${n.id}`)}
                            onPlayVoice={(n) => navigate(`/voice/${n.id}`)}
                            onToggleSave={handleToggleSave}
                            onShare={handleShare}
                            onExploreNews={() => navigate('/')}
                            isAuthenticated={isAuthenticated}
                            onOpenAuthModal={openAuthModal}
                            isLoading={isLoadingBookmarks}
                          />
                        }
                      />
                      <Route
                        path="/submit"
                        element={
                          <SubmitNewsScreen
                            onBack={() => navigate(-1)}
                            onSubmitSuccess={handleNewCitizenSubmission}
                            categories={categories}
                            districts={districts}
                            locations={locations}
                          />
                        }
                      />
                      {/* Dashboard Overview Hub */}
                      <Route
                        path="/dashboard"
                        element={
                          <ReporterScreen
                            onOpenSubmitNews={(resubmitFrom) =>
                              navigate('/submit', { state: { resubmitFrom } })
                            }
                            submissions={submissions}
                            onOpenAdmin={() => navigate('/admin')}
                            districts={districts}
                            locations={locations}
                            categories={categories}
                            savedCount={savedNewsIds.length}
                            unreadCount={unreadNotificationsCount}
                            onOpenNotifications={() => setIsNotificationsOpen(true)}
                            onSelectNews={(n) => navigate(`/news/${n.id}`)}
                            onNavigateToSaved={() => navigate('/saved')}
                          />
                        }
                      />
                      {/* Legacy reporter route alias */}
                      <Route
                        path="/reporter"
                        element={
                          <ReporterScreen
                            onOpenSubmitNews={(resubmitFrom) =>
                              navigate('/submit', { state: { resubmitFrom } })
                            }
                            submissions={submissions}
                            onOpenAdmin={() => navigate('/admin')}
                            districts={districts}
                            locations={locations}
                            categories={categories}
                            savedCount={savedNewsIds.length}
                            unreadCount={unreadNotificationsCount}
                            onOpenNotifications={() => setIsNotificationsOpen(true)}
                            onSelectNews={(n) => navigate(`/news/${n.id}`)}
                            onNavigateToSaved={() => navigate('/saved')}
                          />
                        }
                      />
                      {/* Dedicated My Profile Page */}
                      <Route
                        path="/profile"
                        element={
                          <ProfileDetailsScreen
                            districts={districts}
                            locations={locations}
                          />
                        }
                      />
                      {/* Dedicated My Submissions Page */}
                      <Route
                        path="/my-submissions"
                        element={<MySubmissionsScreen />}
                      />
                      {/* Dedicated My Reports Page */}
                      <Route
                        path="/my-reports"
                        element={<MyReportsScreen />}
                      />
                      {/* Dedicated Reporter Guidelines Page */}
                      <Route
                        path="/guidelines"
                        element={<GuidelinesScreen />}
                      />
                      {/* Dedicated Help & Support Page */}
                      <Route
                        path="/help"
                        element={<HelpSupportScreen />}
                      />
                      <Route path="*" element={<NotFoundScreen />} />
                    </Routes>
                  </React.Suspense>
                </ErrorBoundary>
              </main>

              {/* Bottom Navigation (Mobile Only) */}
              {!hideBottomNav && (
                <BottomNav savedCount={savedNewsIds.length} />
              )}
            </div>
          }
        />
      </Routes>

      {/* 60-Word Rachabanda Card Reader Overlay */}
      {isFlipReaderOpen && (
        <ErrorBoundary fallbackTitle="ఫ్లిప్ రీడర్ లోడ్ చేయడంలో లోపం (Flip Reader Error)">
          <React.Suspense
            fallback={
              <LoadingFallback
                fullScreen
                label="ఫ్లిప్ రీడర్ లోడ్ అవుతోంది... (Loading Flip Reader...)"
              />
            }
          >
            <Way2NewsFlipView
              newsList={newsList}
              onClose={() => setIsFlipReaderOpen(false)}
              onSelectDetail={(n) => {
                setIsFlipReaderOpen(false);
                navigate(`/news/${n.id}`);
              }}
              onShare={handleShare}
            />
          </React.Suspense>
        </ErrorBoundary>
      )}

      {/* Comments Drawer */}
      {commentingNewsId && (
        <ErrorBoundary fallbackTitle="వ్యాఖ్యల విభాగం లోడ్ చేయడంలో లోపం (Comments Error)">
          <React.Suspense fallback={<LoadingFallback label="వ్యాఖ్యలు లోడ్ అవుతున్నాయి... (Loading Comments...)" />}>
            <CommentsDrawer
              newsId={commentingNewsId}
              newsTitle={
                newsList.find((n) => n.id === commentingNewsId)?.title || ''
              }
              onClose={() => setCommentingNewsId(null)}
              onCommentCountChange={handleCommentCountChange}
            />
          </React.Suspense>
        </ErrorBoundary>
      )}

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <ErrorBoundary fallbackTitle="నోటిఫికేషన్లు లోడ్ చేయడంలో లోపం (Notifications Error)">
          <React.Suspense fallback={<LoadingFallback label="నోటిఫికేషన్లు లోడ్ అవుతున్నాయి... (Loading Notifications...)" />}>
            <NotificationsDrawer
              onClose={() => setIsNotificationsOpen(false)}
              onSelectNotificationLink={(link) => {
                setIsNotificationsOpen(false);
                navigate(link);
              }}
              onNotificationsChange={async () => {
                const count = await getUnreadNotificationCount();
                setUnreadNotificationsCount(count);
              }}
            />
          </React.Suspense>
        </ErrorBoundary>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <ErrorBoundary fallbackTitle="శోధన విభాగం లోడ్ చేయడంలో లోపం (Search Error)">
          <React.Suspense fallback={<LoadingFallback label="శోధన సిద్ధమవుతోంది... (Loading Search...)" />}>
            <SearchModal
              newsList={newsList}
              onClose={() => setIsSearchOpen(false)}
              onSelectNews={(n) => {
                setIsSearchOpen(false);
                navigate(`/news/${n.id}`);
              }}
            />
          </React.Suspense>
        </ErrorBoundary>
      )}

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
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
        <AuthModal />
        <LanguageSelectionScreen />
      </AuthProvider>
    </LanguageProvider>
  );
}

