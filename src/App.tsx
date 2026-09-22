import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  NewsItem,
  NewsSubmission,
  NewsComment,
  TopCategoryTab,
} from './types';
import {
  INITIAL_NEWS,
  INITIAL_SUBMISSIONS,
  INITIAL_COMMENTS,
} from './data/mockNews';

import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { NewsDetailScreen } from './components/NewsDetailScreen';
import { VoicePlayerScreen } from './components/VoicePlayerScreen';
import { SubmitNewsScreen } from './components/SubmitNewsScreen';
import { ReporterScreen } from './components/ReporterScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { VideoScreen } from './components/VideoScreen';
import { SavedScreen } from './components/SavedScreen';
import { BottomNav } from './components/BottomNav';
import { Way2NewsFlipView } from './components/Way2NewsFlipView';
import { CommentsDrawer } from './components/CommentsDrawer';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { SearchModal } from './components/SearchModal';
import { NotFoundScreen } from './components/NotFoundScreen';

import {
  Smartphone,
  LayoutDashboard,
  Sparkles,
  Check,
} from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Overlays / Modals
  const [isFlipReaderOpen, setIsFlipReaderOpen] = useState(false);
  const [commentingNewsId, setCommentingNewsId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Phone frame mockup wrapper toggle on desktop
  const [isDeviceFramed, setIsDeviceFramed] = useState(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Data State
  const [newsList, setNewsList] = useState<NewsItem[]>(INITIAL_NEWS);
  const [submissions, setSubmissions] = useState<NewsSubmission[]>(INITIAL_SUBMISSIONS);
  const [comments, setComments] = useState<NewsComment[]>(INITIAL_COMMENTS);
  const [savedNewsIds, setSavedNewsIds] = useState<string[]>(['news-2']);

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
    if (location.pathname === '/category/khammam') return 'ఫాలో';
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
      navigate('/category/khammam');
    }
  };

  // Toggle Bookmark
  const handleToggleSave = (newsId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedNewsIds((prev) => {
      const exists = prev.includes(newsId);
      if (exists) {
        showToast('బుక్‌మార్క్ నుండి తొలగించబడింది');
        return prev.filter((id) => id !== newsId);
      } else {
        showToast('వార్త సేవ్ చేయబడింది ✓');
        return [...prev, newsId];
      }
    });
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

  // Add Comment handler
  const handleAddComment = (newsId: string, text: string, userName: string) => {
    const newComment: NewsComment = {
      id: `c-${Date.now()}`,
      newsId,
      userName,
      userLocation: 'ఖమ్మం',
      comment: text,
      timeAgo: 'ఇప్పుడే',
      likes: 1,
    };
    setComments((prev) => [newComment, ...prev]);

    // increment comment count in newsList
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === newsId
          ? { ...item, commentsCount: item.commentsCount + 1 }
          : item
      )
    );
    showToast('మీ కామెంట్ జోడించబడింది! ✓');
  };

  // Citizen submission approval in Admin Panel
  const handleApproveSubmission = (subId: string) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;

    // Update status
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: 'approved' } : s))
    );

    // Convert to live published news item!
    const publishedItem: NewsItem = {
      id: `news-${Date.now()}`,
      title: sub.title,
      shortSummary: sub.details,
      content: `${sub.details}\n\nస్థానిక పౌరుడు మరియు రిపోర్టర్ ${sub.reporterName} నుండి అందిన తాజా నివేదిక ప్రకారం, రచ్చ బండ న్యూస్ డెస్క్ దీనిని పరిశీలించి ఆమోదించింది.`,
      location: sub.location,
      category: sub.category,
      imageUrl:
        sub.imageUrl ||
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      timeAgo: 'కొద్దిసేపటి క్రితం',
      publishedDate: new Date().toLocaleDateString('te-IN'),
      reporterName: sub.reporterName,
      reporterId: 'RBV-CITIZEN',
      audioDuration: '0:50',
      likes: 42,
      commentsCount: 3,
      factChecked: true,
      audioNarratedText: `రచ్చ బండ ప్రత్యేక పౌర వార్త. ${sub.title}. ${sub.details}`,
    };

    setNewsList((prev) => [publishedItem, ...prev]);
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
    <div className="min-h-screen bg-neutral-900 text-neutral-900 selection:bg-[#E41E26] selection:text-white">
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
          {/* Mobile App View Button */}
          <button
            id="switch-view-mobile-btn"
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              !isAdminRoute
                ? 'bg-[#E41E26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>మొబైల్ యాప్</span>
          </button>

          {/* Admin Panel Dashboard Button */}
          <button
            id="switch-view-admin-btn"
            onClick={() => navigate('/admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              isAdminRoute
                ? 'bg-[#E41E26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>అడ్మిన్ డ్యాష్‌బోర్డ్</span>
          </button>

          {/* Flip Mode shortcut */}
          <button
            id="shortcut-flip-btn"
            onClick={() => setIsFlipReaderOpen(true)}
            className="flex items-center gap-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
            title="రచ్చ బండ 60-పదాల కార్డ్ రీడర్"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ఫ్లిప్ మోడ్</span>
          </button>

          {/* Device Frame Toggle for Desktop */}
          {!isAdminRoute && (
            <button
              onClick={() => setIsDeviceFramed(!isDeviceFramed)}
              className="hidden lg:flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800"
            >
              {isDeviceFramed ? 'ఫుల్ స్క్రీన్' : 'ఫోన్ ఫ్రేమ్'}
            </button>
          )}
        </div>
      </div>

      {/* Main View Router */}
      <Routes>
        {/* Admin Dashboard Full Screen Route */}
        <Route
          path="/admin"
          element={
            <AdminDashboard
              submissions={submissions}
              onApproveSubmission={handleApproveSubmission}
              onRejectSubmission={handleRejectSubmission}
              onSwitchToMobile={() => navigate('/')}
              publishedCount={newsList.length}
              totalNewsCount={125 + newsList.length - INITIAL_NEWS.length}
            />
          }
        />

        {/* Mobile App Routes Shell */}
        <Route
          path="/*"
          element={
            <div className="flex items-center justify-center min-h-[calc(100vh-42px)] p-0 lg:py-6 bg-neutral-900">
              <div
                className={`w-full bg-white transition-all overflow-hidden ${
                  isDeviceFramed
                    ? 'max-w-[440px] rounded-none sm:rounded-[36px] shadow-2xl border-0 sm:border-[8px] sm:border-neutral-800 sm:ring-1 sm:ring-neutral-700 min-h-[780px]'
                    : 'max-w-xl shadow-xl'
                }`}
              >
                {/* Phone Notch/Speaker bar (only in phone frame mode) */}
                {isDeviceFramed && (
                  <div className="hidden sm:flex items-center justify-between px-6 pt-2.5 pb-1 bg-[#E41E26] text-white text-[11px] font-mono">
                    <span>9:41</span>
                    <div className="w-20 h-4 bg-black rounded-full mx-auto" />
                    <div className="flex items-center gap-1 text-[10px]">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* App Header */}
                {!hideHeader && (
                  <Header
                    activeTopTab={getActiveTopTab()}
                    onSelectTopTab={handleSelectTopTab}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    unreadCount={newsList.filter((n) => n.isBreaking).length}
                    onSwitchToAdmin={() => navigate('/admin')}
                    onToggleFlipMode={() => setIsFlipReaderOpen(true)}
                    isFlipMode={isFlipReaderOpen}
                  />
                )}

                {/* Screen Content Routes */}
                <main>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <HomeScreen
                          newsList={newsList}
                          breakingNews={breakingNewsItem}
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
                          isSaved={false}
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
                        />
                      }
                    />
                    <Route
                      path="/submit"
                      element={
                        <SubmitNewsScreen
                          onBack={() => navigate(-1)}
                          onSubmitSuccess={handleNewCitizenSubmission}
                        />
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ReporterScreen
                          onOpenSubmitNews={() => navigate('/submit')}
                          submissions={submissions}
                          onOpenAdmin={() => navigate('/admin')}
                        />
                      }
                    />
                    <Route path="*" element={<NotFoundScreen />} />
                  </Routes>
                </main>

                {/* Bottom Navigation */}
                {!hideBottomNav && (
                  <BottomNav savedCount={savedNewsIds.length} />
                )}
              </div>
            </div>
          }
        />
      </Routes>

      {/* 60-Word Rachabanda Card Reader Overlay */}
      {isFlipReaderOpen && (
        <Way2NewsFlipView
          newsList={newsList}
          onClose={() => setIsFlipReaderOpen(false)}
          onSelectDetail={(n) => {
            setIsFlipReaderOpen(false);
            navigate(`/news/${n.id}`);
          }}
          onShare={handleShare}
        />
      )}

      {/* Comments Drawer */}
      {commentingNewsId && (
        <CommentsDrawer
          newsId={commentingNewsId}
          newsTitle={
            newsList.find((n) => n.id === commentingNewsId)?.title || ''
          }
          comments={comments}
          onClose={() => setCommentingNewsId(null)}
          onAddComment={handleAddComment}
        />
      )}

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <NotificationsDrawer
          notifications={newsList.filter((n) => n.isBreaking || n.factChecked)}
          onClose={() => setIsNotificationsOpen(false)}
          onSelectNews={(n) => {
            setIsNotificationsOpen(false);
            navigate(`/news/${n.id}`);
          }}
        />
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal
          newsList={newsList}
          onClose={() => setIsSearchOpen(false)}
          onSelectNews={(n) => {
            setIsSearchOpen(false);
            navigate(`/news/${n.id}`);
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
