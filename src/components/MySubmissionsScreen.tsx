/**
 * @file MySubmissionsScreen.tsx
 * @description Dedicated My Submissions screen with status filtering, withdrawal modal, and resubmission.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  MapPin,
  Tag,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppLanguage } from '../i18n';
import { fetchMySubmissions, withdrawOwnSubmission } from '../services/submissionService';
import { NewsSubmission } from '../types';

export const MySubmissionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { t } = useAppLanguage();

  const [submissions, setSubmissions] = useState<NewsSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Withdrawal Modal State (#8F)
  const [withdrawModalSub, setWithdrawModalSub] = useState<NewsSubmission | null>(null);
  const withdrawModalSubmission = withdrawModalSub;
  const setSubmissionFilter = setFilter;
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const loadSubmissions = async () => {
    if (!isAuthenticated || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await fetchMySubmissions(user.id);
      setSubmissions(data || []);
    } catch (err) {
      console.warn('Failed to load user submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [isAuthenticated, user?.id]);

  const handleConfirmWithdraw = async () => {
    if (!withdrawModalSub) return;
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      const { success, error } = await withdrawOwnSubmission(withdrawModalSub.id);
      if (error || !success) {
        setWithdrawError(error?.message || 'వార్త ఉపసంహరణ విఫలమైంది. / Failed to withdraw submission.');
      } else {
        setWithdrawSuccess('వార్త విజయవంతంగా ఉపసంహరించబడింది! / Submission withdrawn successfully!');
        setWithdrawModalSub(null);
        await loadSubmissions();
        setTimeout(() => setWithdrawSuccess(null), 4000);
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'ఊహించని లోపం జరిగింది. / Unexpected error.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleResubmit = (sub: NewsSubmission) => {
    navigate('/submit', { state: { resubmitFrom: sub } });
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12 animate-in fade-in">
      {/* Top Navigation Bar with Back to Dashboard */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <button
          onClick={() => navigate('/dashboard')}
          aria-label={t('dashboard.backToDashboard')}
          className="flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-2 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('dashboard.backToDashboard')}</span>
        </button>

        <button
          onClick={() => navigate('/submit')}
          className="px-3.5 py-1.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('submissions.newSubmission')}</span>
        </button>
      </div>

      {/* Screen Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl shadow-lg border border-neutral-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black telugu-heading text-white">
              {t('submissions.title')}
            </h1>
            <p className="text-xs text-neutral-300">
              {t('submissions.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Success Feedback */}
      {withdrawSuccess && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{withdrawSuccess}</span>
        </div>
      )}

      {/* Not Logged In State */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E41E26] mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-base font-bold text-neutral-900 telugu-heading">
              లాగిన్ అవ్వండి (Login Required)
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              మీరు సమర్పించిన వార్తల స్థితిని మరియు ప్రచురణ వివరాలను వీక్షించడానికి దయచేసి లాగిన్ అవ్వండి.
            </p>
          </div>
          <button
            onClick={openAuthModal}
            className="px-6 py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogIn className="w-4 h-4" />
            <span>లాగిన్ అవ్వండి / Sign In</span>
          </button>
        </div>
      ) : (
        <>
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {t('submissions.all')} ({submissions.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              {t('submissions.pending')} ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              {t('submissions.approved')} ({approvedCount})
            </button>
            <button
              onClick={() => { setFilter('rejected'); setSubmissionFilter('rejected'); }}
              title={`తిరస్కరించబడింది (${rejectedCount})`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
              }`}
            >
              {/* తిరస్కరించబడింది ({rejectedCount}) */}
              {t('submissions.rejected')} ({rejectedCount})
            </button>
          </div>

          {/* Submissions List */}
          {isLoading ? (
            <div className="bg-white rounded-3xl p-12 border border-neutral-200/80 shadow-xs flex flex-col items-center justify-center gap-3 text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#E41E26]" />
              <span className="text-xs font-medium">{t('common.loading')}</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-neutral-200/80 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-neutral-800 telugu-heading">
                {submissions.length === 0 ? t('submissions.empty') : t('submissions.emptyFilter')}
              </h2>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                మీ గ్రామంలో లేదా పట్టణంలో జరుగుతున్న తాజా సంఘటనలను రచ్చబండతో పంచుకోండి.
              </p>
              <button
                onClick={() => navigate('/submit')}
                className="mt-2 px-5 py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('submissions.newSubmission')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => {
                const isPending = sub.status === 'pending';
                const isApproved = sub.status === 'approved';
                const isRejected = sub.status === 'rejected';

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-4.5 border border-neutral-200/80 shadow-xs space-y-3 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-500">
                          <span className="flex items-center gap-1 font-bold text-neutral-700">
                            <MapPin className="w-3 h-3 text-[#E41E26]" />
                            {sub.location || sub.locationText || 'తెలంగాణ'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-bold text-neutral-700">
                            <Tag className="w-3 h-3 text-neutral-500" />
                            {sub.category || sub.categoryText || 'సాధారణ'}
                          </span>
                          <span>•</span>
                          <span>{sub.timeAgo || (sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '')}</span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 telugu-heading leading-snug">
                          {sub.title}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 flex items-center gap-1 uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        {isApproved && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {isRejected && <AlertCircle className="w-3 h-3 text-red-600" />}
                        <span>
                          {isPending
                            ? t('submissions.pending')
                            : isApproved
                            ? t('submissions.approved')
                            : t('submissions.rejected')}
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {sub.details}
                    </p>

                    {/* Rejected Feedback Box */}
                    {isRejected && sub.rejectionReason && (
                      <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 text-xs text-red-800 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>{t('submissions.rejectionReason')}:</span>
                        </div>
                        <p className="text-red-700 italic">"{sub.rejectionReason}"</p>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 flex-wrap gap-2">
                      <div className="text-[10px] text-neutral-400 font-mono">
                        ID: {sub.id.slice(0, 8)}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => setWithdrawModalSub(sub)}
                            className="text-xs font-bold text-neutral-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-red-200 hover:bg-red-50/50 transition-colors cursor-pointer"
                          >
                            {t('submissions.withdraw')}
                          </button>
                        )}

                        {isRejected && (
                          <button
                            onClick={() => handleResubmit(sub)}
                            aria-label="మళ్లీ సమర్పించు (Resubmit)"
                            className="text-xs font-bold bg-[#E41E26] hover:bg-[#B71C1C] text-white px-3 py-1.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('submissions.resubmit')}</span>
                          </button>
                        )}

                        {isApproved && sub.publishedNewsId && (
                          <button
                            onClick={() => navigate(`/news/${sub.publishedNewsId}`)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{t('submissions.viewArticle')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* WITHDRAWAL CONFIRMATION MODAL (#8F) */}
      {withdrawModalSub && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 id="withdraw-modal-title" className="text-sm font-bold text-neutral-900 telugu-heading">
                వార్త ఉపసంహరణ / Withdraw Submission
              </h3>
              <p className="text-xs text-neutral-500">
                వార్తను ఉపసంహరించుకోవాలా? సమీక్షలో ఉన్న ఈ వార్తను డ్రాఫ్ట్ నుండి పూర్తిగా తొలగిస్తారు. ఈ చర్యను వెనక్కి తీసుకోలేరు.
              </p>
            </div>

            {withdrawError && (
              <div role="alert" className="bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-200 text-xs">
                {withdrawError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setWithdrawModalSub(null)}
                disabled={isWithdrawing}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                రద్దు చేయండి
              </button>
              <button
                type="button"
                id="withdraw-confirm-btn"
                onClick={handleConfirmWithdraw}
                disabled={isWithdrawing}
                aria-label="ఉపసంహరించు (Withdraw)"
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>తొలగిస్తోంది...</span>
                  </>
                ) : (
                  <span>ఉపసంహరించు</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
