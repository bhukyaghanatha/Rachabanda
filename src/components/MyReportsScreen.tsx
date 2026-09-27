/**
 * @file MyReportsScreen.tsx
 * @description Dedicated My Content Reports screen showing reports submitted by the current user.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, AlertCircle, Loader2, CheckCircle, Clock, ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppLanguage } from '../i18n';
import { fetchMyReports } from '../services/reportService';
import { ContentReport } from '../types';

export const MyReportsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { t } = useAppLanguage();

  const [reports, setReports] = useState<ContentReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const { data, error } = await fetchMyReports();
        if (isMounted) {
          if (error) {
            setErrorMessage(error.message);
          } else {
            setReports(data || []);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'రిపోర్టులు లోడ్ చేయడంలో లోపం జరిగింది');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: t('reports.pending'),
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Clock className="w-3 h-3 text-amber-600" />,
        };
      case 'reviewed':
        return {
          label: t('reports.reviewed'),
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <CheckCircle className="w-3 h-3 text-blue-600" />,
        };
      case 'actioned':
        return {
          label: t('reports.actioned'),
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
        };
      case 'dismissed':
      default:
        return {
          label: t('reports.dismissed'),
          color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
          icon: <ShieldAlert className="w-3 h-3 text-neutral-500" />,
        };
    }
  };

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

        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          {t('reports.title')}
        </span>
      </div>

      {/* Screen Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl shadow-lg border border-neutral-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black telugu-heading text-white">
              {t('reports.title')}
            </h1>
            <p className="text-xs text-neutral-300">
              {t('reports.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Not Logged In State */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E41E26] mx-auto flex items-center justify-center">
            <Flag className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-base font-bold text-neutral-900 telugu-heading">
              లాగిన్ అవ్వండి (Login Required)
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              మీరు సమర్పించిన కంటెంట్ నివేదికలను మరియు వాటి స్థితిని వీక్షించడానికి దయచేసి లాగిన్ అవ్వండి.
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
      ) : isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-neutral-200/80 shadow-xs flex flex-col items-center justify-center gap-3 text-neutral-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#E41E26]" />
          <span className="text-xs font-medium">{t('common.loading')}</span>
        </div>
      ) : errorMessage ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-neutral-200/80 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
            <Flag className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-neutral-800 telugu-heading">
            {t('reports.empty')}
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            మీరు వార్తా కథనాలలో లేదా వ్యాఖ్యలలో అభ్యంతరకర కంటెంట్‌ను చూసినప్పుడు రిపోర్ట్ చేయవచ్చు. మీరు సమర్పించిన నివేదికలు మరియు ఎడిటోరియల్ చర్యల వివరాలు ఇక్కడ కనిపిస్తాయి.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const badge = getStatusBadge(report.status);
            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-3 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-600 uppercase bg-neutral-100 px-2 py-0.5 rounded">
                      {report.contentType === 'news' ? 'వార్త / News' : 'కామెంట్ / Comment'}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      కారణం: {report.reason}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                </div>

                {report.details && (
                  <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 leading-relaxed">
                    {report.details}
                  </p>
                )}

                <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-50">
                  <span>
                    తేదీ: {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-mono text-[9px] text-neutral-400">
                    ID: {report.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
