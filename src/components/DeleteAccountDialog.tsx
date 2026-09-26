/**
 * @file DeleteAccountDialog.tsx
 * @description Accessible two-step confirmation modal dialog for permanent account deletion.
 * Implements WAI-ARIA dialog semantics, keyboard focus trap, Escape dismissal,
 * loading states, and prevention of accidental deletion.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<{ success: boolean; error: Error | null }>;
  onSuccess: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const finalDeleteButtonRef = useRef<HTMLButtonElement>(null);

  // Capture active element before opening, restore upon closing
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setStep(1);
      setErrorMessage(null);
      setIsDeleting(false);

      // Focus safe cancel button on mount (never the destructive action)
      const timer = setTimeout(() => {
        if (cancelButtonRef.current) {
          cancelButtonRef.current.focus();
        } else if (dialogRef.current) {
          const firstFocusable = dialogRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
          if (firstFocusable) firstFocusable.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    } else {
      // Dialog closed: restore focus to previous trigger element safely
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function' &&
        document.body.contains(previousActiveElementRef.current)
      ) {
        try {
          previousActiveElementRef.current.focus();
        } catch {
          // Ignore focus errors
        }
      }
    }
  }, [isOpen]);

  // Handle Escape key and keyboard Tab focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to dismiss dialog (unless actively deleting)
      if (e.key === 'Escape') {
        if (!isDeleting) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      // Tab trap
      if (e.key === 'Tab') {
        if (!dialogRef.current) return;

        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleProceedToStep2 = () => {
    setErrorMessage(null);
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setErrorMessage(null);
    setStep(1);
    setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);
  };

  const handleExecuteDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = await onConfirmDelete();

      if (!result.success) {
        setErrorMessage(
          result.error?.message ||
            'ఖాతా తొలగింపు విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి. / Account deletion failed. Please try again.'
        );
        setIsDeleting(false);
        return;
      }

      // Success
      setIsDeleting(false);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'అనుకోని లోపం సంభవించింది. / An unexpected error occurred during account deletion.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-dialog-title"
      aria-describedby="delete-account-dialog-desc"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="delete-account-dialog-title" className="text-base font-bold text-neutral-900 telugu-heading leading-tight">
                ఖాతాను తొలగించండి
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">Delete Account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            aria-label="మూసివేయండి (Close dialog)"
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 1 ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            1
          </span>
          <span className={step === 1 ? 'text-neutral-900 font-bold' : 'text-neutral-500'}>
            వివరాలు (Consequences)
          </span>
          <span className="text-neutral-300">➔</span>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 2 ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            2
          </span>
          <span className={step === 2 ? 'text-neutral-900 font-bold' : 'text-neutral-500'}>
            తుది నిర్ధారణ (Final Confirmation)
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <p className="font-bold">లోపం సంభవించింది / Error:</p>
              <p className="text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Consequence Disclosure */}
        {step === 1 && (
          <div id="delete-account-dialog-desc" className="space-y-3.5 text-xs text-neutral-700">
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-red-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                మీ ఖాతాను తొలగిస్తే అది శాశ్వతం. ఈ చర్యను తిరిగి రద్దు చేయలేరు.
                <br />
                <span className="text-[11px] text-red-700">
                  Deleting your account is permanent and cannot be undone.
                </span>
              </p>
            </div>

            {/* Permanently Deleted List */}
            <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50/50 space-y-2">
              <p className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                శాశ్వతంగా తొలగించబడేవి (Permanently Deleted):
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-600 pl-1">
                <li>ప్రొఫైల్ వివరాలు & ఫోన్ నంబర్ (Profile & Phone)</li>
                <li>బుక్‌మార్క్‌లు (Saved Bookmarks)</li>
                <li>ఫాలోలు & ఇష్టాలు (Follows & Reactions)</li>
                <li>నోటిఫికేషన్‌లు (Notifications)</li>
                <li>లాగిన్ ఖాతా (Account Credentials & Sessions)</li>
              </ul>
            </div>

            {/* Anonymized List */}
            <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50/50 space-y-2">
              <p className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                అజ్ఞాతీకరించబడేవి (Anonymized & Retained):
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-600 pl-1">
                <li>
                  వ్యాఖ్యలు (Comments) → <span className="font-semibold text-neutral-800">"రచ్చబండ పాఠకుడు"</span>
                </li>
                <li>
                  గత సమర్పణలు (Submissions) → <span className="font-semibold text-neutral-800">"రచ్చబండ పౌరుడు"</span>
                </li>
                <li>
                  కంటెంట్ రిపోర్టులు (Content Reports) → రిపోర్టర్ వివరాలు తొలగించబడతాయి
                </li>
              </ul>
            </div>

            {/* Important Notes */}
            <div className="p-2.5 bg-neutral-100 rounded-xl text-[11px] text-neutral-600 space-y-1">
              <p>• పెండింగ్‌లో ఉన్న సమర్పణలు ఉపసంహరించబడి తొలగించబడతాయి (Pending submissions withdrawn).</p>
              <p>• ప్రచురించబడిన వార్తా కథనాలు అలాగే ఉంటాయి (Published news remains live).</p>
            </div>

            {/* Action Buttons for Step 1 */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                ref={cancelButtonRef}
                type="button"
                id="delete-account-cancel-btn-step1"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                రద్దు చేయండి (Cancel)
              </button>
              <button
                type="button"
                id="delete-account-proceed-btn"
                onClick={handleProceedToStep2}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <span>ముందుకు కొనసాగండి (Proceed)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Final Explicit Confirmation */}
        {step === 2 && (
          <div id="delete-account-dialog-desc" className="space-y-4 text-xs text-neutral-700">
            <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-950 space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-red-200 text-red-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm telugu-heading text-red-900">
                మీరు ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?
              </h4>
              <p className="text-[11px] text-red-800 leading-relaxed">
                ఈ బటన్‌ను నొక్కిన వెంటనే మీ ఖాతా, వ్యక్తిగత డేటా మరియు లాగిన్ సెషన్ శాశ్వతంగా తొలగించబడతాయి.
                <br />
                <span className="font-semibold text-red-900">Are you absolutely sure you want to permanently delete your account?</span>
              </p>
            </div>

            {/* Action Buttons for Step 2 */}
            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-neutral-100">
              <button
                type="button"
                id="delete-account-back-btn"
                onClick={handleBackToStep1}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>వెనుకకు (Back)</span>
              </button>

              <button
                ref={finalDeleteButtonRef}
                type="button"
                id="delete-account-final-confirm-btn"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-colors cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-red-500 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>తొలగిస్తోంది... (Deleting...)</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ఖాతాను శాశ్వతంగా తొలగించండి</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
