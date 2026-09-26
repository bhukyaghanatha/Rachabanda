import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, AlertCircle } from 'lucide-react';
import { NewsItem } from '../types';
import { searchPublishedNews } from '../services/newsService';

interface SearchModalProps {
  newsList?: NewsItem[];
  onClose: () => void;
  onSelectNews: (news: NewsItem) => void;
}

const STATIC_SUGGESTIONS = [
  'ఖమ్మం',
  'క్రీడలు',
  'వరంగల్',
  'రైతులకు',
  'బస్ షెల్టర్లు',
  'పత్తి కొనుగోళ్లు',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  onClose,
  onSelectNews,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced server-side Supabase search (400ms debounce)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setSearchError(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await searchPublishedNews(trimmed, 25);
        if (error) {
          setSearchError('శోధనలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి. / Search error occurred.');
          setResults([]);
        } else {
          setResults(data);
        }
      } catch (err: any) {
        setSearchError(err?.message || 'Search error');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="వార్తల శోధన (Search News)"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-start p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Header */}
        <div className="p-3 border-b border-neutral-200 flex items-center gap-2 bg-white">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-[#E41E26] animate-spin ml-1 flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-neutral-500 ml-1 flex-shrink-0" />
          )}

          <input
            id="search-modal-input"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="వార్త, ప్రాంతం లేదా అంశాన్ని వెతకండి (Search news, location or topic)"
            placeholder="వార్త, ప్రాంతం లేదా అంశాన్ని వెతకండి... (Search news)"
            className="flex-1 px-2 py-2 text-sm font-medium outline-none text-neutral-800 placeholder:text-neutral-400"
          />

          {query && (
            <button
              id="search-clear-btn"
              onClick={() => setQuery('')}
              className="p-1 text-neutral-500 hover:text-neutral-800 rounded-full hover:bg-neutral-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
              title="క్లియర్ చేయండి"
              aria-label="శోధనను క్లియర్ చేయండి (Clear search query)"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            id="search-close-btn"
            onClick={onClose}
            aria-label="శోధన విండోను మూసివేయండి (Close search dialog)"
            className="px-2.5 py-1 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
          >
            రద్దు
          </button>
        </div>

        {/* Quick keywords suggestions when query is empty */}
        {!query && (
          <div className="p-4 text-xs text-neutral-600">
            <span className="font-bold text-neutral-800 block mb-2">
              తరచూ శోధించే అంశాలు (Suggested Searches):
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="సిఫార్సు చేయబడిన శోధన పదాలు">
              {STATIC_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  id={`search-suggestion-btn-${tag}`}
                  onClick={() => setQuery(tag)}
                  className="bg-neutral-100 hover:bg-red-50 hover:text-[#E41E26] px-2.5 py-1 rounded-full transition-colors text-xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-neutral-100" role="status" aria-live="polite">
          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-8 text-neutral-600 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-[#E41E26] animate-spin" />
              <span>వార్తలను శోధిస్తోంది... (Searching articles...)</span>
            </div>
          )}

          {/* Error state */}
          {!isLoading && searchError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 my-2" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Empty results state */}
          {!isLoading && !searchError && query.trim() && results.length === 0 && (
            <div className="text-center py-10 text-neutral-500 text-xs space-y-1">
              <p className="font-semibold text-neutral-700">
                "{query}" కి సంబంధించి వార్తలు లభించలేదు.
              </p>
              <p className="text-[11px] text-neutral-500">
                వేరొక పదం లేదా ప్రాంతం పేరుతో ప్రయత్నించండి.
              </p>
            </div>
          )}

          {/* Results list */}
          {!isLoading && !searchError && results.length > 0 && (
            <>
              <div className="pb-2 px-1 text-[11px] font-bold text-neutral-600 flex items-center justify-between">
                <span>శోధన ఫలితాలు ({results.length})</span>
                <span className="text-[10px] text-neutral-500 font-medium">లైవ్ వార్తలు</span>
              </div>
              {results.map((item) => (
                <div
                  key={item.id}
                  id={`search-result-item-${item.id}`}
                  onClick={() => {
                    onClose();
                    onSelectNews(item);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onClose();
                      onSelectNews(item);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={item.title}
                  className="py-2.5 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 rounded-xl px-2 transition-colors group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-12 rounded-lg object-cover flex-shrink-0 bg-neutral-100 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mb-0.5">
                      <span className="text-[#E41E26] font-bold">{item.location}</span>
                      <span>•</span>
                      <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded font-medium">
                        {item.category}
                      </span>
                      <span>•</span>
                      <span>{item.timeAgo}</span>
                    </div>
                    <h3 className="text-xs font-bold text-neutral-900 line-clamp-2 telugu-heading group-hover:text-[#E41E26] transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
