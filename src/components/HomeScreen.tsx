import React, { useState } from 'react';
import { NewsItem } from '../types';
import { BreakingNewsBanner } from './BreakingNewsBanner';
import { CategoryGrid } from './CategoryGrid';
import { NewsCard } from './NewsCard';
import { DISTRICTS } from '../data/mockNews';
import { Filter, Sparkles, Volume2, PhoneCall, ChevronRight } from 'lucide-react';

interface HomeScreenProps {
  newsList: NewsItem[];
  breakingNews: NewsItem;
  selectedCategoryId: string | null;
  onSelectCategory: (catId: string | null) => void;
  onSelectNews: (news: NewsItem) => void;
  onPlayVoice: (news: NewsItem, e: React.MouseEvent) => void;
  savedNewsIds: string[];
  onToggleSave: (newsId: string, e: React.MouseEvent) => void;
  onShare: (news: NewsItem, e: React.MouseEvent) => void;
  onOpenFlipMode: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  newsList,
  breakingNews,
  selectedCategoryId,
  onSelectCategory,
  onSelectNews,
  onPlayVoice,
  savedNewsIds,
  onToggleSave,
  onShare,
  onOpenFlipMode,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState('అన్ని ప్రాంతాలు');

  // Filter news items
  const filteredNews = newsList.filter((item) => {
    const matchesCategory = selectedCategoryId
      ? item.category.toLowerCase() === selectedCategoryId.toLowerCase() ||
        (selectedCategoryId === 'khammam' && item.location.includes('ఖమ్మం')) ||
        (selectedCategoryId === 'telangana' && (item.location.includes('తెలంగాణ') || item.category.includes('తెలంగాణ')))
      : true;

    const matchesDistrict =
      selectedDistrict === 'అన్ని ప్రాంతాలు'
        ? true
        : item.location.includes(selectedDistrict);

    return matchesCategory && matchesDistrict;
  });

  return (
    <div className="pb-24 bg-[#F8F9FA] min-h-screen">
      {/* 1. Breaking News Card matching top of Screen 1 */}
      <BreakingNewsBanner
        news={breakingNews}
        onSelectNews={onSelectNews}
        onPlayVoice={onPlayVoice}
        onViewAllBreaking={onOpenFlipMode}
      />

      {/* 2. District / Location Quick Pill Filter */}
      <div className="px-3 py-2 bg-white border-y border-neutral-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1 flex-shrink-0">
          <Filter className="w-3 h-3" />
          ప్రాంతం:
        </span>
        {DISTRICTS.map((dist) => {
          const isSelected = selectedDistrict === dist;
          return (
            <button
              key={dist}
              onClick={() => setSelectedDistrict(dist)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#E41E26] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {dist}
            </button>
          );
        })}
      </div>

      {/* 3. Category Quick Access Grid matching Screen 1 */}
      <CategoryGrid
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onSelectCategory}
      />

      {/* 4. Latest News Section Header ('తాజా వార్తలు' with 'మరిన్ని >') */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-neutral-900 telugu-heading">
            తాజా వార్తలు
          </h2>
          <span className="bg-red-100 text-[#E41E26] text-[10px] font-black px-2 py-0.5 rounded-full">
            LIVE
          </span>
        </div>

        <button
          onClick={onOpenFlipMode}
          className="text-xs font-bold text-[#E41E26] hover:underline flex items-center gap-0.5"
        >
          <span>మరిన్ని</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. News Cards List */}
      <div className="px-3 space-y-2.5">
        {filteredNews.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-neutral-200 text-neutral-500 text-xs">
            ఎంచుకున్న కేటగిరీ లేదా ప్రాంతంలో వార్తలు లేవు. దయచేసి వేరే వర్గం ఎంచుకోండి.
          </div>
        ) : (
          filteredNews.map((news) => (
            <NewsCard
              key={news.id}
              news={news}
              onSelectNews={onSelectNews}
              onPlayVoice={onPlayVoice}
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
