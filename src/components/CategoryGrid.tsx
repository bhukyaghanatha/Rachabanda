import React from 'react';
import { CATEGORIES as FALLBACK_CATEGORIES } from '../data/mockNews';
import { CategoryInfo } from '../types';
import {
  MapPin,
  Compass,
  Landmark,
  Scale,
  ShieldAlert,
  Tractor,
  GraduationCap,
  Cross,
  Briefcase,
  MoreHorizontal,
  Trophy,
  Film,
  Globe,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface CategoryGridProps {
  categories?: CategoryInfo[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const items = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const renderIcon = (name: string, _color: string) => {
    const props = { className: 'w-5 h-5 text-white' };
    const lower = name.toLowerCase().replace(/[-_]/g, '');

    if (lower.includes('mappin') || lower.includes('local') || lower.includes('map')) {
      return <MapPin {...props} />;
    }
    if (lower.includes('compass') || lower.includes('telangana')) {
      return <Compass {...props} />;
    }
    if (lower.includes('landmark') || lower.includes('politics')) {
      return <Landmark {...props} />;
    }
    if (lower.includes('scale')) {
      return <Scale {...props} />;
    }
    if (lower.includes('shield') || lower.includes('crime')) {
      return <ShieldAlert {...props} />;
    }
    if (lower.includes('tractor') || lower.includes('farmer') || lower.includes('agri')) {
      return <Tractor {...props} />;
    }
    if (lower.includes('graduation') || lower.includes('edu')) {
      return <GraduationCap {...props} />;
    }
    if (lower.includes('cross') || lower.includes('health')) {
      return <Cross {...props} />;
    }
    if (lower.includes('briefcase') || lower.includes('job')) {
      return <Briefcase {...props} />;
    }
    if (lower.includes('trophy') || lower.includes('sport')) {
      return <Trophy {...props} />;
    }
    if (lower.includes('film') || lower.includes('cinema')) {
      return <Film {...props} />;
    }
    if (lower.includes('globe') || lower.includes('national')) {
      return <Globe {...props} />;
    }
    if (lower.includes('trending') || lower.includes('business')) {
      return <TrendingUp {...props} />;
    }
    if (lower.includes('sparkles') || lower.includes('devotion') || lower.includes('bhakti')) {
      return <Sparkles {...props} />;
    }
    return <MoreHorizontal {...props} />;
  };

  return (
    <div role="region" aria-label="వార్తా విభాగాలు (News Categories)" className="bg-white py-3 px-3 sm:px-4 rounded-none sm:rounded-2xl border-b sm:border border-neutral-100 shadow-xs my-0 sm:my-2">
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2.5 sm:gap-3">
        {items.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              onClick={() =>
                onSelectCategory(isSelected ? null : cat.id)
              }
              aria-label={`${cat.name} (${cat.englishName})`}
              aria-pressed={isSelected}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-150 group active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] ${
                isSelected
                  ? 'bg-red-50 ring-2 ring-[#E41E26]'
                  : 'hover:bg-neutral-50'
              }`}
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 duration-200"
                style={{ backgroundColor: cat.color || '#E41E26' }}
              >
                {renderIcon(cat.iconName, cat.color)}
              </div>
              <span className="text-[11px] font-bold text-neutral-800 mt-1.5 truncate max-w-full text-center leading-tight">
                {cat.name}
              </span>
              <span className="text-[9px] text-neutral-600 group-hover:text-neutral-700 truncate max-w-full text-center font-medium">
                {cat.englishName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
