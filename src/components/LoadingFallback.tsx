import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  label?: string;
  fullScreen?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  label = 'లోడ్ అవుతోంది... (Loading...)',
  fullScreen = false,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 text-center select-none ${
        fullScreen
          ? 'min-h-[calc(100vh-42px)] bg-neutral-900 text-white'
          : 'min-h-[50vh] text-neutral-800'
      }`}
    >
      <div className="relative flex items-center justify-center mb-3">
        <span className="w-10 h-10 rounded-full bg-red-100 animate-ping opacity-75" />
        <Loader2
          className="w-6 h-6 text-[#E41E26] animate-spin absolute"
          aria-hidden="true"
        />
      </div>
      <p className="text-xs font-bold telugu-heading tracking-wide">
        {label}
      </p>
      <span className="sr-only">దయచేసి వేచి ఉండండి, పేజీ లోడ్ అవుతోంది</span>
    </div>
  );
};
