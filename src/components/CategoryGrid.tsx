import React from 'react';
import { CATEGORIES } from '../data/mockNews';
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
} from 'lucide-react';

interface CategoryGridProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const renderIcon = (name: string, color: string) => {
    const props = { className: 'w-5 h-5 text-white' };
    switch (name) {
      case 'MapPin':
        return <MapPin {...props} />;
      case 'Compass':
        return <Compass {...props} />;
      case 'Landmark':
        return <Landmark {...props} />;
      case 'Scale':
        return <Scale {...props} />;
      case 'ShieldAlert':
        return <ShieldAlert {...props} />;
      case 'Tractor':
        return <Tractor {...props} />;
      case 'GraduationCap':
        return <GraduationCap {...props} />;
      case 'Cross':
        return <Cross {...props} />;
      case 'Briefcase':
        return <Briefcase {...props} />;
      default:
        return <MoreHorizontal {...props} />;
    }
  };

  return (
    <div className="bg-white py-3 px-3 border-b border-neutral-100 shadow-xs">
      <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              onClick={() =>
                onSelectCategory(isSelected ? null : cat.id)
              }
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-150 group active:scale-95 ${
                isSelected
                  ? 'bg-red-50 ring-2 ring-[#E41E26]'
                  : 'hover:bg-neutral-50'
              }`}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                style={{ backgroundColor: cat.color }}
              >
                {renderIcon(cat.iconName, cat.color)}
              </div>
              <span
                className={`mt-1 text-[11px] font-bold text-center leading-tight truncate w-full ${
                  isSelected ? 'text-[#E41E26] font-extrabold' : 'text-neutral-700'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
