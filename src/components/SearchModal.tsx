import React, { useState } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { NewsItem } from '../types';

interface SearchModalProps {
  newsList: NewsItem[];
  onClose: () => void;
  onSelectNews: (news: NewsItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  newsList,
  onClose,
  onSelectNews,
}) => {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? newsList.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.shortSummary.toLowerCase().includes(query.toLowerCase()) ||
          n.location.toLowerCase().includes(query.toLowerCase()) ||
          n.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-start p-3 sm:p-6">
      <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Header */}
        <div className="p-3 border-b border-neutral-200 flex items-center gap-2">
          <Search className="w-5 h-5 text-neutral-400 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="వార్త, ప్రాంతం లేదా అంశాన్ని వెతకండి..."
            className="flex-1 px-2 py-2 text-sm font-medium outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            రద్దు
          </button>
        </div>

        {/* Quick keywords suggestions */}
        {!query && (
          <div className="p-4 text-xs text-neutral-500">
            <span className="font-bold text-neutral-800 block mb-2">
              తరచూ శోధించే అంశాలు:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['ఖమ్మం వర్షం', 'ఇందిరమ్మ ఇళ్లు', 'మధిర ప్రమాదం', 'మిర్చి ధరలు', 'తెలంగాణ డీఎస్సీ'].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="bg-neutral-100 hover:bg-red-50 hover:text-[#E41E26] px-2.5 py-1 rounded-full transition-colors"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-neutral-100">
          {query && filtered.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              "{query}" కి సంబంధించి వార్తలు లభించలేదు.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onClose();
                  onSelectNews(item);
                }}
                className="py-2.5 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 rounded-xl px-2 transition-colors"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                    <span className="text-[#E41E26] font-bold">{item.location}</span>
                    <span>•</span>
                    <span>{item.timeAgo}</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 telugu-heading">
                    {item.title}
                  </h4>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
