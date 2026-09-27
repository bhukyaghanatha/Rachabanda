import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { NewsItem, CategoryInfo, FollowItem } from '../types';
import { LocationInfo } from '../services/newsService';
import { fetchUserFollows, followTarget, unfollowTarget } from '../services/followService';
import { useAuth } from '../hooks/useAuth';
import { BreakingNewsBanner } from './BreakingNewsBanner';
import { CategoryGrid } from './CategoryGrid';
import { NewsCard } from './NewsCard';
import { DISTRICTS as FALLBACK_DISTRICTS } from '../data/mockNews';
import {
  Filter,
  Globe,
  Sparkles,
  Volume2,
  PhoneCall,
  ChevronRight,
  Plus,
  Check,
  Loader2,
  UserCheck,
  LogIn,
  X,
} from 'lucide-react';

interface HomeScreenProps {
  newsList: NewsItem[];
  breakingNews?: NewsItem;
  isLoading?: boolean;
  categories?: CategoryInfo[];
  districts?: string[];
  locations?: LocationInfo[];
  selectedCategoryId?: string | null;
  onSelectCategory?: (catId: string | null) => void;
  onSelectNews?: (news: NewsItem) => void;
  onPlayVoice?: (news: NewsItem, e: React.MouseEvent) => void;
  savedNewsIds: string[];
  onToggleSave: (newsId: string, e: React.MouseEvent) => void;
  onShare: (news: NewsItem, e: React.MouseEvent) => void;
  onOpenFlipMode: () => void;
  initialDistrict?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  newsList,
  breakingNews,
  isLoading = false,
  categories,
  districts,
  locations,
  selectedCategoryId: propCategoryId = null,
  onSelectCategory,
  onSelectNews,
  onPlayVoice,
  savedNewsIds,
  onToggleSave,
  onShare,
  onOpenFlipMode,
  initialDistrict,
}) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  // If on /category/:slug, derive category; if on /location/:slug, derive location
  const isCategoryRoute = location.pathname.startsWith('/category');
  const isLocationRoute = location.pathname.startsWith('/location');

  const activeCategory = isCategoryRoute ? slug || null : propCategoryId;
  const [selectedDistrict, setSelectedDistrict] = useState(
    isLocationRoute && slug ? decodeURIComponent(slug) : initialDistrict || 'అన్ని ప్రాంతాలు'
  );
  // Independent news language filter (All, Telugu, English, Hindi)
  const [selectedNewsLanguage, setSelectedNewsLanguage] = useState<string>('all');

  // Real Supabase User Follows
  const [userFollows, setUserFollows] = useState<FollowItem[]>([]);
  const [_isLoadingFollows, setIsLoadingFollows] = useState<boolean>(false);
  const [mutatingTargetId, setMutatingTargetId] = useState<string | null>(null);

  // Load follows on mount and whenever authentication status changes
  useEffect(() => {
    let isMounted = true;
    async function loadFollows() {
      if (isAuthenticated && user?.id) {
        setIsLoadingFollows(true);
        try {
          const { data, error } = await fetchUserFollows();
          if (isMounted && !error && data) {
            setUserFollows(data);
          }
        } catch (err) {
          console.warn('Could not load user follows:', err);
        } finally {
          if (isMounted) setIsLoadingFollows(false);
        }
      } else {
        if (isMounted) setUserFollows([]);
      }
    }
    loadFollows();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isLocationRoute && slug) {
      setSelectedDistrict(decodeURIComponent(slug));
    }
  }, [slug, isLocationRoute]);

  const handleCategoryClick = (catId: string | null) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    if (catId) {
      navigate(`/category/${catId}`);
    } else {
      navigate('/');
    }
  };

  const handleDistrictClick = (dist: string) => {
    setSelectedDistrict(dist);
    if (dist === 'అన్ని ప్రాంతాలు') {
      navigate(activeCategory ? `/category/${activeCategory}` : '/');
    } else {
      navigate(`/location/${encodeURIComponent(dist)}`);
    }
  };

  const isFollowingView = activeCategory === 'following';

  // Resolve active category object and UUID
  const activeCategoryItem = categories?.find(
    (c) =>
      c.id.toLowerCase() === (activeCategory || '').toLowerCase() ||
      c.uuid === activeCategory ||
      (c.englishName && c.englishName.toLowerCase() === (activeCategory || '').toLowerCase())
  );
  const categoryTargetId = activeCategoryItem?.uuid || activeCategoryItem?.id;
  const isCategoryFollowed = Boolean(
    categoryTargetId &&
      userFollows.some((f) => f.followType === 'category' && f.targetId === categoryTargetId)
  );

  // Resolve active location object and UUID
  const activeLocationItem = locations?.find(
    (l) =>
      l.name === selectedDistrict ||
      l.slug.toLowerCase() === selectedDistrict.toLowerCase() ||
      l.english_name.toLowerCase() === selectedDistrict.toLowerCase()
  );
  const locationTargetId = activeLocationItem?.id;
  const isLocationFollowed = Boolean(
    locationTargetId &&
      userFollows.some((f) => f.followType === 'location' && f.targetId === locationTargetId)
  );

  const handleToggleFollow = async (
    followType: 'category' | 'location',
    targetId: string | undefined
  ) => {
    if (!targetId) return;

    if (!isAuthenticated || !user?.id) {
      openAuthModal();
      return;
    }

    const isCurrentlyFollowed = userFollows.some(
      (f) => f.followType === followType && f.targetId === targetId
    );

    setMutatingTargetId(targetId);

    if (isCurrentlyFollowed) {
      // Optimistic unfollow
      setUserFollows((prev) =>
        prev.filter((f) => !(f.followType === followType && f.targetId === targetId))
      );
      const { success, error } = await unfollowTarget(followType, targetId);
      if (!success || error) {
        const { data } = await fetchUserFollows();
        if (data) setUserFollows(data);
      }
    } else {
      // Optimistic follow
      const tempItem: FollowItem = {
        id: `temp-${Date.now()}`,
        userId: user.id,
        followType,
        targetId,
        createdAt: new Date().toISOString(),
      };
      setUserFollows((prev) => [...prev, tempItem]);
      const { data, error } = await followTarget(followType, targetId);
      if (error || !data) {
        const { data: refreshed } = await fetchUserFollows();
        if (refreshed) setUserFollows(refreshed);
      } else {
        setUserFollows((prev) =>
          prev.map((f) => (f.id === tempItem.id ? data : f))
        );
      }
    }
    setMutatingTargetId(null);
  };

  // Filter news items
  const followedCategoryIds = userFollows
    .filter((f) => f.followType === 'category')
    .map((f) => f.targetId);
  const followedLocationIds = userFollows
    .filter((f) => f.followType === 'location')
    .map((f) => f.targetId);

  // Map followed categories to slugs/names
  const followedCategorySlugs =
    categories
      ?.filter((c) => (c.uuid && followedCategoryIds.includes(c.uuid)) || followedCategoryIds.includes(c.id))
      .map((c) => c.id.toLowerCase()) || [];
  const followedCategoryNames =
    categories
      ?.filter((c) => (c.uuid && followedCategoryIds.includes(c.uuid)) || followedCategoryIds.includes(c.id))
      .map((c) => c.name) || [];

  // Map followed locations to slugs/names
  const followedLocationNames =
    locations
      ?.filter((l) => followedLocationIds.includes(l.id))
      .map((l) => l.name) || [];
  const followedLocationSlugs =
    locations
      ?.filter((l) => followedLocationIds.includes(l.id))
      .map((l) => l.slug.toLowerCase()) || [];

  const filteredNews = newsList.filter((item) => {
    if (isFollowingView) {
      if (!isAuthenticated) return false;
      const catMatch =
        (item.categorySlug && followedCategorySlugs.includes(item.categorySlug.toLowerCase())) ||
        followedCategoryNames.includes(item.category);
      const locMatch =
        (item.locationSlug && followedLocationSlugs.includes(item.locationSlug.toLowerCase())) ||
        followedLocationNames.some((lname) => item.location.includes(lname));
      return catMatch || locMatch;
    }

    const matchesCategory = activeCategory
      ? item.category.toLowerCase() === activeCategory.toLowerCase() ||
        (item.categorySlug && item.categorySlug.toLowerCase() === activeCategory.toLowerCase()) ||
        (activeCategory === 'khammam' && (item.location.includes('ఖమ్మం') || item.locationSlug === 'khammam')) ||
        (activeCategory === 'telangana' &&
          (item.location.includes('తెలంగాణ') || item.category.includes('తెలంగాణ') || item.locationSlug === 'telangana'))
      : true;

    const matchesDistrict =
      selectedDistrict === 'అన్ని ప్రాంతాలు'
        ? true
        : item.location.includes(selectedDistrict) ||
          (item.locationSlug && item.locationSlug.toLowerCase() === selectedDistrict.toLowerCase());

    // Independent News Language Filtering (News item language vs App UI language)
    const matchesNewsLanguage =
      selectedNewsLanguage === 'all'
        ? true
        : (item.language || 'te').toLowerCase() === selectedNewsLanguage.toLowerCase() ||
          (selectedNewsLanguage === 'te' && (item.language === 'telugu' || item.language === 'te' || !item.language)) ||
          (selectedNewsLanguage === 'en' && (item.language === 'english' || item.language === 'en')) ||
          (selectedNewsLanguage === 'hi' && (item.language === 'hindi' || item.language === 'hi'));

    return matchesCategory && matchesDistrict && matchesNewsLanguage;
  });

  return (
    <div className="pb-24 md:pb-12 bg-[#F8F9FA] min-h-screen">
      {/* 1. Breaking News Card matching top of Screen 1 */}
      {breakingNews && (
        <BreakingNewsBanner
          news={breakingNews}
          onSelectNews={onSelectNews ? onSelectNews : (n) => navigate(`/news/${n.id}`)}
          onPlayVoice={onPlayVoice ? onPlayVoice : (n) => navigate(`/voice/${n.id}`)}
          onViewAllBreaking={onOpenFlipMode}
        />
      )}

      {/* 2. District / Location Quick Pill Filter */}
      <div className="px-3 py-2 bg-white border-y border-neutral-100 flex items-center gap-2 overflow-x-auto scrollbar-none" role="region" aria-label="ప్రాంతాల వారీగా వార్తలు (Filter by District)">
        <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1 flex-shrink-0">
          <Filter className="w-3 h-3 text-neutral-600" />
          ప్రాంతం:
        </span>
        {(districts && districts.length > 0 ? districts : FALLBACK_DISTRICTS).map((dist) => {
          const isSelected = selectedDistrict === dist;
          return (
            <button
              key={dist}
              onClick={() => handleDistrictClick(dist)}
              aria-pressed={isSelected}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                isSelected
                  ? 'bg-[#E41E26] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {dist}
            </button>
          );
        })}
      </div>

      {/* 2b. News Language Filter (Completely Independent of App UI Language) */}
      <div className="px-3 py-1.5 bg-neutral-50/90 border-b border-neutral-200/70 flex items-center gap-2 overflow-x-auto scrollbar-none" role="region" aria-label="వార్తల భాష (News Language Filter)">
        <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1 flex-shrink-0">
          <Globe className="w-3 h-3 text-[#E41E26]" />
          వార్తల భాష:
        </span>
        {[
          { code: 'all', label: 'All / అన్నీ' },
          { code: 'te', label: 'తెలుగు' },
          { code: 'en', label: 'English' },
          { code: 'hi', label: 'हिंदी' },
        ].map((lang) => {
          const isSelected = selectedNewsLanguage === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setSelectedNewsLanguage(lang.code)}
              aria-pressed={isSelected}
              className={`px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                isSelected
                  ? 'bg-[#E41E26] text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>

      {/* 3. Category Quick Access Grid matching Screen 1 */}
      <CategoryGrid
        categories={categories}
        selectedCategoryId={activeCategory}
        onSelectCategory={handleCategoryClick}
      />

      {/* 4. Latest News Section Header ('తాజా వార్తలు' with 'మరిన్ని >' or Follow Button) */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-neutral-900 telugu-heading">
            {isFollowingView
              ? 'మీరు ఫాలో అవుతున్న వార్తలు'
              : activeCategory
              ? `వార్తలు: ${categories?.find((c) => c.id === activeCategory)?.name || activeCategory}`
              : selectedDistrict !== 'అన్ని ప్రాంతాలు'
              ? `${selectedDistrict} వార్తలు`
              : 'తాజా వార్తలు'}
          </h2>
          <span className="bg-red-100 text-[#E41E26] text-[10px] font-black px-2 py-0.5 rounded-full">
            LIVE
          </span>
        </div>

        {/* Follow Button for active category */}
        {!isFollowingView && activeCategory && categoryTargetId && (
          <button
            id="category-follow-btn"
            onClick={() => handleToggleFollow('category', categoryTargetId)}
            disabled={mutatingTargetId === categoryTargetId}
            aria-label={`${isCategoryFollowed ? 'వర్గాన్ని అన్‌ఫాలో చేయండి' : 'వర్గాన్ని ఫాలో అవ్వండి'}: ${categories?.find((c) => c.id === activeCategory)?.name || activeCategory}`}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
              isCategoryFollowed
                ? 'bg-neutral-800 text-white hover:bg-neutral-900'
                : 'bg-[#E41E26] text-white hover:bg-[#B71C1C]'
            } ${mutatingTargetId === categoryTargetId ? 'opacity-70 cursor-wait' : ''}`}
          >
            {mutatingTargetId === categoryTargetId ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>నవీకరిస్తోంది...</span>
              </>
            ) : isCategoryFollowed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ఫాలోయింగ్ / Following</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>ఫాలో / Follow</span>
              </>
            )}
          </button>
        )}

        {/* Follow Button for active location */}
        {!isFollowingView && !activeCategory && selectedDistrict !== 'అన్ని ప్రాంతాలు' && locationTargetId && (
          <button
            id="location-follow-btn"
            onClick={() => handleToggleFollow('location', locationTargetId)}
            disabled={mutatingTargetId === locationTargetId}
            aria-label={`${isLocationFollowed ? 'ప్రాంతాన్ని అన్‌ఫాలో చేయండి' : 'ప్రాంతాన్ని ఫాలో అవ్వండి'}: ${selectedDistrict}`}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
              isLocationFollowed
                ? 'bg-neutral-800 text-white hover:bg-neutral-900'
                : 'bg-[#E41E26] text-white hover:bg-[#B71C1C]'
            } ${mutatingTargetId === locationTargetId ? 'opacity-70 cursor-wait' : ''}`}
          >
            {mutatingTargetId === locationTargetId ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>నవీకరిస్తోంది...</span>
              </>
            ) : isLocationFollowed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ఫాలోయింగ్ / Following</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>ఫాలో / Follow</span>
              </>
            )}
          </button>
        )}

        {!activeCategory && selectedDistrict === 'అన్ని ప్రాంతాలు' && (
          <button
            onClick={onOpenFlipMode}
            aria-label="మరిన్ని తాజా వార్తలు (View more breaking news)"
            className="text-xs font-bold text-[#E41E26] hover:underline flex items-center gap-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] rounded"
          >
            <span>మరిన్ని</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 5. News Cards List / Following Feed */}
      <div className="px-3 sm:px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
            <span className="w-8 h-8 rounded-full bg-red-100 animate-ping opacity-75 mb-3" />
            <p className="text-xs font-bold text-neutral-600 telugu-heading">
              తాజా వార్తలు లోడ్ అవుతున్నాయి... (Loading News...)
            </p>
          </div>
        ) : isFollowingView && !isAuthenticated ? (
          <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-neutral-200/80 shadow-xs my-4">
            <div className="w-12 h-12 bg-red-100 text-[#E41E26] rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1.5 telugu-heading">
              లాగిన్ అవ్వండి / Please Sign In
            </h3>
            <p className="text-xs text-neutral-500 mb-4 max-w-sm mx-auto">
              మీరు ఫాలో అయ్యే వర్గాలు మరియు ప్రాంతాల తాజా సమాచారాన్ని ఇక్కడ చూడటానికి దయచేసి లాగిన్ అవ్వండి.
            </p>
            <button
              id="following-login-btn"
              onClick={openAuthModal}
              className="bg-[#E41E26] text-white px-5 py-2 rounded-full text-xs font-bold shadow-xs hover:bg-[#B71C1C] transition-colors inline-flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>లాగిన్ / Login</span>
            </button>
          </div>
        ) : isFollowingView && userFollows.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-neutral-200/80 shadow-xs my-4">
            <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1.5 telugu-heading">
              మీరు ఇంకా ఏ వర్గాన్ని లేదా ప్రాంతాన్ని ఫాలో అవ్వడం లేదు
            </h3>
            <p className="text-xs text-neutral-500 mb-4 max-w-sm mx-auto">
              మీకు ఆసక్తి ఉన్న కేటగిరీ (రాజకీయం, క్రీడలు...) లేదా ప్రాంతం పేజీకి వెళ్లి '+ ఫాలో' నొక్కండి.
            </p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-8 text-center border border-neutral-200 text-neutral-500 text-xs">
            {isFollowingView
              ? 'మీరు ఫాలో అవుతున్న వర్గాలు లేదా ప్రాంతాలకు సంబంధించి ప్రస్తుతం వార్తలు లేవు.'
              : 'ఎంచుకున్న కేటగిరీ లేదా ప్రాంతంలో వార్తలు లేవు. దయచేసి వేరే వర్గం ఎంచుకోండి.'}
          </div>
        ) : (
          filteredNews.map((news) => (
            <NewsCard
              key={news.id}
              news={news}
              onSelectNews={onSelectNews ? onSelectNews : (n) => navigate(`/news/${n.id}`)}
              onPlayVoice={onPlayVoice ? onPlayVoice : (n) => navigate(`/voice/${n.id}`)}
              isSaved={savedNewsIds.includes(news.id)}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ))
        )}
      </div>

      {/* 6. Authentic Promo Banner matching the bottom of mockup */}
      <div className="mt-8 mx-3 bg-[#B71C1C] rounded-2xl p-4 text-white shadow-md overflow-hidden relative border border-red-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-[#E41E26] flex items-center justify-center flex-shrink-0 shadow">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white telugu-heading">
                ప్రజల మాటే... మా వార్త
              </p>
              <p className="text-[11px] text-red-200">
                మీ ప్రాంతంలోని సమస్యలను మాకు నేరుగా పంపండి.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-center sm:text-right">
              <span className="text-xs font-black text-yellow-300 block">
                LOCAL | FAST | TRUSTED
              </span>
              <span className="text-[10px] text-white/80">
                రచ్చ బండ – VOICE న్యూస్ నెట్‌వర్క్
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
