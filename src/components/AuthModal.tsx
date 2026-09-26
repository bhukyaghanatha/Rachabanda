/**
 * @file AuthModal.tsx
 * @description Clean authentication modal for Rachabanda.
 * Supports Email + Password and Google OAuth with Telugu + English labels.
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '../services/authService';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultMode = 'login',
}) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    isConfigured,
  } = useAuth();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const handleClose = propOnClose || closeAuthModal;

  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('దయచేసి ఇమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి. / Please enter email and password.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('దయచేసి మీ పూర్తి పేరు నమోదు చేయండి. / Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి. / Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        // Clear password state immediately after submission
        setPassword('');
        if (error) {
          setErrorMessage(getFriendlyAuthErrorMessage(error));
        } else {
          setSuccessMessage('విజయవంతంగా లాగిన్ అయ్యారు! / Logged in successfully!');
          setTimeout(() => {
            handleClose();
            resetForm();
          }, 600);
        }
      } else {
        const { error } = await signUpWithEmail(email, password, fullName);
        setPassword('');
        if (error) {
          setErrorMessage(getFriendlyAuthErrorMessage(error));
        } else {
          setSuccessMessage(
            'ఖాతా విజయవంతంగా సృష్టించబడింది! / Account created successfully!'
          );
          setTimeout(() => {
            handleClose();
            resetForm();
          }, 800);
        }
      }
    } catch (err: any) {
      setPassword('');
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(getFriendlyAuthErrorMessage(error));
      }
    } catch (err: any) {
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-[#E41E26] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-lg font-black tracking-wide leading-tight telugu-heading">
                రచ్చ బండ
              </h2>
              <p className="text-[11px] text-white/80 font-medium">
                {mode === 'login' ? 'లాగిన్ / User Login' : 'కొత్త ఖాతా / Sign Up'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              handleClose();
            }}
            aria-label="మూసివేయండి (Close dialog)"
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Not Configured Info Notice */}
        {!isConfigured && (
          <div role="status" className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              ప్రివ్యూ మోడ్: Supabase క్రెడెన్షియల్స్ కాన్ఫిగర్ కానందున లాగిన్ ప్రస్తుతం పరిమితం చేయబడింది.
            </span>
          </div>
        )}

        {/* Tab Toggle */}
        <div role="tablist" aria-label="ఖాతా విధానం (Auth mode)" className="flex border-b border-neutral-200 bg-neutral-50/70 p-1.5 m-5 mb-4 rounded-2xl">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
              mode === 'login'
                ? 'bg-white text-[#E41E26] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            లాగిన్ / Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
              mode === 'signup'
                ? 'bg-white text-[#E41E26] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            రిజిస్ట్రేషన్ / Sign Up
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Google 1-Click Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            aria-label="Google తో లాగిన్ అవ్వండి (Continue with Google)"
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-300 shadow-2xs transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google తో కొనసాగండి / Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-neutral-200" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              లేదా / OR
            </span>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-full-name-input" className="block text-[11px] font-bold text-neutral-700 mb-1">
                  పూర్తి పేరు / Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    id="auth-full-name-input"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ఉదా: రవి కుమార్ (e.g. Ravi Kumar)"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50/70 border border-neutral-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E41E26]/20 focus:border-[#E41E26] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email-input" className="block text-[11px] font-bold text-neutral-700 mb-1">
                ఇమెయిల్ / Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  id="auth-email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50/70 border border-neutral-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E41E26]/20 focus:border-[#E41E26] transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password-input" className="block text-[11px] font-bold text-neutral-700 mb-1">
                పాస్‌వర్డ్ / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-neutral-50/70 border border-neutral-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E41E26]/20 focus:border-[#E41E26] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'పాస్‌వర్డ్‌ను దాచండి (Hide password)' : 'పాస్‌వర్డ్‌ను చూపించండి (Show password)'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 p-1 focus-visible:ring-2 focus-visible:ring-red-400 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label={isSubmitting ? 'ప్రాసెస్ అవుతోంది... (Processing)' : mode === 'login' ? 'లాగిన్ అవ్వండి (Sign In)' : 'ఖాతా తెరవండి (Create Account)'}
              className="w-full py-3 bg-[#E41E26] hover:bg-[#B71C1C] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ప్రాసెస్ అవుతోంది... / Processing...</span>
                </>
              ) : mode === 'login' ? (
                <span>లాగిన్ అవ్వండి / Sign In</span>
              ) : (
                <span>ఖాతా తెరవండి / Create Account</span>
              )}
            </button>
          </form>

          {/* Switch Prompt */}
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-neutral-600">
                ఇంకా ఖాతా లేదా?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold text-[#E41E26] hover:underline"
                >
                  రిజిస్టర్ అవ్వండి / Sign Up
                </button>
              </p>
            ) : (
              <p className="text-xs text-neutral-600">
                ఇప్పటికే ఖాతా ఉందా?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#E41E26] hover:underline"
                >
                  లాగిన్ అవ్వండి / Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
