/**
 * @file ReportDialog.tsx
 * @description Reusable, accessible modal dialog for submitting content reports (#8D-2).
 * Supports reporting news articles and comments with 7 standardized reasons,
 * optional bounded details, bilingual Telugu/English copy, and full keyboard navigation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Flag,
  AlertTriangle,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageCircle,
} from 'lucide-react';
import {
  ContentReport,
  ContentReportType,
  ContentReportReason,
} from '../types';
import { createContentReport } from '../services/reportService';

export interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ContentReportType;
  contentId: string;
  contentTitle?: string;
  onSuccess?: (report: ContentReport) => void;
}

interface ReasonOption {
  value: ContentReportReason;
  telugu: string;
  english: string;
  description: string;
}

const REPORT_REASONS: ReasonOption[] = [
  {
    value: 'misinformation',
    telugu: 'తప్పుడు సమాచారం',
    english: 'Misinformation',
    description: 'వాస్తవాలు లేని లేదా తప్పుదోవ పట్టించే సమాచారం',
  },
  {
    value: 'hate_speech',
    telugu: 'ద్వేషపూరిత ప్రసంగం',
    english: 'Hate speech',
    description: 'వ్యక్తులు లేదా సమూహాలపై విద్వేషం రెచ్చగొట్టడం',
  },
  {
    value: 'harassment',
    telugu: 'వేధింపు',
    english: 'Harassment',
    description: 'వ్యక్తిగత బెదిరింపులు లేదా దూషణ',
  },
  {
    value: 'spam',
    telugu: 'స్పామ్',
    english: 'Spam',
    description: 'అనవసరమైన వాణిజ్య ప్రకటనలు లేదా పునరావృత సందేశాలు',
  },
  {
    value: 'inappropriate',
    telugu: 'అనుచిత కంటెంట్',
    english: 'Inappropriate content',
    description: 'అశ్లీలత లేదా కమ్యూనిటీ నిబంధనలకు విరుద్ధమైనది',
  },
  {
    value: 'copyright',
    telugu: 'కాపీరైట్ ఉల్లంఘన',
    english: 'Copyright',
    description: 'అనుమతి లేకుండా ఇతరుల సమాచారం/మీడియా కాపీ చేయడం',
  },
  {
    value: 'other',
    telugu: 'ఇతర కారణం',
    english: 'Other',
    description: 'పై వర్గాల్లో చేరని ఇతర సమస్య',
  },
];

const MAX_DETAILS_LENGTH = 500;

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
  return elements.filter((el) => {
    return (
      el.offsetWidth > 0 ||
      el.offsetHeight > 0 ||
      el.getClientRects().length > 0
    );
  });
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<ContentReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Capture active element before opening, reset form, set initial focus, and restore focus on close
  useEffect(() => {
    if (isOpen) {
      // A. Capture the element that triggered the dialog
      previousActiveElementRef.current = (document.activeElement as HTMLElement) || null;

      setSelectedReason(null);
      setDetails('');
      setErrorMessage(null);
      setIsSuccess(false);
      setIsSubmitting(false);

      // Move focus into the dialog, preferring the close button
      const timer = setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else if (dialogRef.current) {
          dialogRef.current.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        // C. Restore focus when the dialog closes
        const previousEl = previousActiveElementRef.current;
        if (previousEl && typeof previousEl.focus === 'function') {
          try {
            if (document.body.contains(previousEl)) {
              // Ensure we do not steal focus if another modal (e.g. AuthModal) or element was explicitly focused
              const currentActive = document.activeElement;
              const isFocusInsideDialog = dialogRef.current && dialogRef.current.contains(currentActive);
              if (!currentActive || currentActive === document.body || isFocusInsideDialog) {
                previousEl.focus();
              }
            }
          } catch {
            // Graceful fallback if element cannot be focused
          }
          previousActiveElementRef.current = null;
        }
      };
    }
  }, [isOpen, contentType, contentId]);

  // B. Keyboard focus trap (Tab / Shift+Tab) and Escape handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes the dialog
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Keyboard Tab trapping
      if (e.key === 'Tab') {
        const container = dialogRef.current;
        if (!container) return;

        const focusables = getFocusableElements(container);

        // Safe handling if zero focusable elements
        if (focusables.length === 0) {
          e.preventDefault();
          container.focus();
          return;
        }

        // Safe handling if one focusable element
        if (focusables.length === 1) {
          e.preventDefault();
          focusables[0].focus();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];
        const currentActive = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          // Shift + Tab: if on first element or focus is outside, wrap to last
          if (currentActive === firstElement || !container.contains(currentActive)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element or focus is outside, wrap to first
          if (currentActive === lastElement || !container.contains(currentActive)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedReason) {
      setErrorMessage('దయచేసి రిపోర్ట్ చేయడానికి ఒక కారణాన్ని ఎంచుకోండి. / Please select a reason for reporting.');
      return;
    }

    if (!contentId || !contentId.trim()) {
      setErrorMessage('కంటెంట్ ఐడీ లోపించింది. / Missing content identifier.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await createContentReport({
        contentType,
        contentId: contentId.trim(),
        reason: selectedReason,
        details: details.trim() ? details.trim().slice(0, MAX_DETAILS_LENGTH) : null,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess(data);
        }
        // Auto-close dialog after brief confirmation
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage('రిపోర్ట్ సమర్పించడంలో లోపం ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      aria-describedby="report-dialog-desc"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[92vh] flex flex-col focus:outline-none"
      >
        {/* Header Ribbon */}
        <div className="bg-[#E41E26] text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Flag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 id="report-dialog-title" className="text-base font-black tracking-wide leading-tight telugu-heading">
                రిపోర్ట్ చేయండి / Report Content
              </h2>
              <p id="report-dialog-desc" className="text-[11px] text-white/80 font-medium">
                {contentType === 'news' ? 'వార్తా కథనం పై ఫిర్యాదు' : 'కామెంట్ పై ఫిర్యాదు'} (
                {contentType === 'news' ? 'News Report' : 'Comment Report'})
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="విండోను మూసివేయండి (Close dialog)"
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Context Banner (if title provided) */}
        {contentTitle && (
          <div className="bg-neutral-50 px-5 py-2.5 border-b border-neutral-200 flex items-center gap-2 text-xs text-neutral-700 flex-shrink-0">
            {contentType === 'news' ? (
              <FileText className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            ) : (
              <MessageCircle className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            )}
            <span className="font-semibold text-neutral-500 flex-shrink-0">
              {contentType === 'news' ? 'వార్త:' : 'కామెంట్:'}
            </span>
            <span className="truncate font-medium text-neutral-800">{contentTitle}</span>
          </div>
        )}

        {/* Success Confirmation Screen */}
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 telugu-heading">
              రిపోర్ట్ సమర్పించబడింది!
            </h3>
            <p className="text-xs text-neutral-600 max-w-sm">
              మీ ఫిర్యాదు రికార్డ్ చేయబడింది. మా ఎడిటోరియల్ బృందం దీనిని సమీక్షించి తగిన చర్యలు తీసుకుంటుంది.
            </p>
            <p className="text-[11px] text-neutral-400 font-mono">
              Report submitted successfully. Thank you for keeping Rachabanda safe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Instruction */}
            <div>
              <div id="report-reason-heading" className="block text-xs font-bold text-neutral-800 telugu-heading mb-1.5">
                రిపోర్ట్ చేయడానికి కారణాన్ని ఎంచుకోండి <span className="text-red-500">*</span>
              </div>
              <p className="text-[11px] text-neutral-500 mb-3">
                కంటెంట్‌లో ఉన్న ప్రధాన సమస్యను సూచించే సరైన కారణాన్ని ఎంచుకోండి.
              </p>

              {/* Reasons Radio List */}
              <div
                role="radiogroup"
                aria-labelledby="report-reason-heading"
                className="space-y-2"
              >
                {REPORT_REASONS.map((reason) => {
                  const isChecked = selectedReason === reason.value;
                  return (
                    <label
                      key={reason.value}
                      htmlFor={`report-reason-${reason.value}`}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-[#E41E26] bg-red-50/40 ring-1 ring-[#E41E26]'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/70'
                      }`}
                    >
                      <input
                        id={`report-reason-${reason.value}`}
                        type="radio"
                        name="report_reason"
                        value={reason.value}
                        checked={isChecked}
                        onChange={() => setSelectedReason(reason.value)}
                        className="mt-1 w-4 h-4 text-[#E41E26] focus:ring-[#E41E26] border-neutral-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-neutral-900 telugu-heading">
                            {reason.telugu}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-medium">
                            / {reason.english}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          {reason.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Additional Details (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="report-details-textarea"
                  className="block text-xs font-bold text-neutral-800 telugu-heading"
                >
                  అదనపు వివరాలు (ఐచ్ఛికం) / Details (Optional)
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {details.length}/{MAX_DETAILS_LENGTH}
                </span>
              </div>
              <textarea
                id="report-details-textarea"
                rows={3}
                value={details}
                maxLength={MAX_DETAILS_LENGTH}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="సమస్యకు సంబంధించిన మరిన్ని వివరాలు ఇక్కడ రాయవచ్చు..."
                aria-label="అదనపు వివరాలు (Additional details for the report)"
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-red-200 outline-none resize-none text-neutral-800 placeholder:text-neutral-400 leading-relaxed"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                గమనిక: మీ వ్యక్తిగత గోప్యత రక్షించబడుతుంది. రిపోర్టర్ వివరాలు బహిరంగంగా కనిపించవు.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 cursor-pointer"
              >
                రద్దు చేయండి (Cancel)
              </button>
              <button
                id="report-submit-btn"
                type="submit"
                disabled={isSubmitting || !selectedReason}
                aria-label="రిపోర్ట్ పంపండి (Submit Report)"
                className="px-5 py-2.5 rounded-xl bg-[#E41E26] hover:bg-[#B71C1C] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E41E26] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>సమర్పిస్తోంది...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>రిపోర్ట్ పంపండి (Submit)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
