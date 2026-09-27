/**
 * @file ReporterScreen.tsx
 * @description Dashboard Overview & Navigation Screen for Rachabanda.
 * Provides welcome identity, live metrics, and clean card navigation to dedicated sub-routes.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Plus,
  Bookmark,
  Heart,
  ChevronRight,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle,
  Flag,
  BookOpen,
  HelpCircle,
  LogOut,
  Trash2,
  LogIn,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppLanguage } from '../i18n';
import { fetchMySubmissions } from '../services/submissionService';
import { fetchMyReports } from '../services/reportService';
import { fetchUserFollows } from '../services/followService';
import { NewsSubmission, ContentReport, FollowItem } from '../types';
import { DeleteAccountDialog } from './DeleteAccountDialog';

interface ReporterScreenProps {
  onOpenSubmitNews?: (resubmitFrom?: NewsSubmission) => void;
  submissions?: NewsSubmission[];
  onOpenAdmin?: () => void;
  districts?: string[];
  locations?: any[];
  categories?: any[];
  savedCount?: number;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onSelectNews?: (news: any) => void;
  onNavigateToSaved?: () => void;
}

export const ReporterScreen: React.FC<ReporterScreenProps> = ({
  onOpenSubmitNews,
  onOpenAdmin,
  savedCount = 0,
  onNavigateToSaved,
}) => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isAdmin, isEditor, openAuthModal, signOut, deleteAccount } = useAuth();
  const { t } = useAppLanguage();
  const isStaff = isAdmin || isEditor || profile?.role === 'admin' || profile?.role === 'editor';

  // Navigation targets from dashboard hub include overview, submissions, and reports
  type DashboardNavTarget = 'overview' | 'submissions' | 'reports';

  // Live Submissions, Reports, and Follows counts
  const [mySubmissions, setMySubmissions] = useState<NewsSubmission[]>([]);
  const [myReports, setMyReports] = useState<ContentReport[]>([]);
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (isAuthenticated && user?.id) {
        try {
          const [subsRes, reportsRes, followsRes] = await Promise.allSettled([
            fetchMySubmissions(user.id),
            fetchMyReports(),
            fetchUserFollows(),
          ]);

          if (isMounted) {
            if (subsRes.status === 'fulfilled' && subsRes.value.data) {
              setMySubmissions(subsRes.value.data);
            }
            if (reportsRes.status === 'fulfilled' && reportsRes.value.data) {
              setMyReports(reportsRes.value.data);
            }
            if (followsRes.status === 'fulfilled' && followsRes.value.data) {
              setFollows(followsRes.value.data);
            }
          }
        } catch (err) {
          console.warn('Error loading dashboard stats:', err);
        }
      } else {
        if (isMounted) {
          setMySubmissions([]);
          setMyReports([]);
          setFollows([]);
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const pendingCount = mySubmissions.filter((s) => s.status === 'pending').length;
  const publishedCount = mySubmissions.filter((s) => s.status === 'approved').length;
  const totalSubmissions = mySubmissions.length;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'editor':
        return { label: 'Editor', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'reporter':
        return { label: 'Reporter', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'citizen_reporter':
        return { label: 'Citizen Reporter', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Reader', color: 'bg-neutral-100 text-neutral-800 border-neutral-200' };
    }
  };

  const roleInfo = getRoleBadge(profile?.role);

  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { success, error } = await deleteAccount();
      if (!success || error) {
        setDeleteError(error?.message || 'ఖాతా తొలగించడం విఫలమైంది.');
        setIsDeleting(false);
      } else {
        setIsDeleteDialogOpen(false);
        navigate('/');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'ఊహించని లోపం సంభవించింది.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="pb-24 md:pb-12 bg-[#F8F9FA] min-h-screen">
      {/* Top Banner Ribbon */}
      <div className="bg-[#E41E26] text-white px-4 py-3 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-yellow-300" />
            <h1 className="text-base font-black tracking-wide telugu-heading">
              {t('dashboard.title')}
            </h1>
          </div>
          {isStaff && (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdmin || (() => navigate('/admin'))}
                aria-label={t('dashboard.adminDesk')}
                className="text-xs bg-black/25 hover:bg-black/40 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{t('dashboard.adminDesk')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Admin Dashboard Action Banner - Shown only to Admins/Editors */}
        {isStaff && (
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-neutral-700/80 rounded-2xl p-4.5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-red-400" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-black telugu-heading text-white">
                    {t('dashboard.adminDesk')}
                  </h2>
                  <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider">
                    {profile?.role || 'admin'}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1 leading-snug">
                  {t('dashboard.adminDeskDesc')}
                </p>
              </div>
            </div>
            <button
              id="reporter-admin-dashboard-btn"
              onClick={onOpenAdmin || (() => navigate('/admin'))}
              aria-label={t('dashboard.adminDesk')}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-white flex-shrink-0"
            >
              <span>అడ్మిన్ డెస్క్ తెరవండి</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Dynamic Welcome / Identity Card: Authenticated vs Guest */}
        {isAuthenticated ? (
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-neutral-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-neutral-900 telugu-heading">
                      {profile?.full_name || user?.user_metadata?.full_name || 'రచ్చబండ యూజర్'}
                    </h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    {user?.email}
                  </p>
                  {(profile?.district || profile?.mandal) && (
                    <p className="text-[11px] text-neutral-600 font-medium mt-0.5">
                      📍 {[profile.mandal, profile.district].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>{t('dashboard.myProfile')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white to-red-50/40 rounded-3xl p-6 border border-red-100 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#E41E26] mx-auto flex items-center justify-center shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 leading-tight telugu-heading">
                {t('dashboard.welcome')} • {t('dashboard.guestUser')}
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                {t('dashboard.guestNotice')}
              </p>
            </div>
            <button
              id="reporter-login-trigger-btn"
              onClick={openAuthModal}
              className="px-6 py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('common.login')} / {t('common.register')}</span>
            </button>
          </div>
        )}

        {/* Big Red '+ కొత్త వార్త' Button */}
        <button
          id="reporter-new-post-btn"
          onClick={() => (onOpenSubmitNews ? onOpenSubmitNews() : navigate('/submit'))}
          className="w-full py-3.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-2xl text-base font-black shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 telugu-heading cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>+ {t('submissions.newSubmission')}</span>
        </button>

        {/* Live Statistics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/my-submissions')}
            className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">My News</span>
            <span className="text-xl font-black text-neutral-900 mt-0.5">
              {totalSubmissions}
            </span>
          </button>

          <button
            onClick={() => navigate('/my-submissions')}
            className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center hover:border-amber-200 hover:bg-amber-50/20 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">Pending</span>
            <span className="text-xl font-black text-amber-600 mt-0.5">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => navigate('/my-submissions')}
            className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">Published</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5">
              {publishedCount}
            </span>
          </button>
        </div>

        {/* Quick Shortcuts: Saved Bookmarks & Follows */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="profile-saved-shortcut-btn"
            onClick={onNavigateToSaved || (() => navigate('/saved'))}
            className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E41E26] flex items-center justify-center flex-shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-neutral-500 block uppercase">సేవ్ చేసినవి</span>
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                <span>{savedCount} వార్తలు</span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </span>
            </div>
          </button>

          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-neutral-500 block uppercase">ఫాలో అవుతున్నవి</span>
              <span className="text-xs font-bold text-neutral-900">
                {follows.length} అంశాలు
              </span>
            </div>
          </div>
        </div>

        {/* DASHBOARD NAVIGATION CARDS MENU (#CHANGE 2 REQUIREMENT) */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden divide-y divide-neutral-100">
          {/* 1. My Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-neutral-900 block telugu-heading">
                  {t('dashboard.myProfile')}
                </span>
                <span className="text-xs text-neutral-500 block mt-0.5">
                  {t('dashboard.myProfileDesc')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {/* 2. My Submissions */}
          <button
            id="tab-submissions-btn"
            onClick={() => navigate('/my-submissions')}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 telugu-heading">
                    {t('dashboard.mySubmissions')}
                  </span>
                  {totalSubmissions > 0 && (
                    <span className="bg-red-100 text-[#E41E26] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {totalSubmissions}
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-500 block mt-0.5">
                  {t('dashboard.mySubmissionsDesc')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {/* 3. My Reports */}
          {isAuthenticated && (
            <button
              id="tab-reports-btn"
              onClick={() => navigate('/my-reports')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 telugu-heading">
                      {t('dashboard.myReports')}
                    </span>
                    {myReports.length > 0 && (
                      <span className="bg-neutral-100 text-neutral-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {myReports.length}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    {t('dashboard.myReportsDesc')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          )}

          {/* 4. Reporter Guidelines */}
          <button
            onClick={() => navigate('/guidelines')}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-neutral-900 block telugu-heading">
                  {t('dashboard.guidelines')}
                </span>
                <span className="text-xs text-neutral-500 block mt-0.5">
                  {t('dashboard.guidelinesDesc')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {/* 5. Help & Support */}
          <button
            onClick={() => navigate('/help')}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-neutral-900 block telugu-heading">
                  {t('dashboard.help')}
                </span>
                <span className="text-xs text-neutral-500 block mt-0.5">
                  {t('dashboard.helpDesc')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {/* 6. Logout Action */}
          {isAuthenticated && (
            <button
              id="reporter-logout-btn"
              onClick={() => signOut()}
              aria-label={t('dashboard.logout')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-red-50/40 transition-colors text-red-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block telugu-heading">
                    {t('dashboard.logout')}
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    ఖాతా నుండి సురక్షితంగా నిష్క్రమించండి
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          )}

          {/* 7. Delete Account Action */}
          {isAuthenticated && (
            <button
              id="reporter-delete-account-btn"
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label={t('dashboard.deleteAccount')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-red-50/40 transition-colors text-red-700 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-700">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block telugu-heading text-red-700">
                    {t('dashboard.deleteAccount')}
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    శాశ్వత ఖాతా తొలగింపు మరియు సమాచార క్లీనప్
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Accessible Two-step Permanent Account Deletion Dialog (#8E) */}
      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirmDelete={async () => {
          return await deleteAccount();
        }}
        onSuccess={() => {
          setIsDeleteDialogOpen(false);
          navigate('/');
        }}
      />
    </div>
  );
};
