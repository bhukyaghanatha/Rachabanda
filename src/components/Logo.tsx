import React from 'react';

interface LogoProps {
  variant?: 'header' | 'full' | 'icon' | 'badge' | 'footer' | 'admin';
  customLogoUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'header',
  customLogoUrl,
  className = '',
  size = 'md',
}) => {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="రచ్చ బండ - VOICE"
        className={`object-contain ${className}`}
      />
    );
  }

  // Header variant for the red app bar (White text on Red bg)
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2 cursor-pointer ${className}`}>
        {/* Microphone Badge */}
        <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-[#E41E26]"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 border border-white animate-ping" />
        </div>

        {/* Text */}
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="text-white font-extrabold text-lg tracking-tight telugu-heading">
              రచ్చ బండ
            </span>
          </div>
          <span className="text-[10px] font-bold text-yellow-300 tracking-wider flex items-center gap-1 uppercase">
            <span className="inline-block w-1.5 h-0.5 bg-yellow-300" />
            VOICE
          </span>
        </div>
      </div>
    );
  }

  // App Icon variant (Rounded container with microphone and Telugu text)
  if (variant === 'icon') {
    return (
      <div
        className={`relative w-20 h-20 rounded-2xl bg-gradient-to-b from-[#1E1E1E] to-[#0A0A0A] p-2 flex flex-col items-center justify-center shadow-xl border border-neutral-800 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B71C1C] to-[#E41E26] flex items-center justify-center shadow-md mb-1">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 text-white"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>
        <span className="text-white font-bold text-[11px] telugu-heading leading-tight">
          రచ్చ బండ
        </span>
        <span className="text-[8px] font-semibold text-[#E41E26] tracking-wider uppercase">
          — VOICE
        </span>
      </div>
    );
  }

  // Full Hero Logo with Tagline (as seen on top-left of mockup)
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Top Tagline */}
        <p className="text-sm font-semibold text-[#111111] tracking-wide mb-1 telugu-heading">
          ప్రజల మాటే... మా వార్త
        </p>

        {/* Central Graphic */}
        <div className="flex items-center gap-3 my-1">
          {/* Big Circular Microphone Emblem */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#E41E26] to-[#B71C1C] flex items-center justify-center shadow-lg border-2 border-white">
            <svg
              viewBox="0 0 24 24"
              className="w-9 h-9 text-white drop-shadow-md"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-3xl font-black tracking-tight text-[#111111] telugu-heading leading-none">
              రచ్చ బండ
            </span>
            <div className="inline-flex items-center gap-1.5 mt-1 bg-[#E41E26] text-white px-2 py-0.5 rounded text-xs font-bold tracking-widest uppercase">
              <span>— VOICE</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-2 bg-[#111111] text-white text-xs px-4 py-1 rounded-full font-medium tracking-wide">
          <span className="text-[#E41E26] font-bold">RACHA BANDA – VOICE</span>
          <span className="mx-2 text-neutral-500">|</span>
          <span className="text-neutral-300">LOCAL</span>
          <span className="mx-1 text-neutral-500">•</span>
          <span className="text-neutral-300">FAST</span>
          <span className="mx-1 text-neutral-500">•</span>
          <span className="text-neutral-300">TRUSTED</span>
        </div>
      </div>
    );
  }

  // Admin Dashboard header version
  if (variant === 'admin') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-8 h-8 rounded-full bg-[#E41E26] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor" aria-hidden="true">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-white font-bold text-base telugu-heading">
            రచ్చ బండ
          </span>
          <span className="text-[9px] font-semibold text-[#E41E26] bg-white/10 px-1 rounded inline-block mt-0.5 w-fit">
            VOICE ADMIN
          </span>
        </div>
      </div>
    );
  }

  return null;
};
