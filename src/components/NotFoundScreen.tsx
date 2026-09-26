import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

export const NotFoundScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="mb-4">
        <Logo variant="icon" />
      </div>

      <span className="text-5xl font-black text-[#E41E26] font-mono tracking-wider">
        404
      </span>

      <h1 className="text-xl font-black text-neutral-900 mt-2 telugu-heading">
        పేజీ కనుగొనబడలేదు (Page Not Found)
      </h1>

      <p className="text-xs text-neutral-600 mt-2 max-w-sm leading-relaxed">
        మీరు వెతుకుతున్న వార్త లేదా పేజీ అందుబాటులో లేదు లేదా తొలగించబడి ఉండవచ్చు.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="మునుపటి పేజీకి వెనుకకు వెళ్లండి"
          className="flex items-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-600"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>వెనుకకు వెళ్లండి</span>
        </button>

        <button
          onClick={() => navigate('/')}
          aria-label="హోమ్ పేజీకి వెళ్లండి"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26]"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>హోమ్‌కి వెళ్లండి</span>
        </button>
      </div>
    </div>
  );
};
