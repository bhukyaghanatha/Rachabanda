import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  HelpCircle,
  BookOpen,
  LogOut,
  Bell,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LogIn,
  Camera,
  Video,
  Mic,
  Edit3,
  Bookmark,
  Heart,
  X,
  Loader2,
  AlertCircle,
  Check,
  ExternalLink,
  MapPin,
  Tag,
  Phone,
  Info,
  Flag,
  Trash2,
} from 'lucide-react';
import { NewsSubmission, FollowItem, ContentReport } from '../types';
import { useAuth } from '../hooks/useAuth';
import { fetchMySubmissions, withdrawOwnSubmission } from '../services/submissionService';
import { uploadUserAvatar } from '../services/userService';
import { fetchUserFollows } from '../services/followService';
import { formatTimeAgo } from '../services/newsService';
import { fetchMyReports } from '../services/reportService';
import { useNavigate } from 'react-router-dom';
import { DeleteAccountDialog } from './DeleteAccountDialog';

interface ReporterScreenProps {
  onOpenSubmitNews?: (resubmitFrom?: NewsSubmission) => void;
  submissions?: NewsSubmission[];
  onOpenAdmin: () => void;
  districts?: any[];
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
  districts = [],
  savedCount = 0,
  unreadCount = 0,
  onOpenNotifications,
  onSelectNews,
  onNavigateToSaved,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'submissions' | 'reports' | 'guidelines' | 'support'>('profile');
  const { user, profile, isAuthenticated, openAuthModal, signOut, deleteAccount, updateProfile, refreshProfile } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // User Reports State (#8D-2)
  const [myReports, setMyReports] = useState<ContentReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const loadUserReports = async () => {
    if (!user?.id) {
      setMyReports([]);
      return;
    }
    setIsLoadingReports(true);
    setReportsError(null);
    try {
      const { data, error } = await fetchMyReports();
      if (error) {
        setReportsError(error.message);
      } else {
        setMyReports(data || []);
      }
    } catch (err: any) {
      setReportsError(err.message || 'రిపోర్టులు లోడ్ చేయడంలో లోపం / Failed to load reports');
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    loadUserReports();
  }, [user?.id]);

  // Submissions State
  const [mySubmissions, setMySubmissions] = useState<NewsSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(false);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Follows State
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [isLoadingFollows, setIsLoadingFollows] = useState<boolean>(false);

  // Edit Profile Modal State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editDistrict, setEditDistrict] = useState<string>('');
  const [editMandal, setEditMandal] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Avatar Upload State
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

  // Withdrawal Modal State (#8F)
  const [withdrawModalSubmission, setWithdrawModalSubmission] = useState<NewsSubmission | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Fetch Submissions helper (re-used on mount and after withdrawal)
  const loadUserSubmissions = async () => {
    if (user?.id) {
      setIsLoadingSubmissions(true);
      try {
        const { data } = await fetchMySubmissions(user.id);
        setMySubmissions(data || []);
      } catch (err) {
        console.warn('Could not load user submissions:', err);
      } finally {
        setIsLoadingSubmissions(false);
      }
    } else {
      setMySubmissions([]);
    }
  };

  useEffect(() => {
    loadUserSubmissions();
  }, [user?.id]);

  // Handle Confirmed Pending Submission Withdrawal
  const handleConfirmWithdraw = async () => {
    if (!withdrawModalSubmission) return;
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      const { success, error } = await withdrawOwnSubmission(withdrawModalSubmission.id);
      if (error || !success) {
        setWithdrawError(error?.message || 'వార్త ఉపసంహరణ విఫలమైంది. / Failed to withdraw submission.');
      } else {
        setWithdrawSuccess('వార్త విజయవంతంగా ఉపసంహరించబడింది! / Submission withdrawn successfully!');
        setWithdrawModalSubmission(null);
        await loadUserSubmissions();
        setTimeout(() => setWithdrawSuccess(null), 4000);
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'ఊహించని లోపం జరిగింది. / Unexpected error.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle Resubmit of Rejected Submission (Opens SubmitNewsScreen with prefilled values)
  const handleResubmit = (sub: NewsSubmission) => {
    navigate('/submit', { state: { resubmitFrom: sub } });
    if (onOpenSubmitNews) {
      onOpenSubmitNews(sub);
    }
  };

  // Fetch Follows
  useEffect(() => {
    async function loadFollows() {
      if (user?.id) {
        setIsLoadingFollows(true);
        try {
          const { data } = await fetchUserFollows();
          setFollows(data || []);
        } catch (err) {
          console.warn('Could not load user follows:', err);
        } finally {
          setIsLoadingFollows(false);
        }
      } else {
        setFollows([]);
      }
    }
    loadFollows();
  }, [user?.id]);

  // Compute live reporter stats from user's real database records
  const activeSubmissions = user?.id ? mySubmissions : [];
  const pendingCount = activeSubmissions.filter((s) => s.status === 'pending').length;
  const publishedCount = activeSubmissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = activeSubmissions.filter((s) => s.status === 'rejected').length;
  const totalNews = activeSubmissions.length;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'అడ్మినిస్ట్రేటర్ (Admin)', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'editor':
        return { label: 'ఎడిటర్ (Editor)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'reporter':
        return { label: 'జర్నలిస్ట్ (Reporter)', color: 'bg-red-100 text-[#E41E26] border-red-200' };
      case 'citizen_reporter':
        return { label: 'సిటిజన్ రిపోర్టర్ (Citizen Reporter)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'reader':
      default:
        return { label: 'పాఠకులు (Reader)', color: 'bg-neutral-100 text-neutral-800 border-neutral-200' };
    }
  };

  const roleInfo = getRoleBadge(profile?.role);
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'అతిథి యూజర్';
  const displayLocation =
    profile?.district || profile?.mandal
      ? `${profile?.mandal ? profile.mandal + ', ' : ''}${profile?.district || ''}`
      : 'తెలంగాణ';

  // Open Edit Profile Modal
  const handleOpenEdit = () => {
    setEditFullName(profile?.full_name || '');
    setEditBio(profile?.bio || '');
    setEditDistrict(profile?.district || '');
    setEditMandal(profile?.mandal || '');
    setEditPhone(profile?.phone || '');
    setProfileSaveSuccess(null);
    setProfileSaveError(null);
    setIsEditingProfile(true);
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setProfileSaveError('పేరు నమోదు చేయడం తప్పనిసరి. / Name is required.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(null);

    try {
      const { data, error } = await updateProfile({
        full_name: editFullName.trim(),
        bio: editBio.trim() || null,
        district: editDistrict.trim() || null,
        mandal: editMandal.trim() || null,
        phone: editPhone.trim() || null,
      });

      if (error) {
        setProfileSaveError(error.message || 'ప్రొఫైల్ సేవ్ చేయడంలో లోపం ఏర్పడింది.');
      } else if (data) {
        setProfileSaveSuccess('ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది! / Profile updated successfully!');
        setTimeout(() => {
          setIsEditingProfile(false);
          setProfileSaveSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      setProfileSaveError(err.message || 'అనుకోని లోపం జరిగింది.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Avatar File Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      const { url, error } = await uploadUserAvatar(file);
      if (error) {
        setAvatarError(error.message || 'అవతార్ అప్‌లోడ్ విఫలమైంది.');
      } else if (url) {
        await refreshProfile();
        setAvatarSuccess('అవతార్ విజయవంతంగా అప్‌డేట్ చేయబడింది! / Avatar updated!');
        setTimeout(() => setAvatarSuccess(null), 3000);
      }
    } catch (err: any) {
      setAvatarError(err.message || 'అవతార్ ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Filtered Submissions
  const filteredSubmissions = mySubmissions.filter((s) => {
    if (submissionFilter === 'pending') return s.status === 'pending';
    if (submissionFilter === 'approved') return s.status === 'approved';
    if (submissionFilter === 'rejected') return s.status === 'rejected';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-12">
      {/* Top Header matching Screen 5: Reporter App with lock badge */}
      <div className="bg-[#E41E26] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-yellow-300" />
            <h1 className="text-base font-black tracking-wide">Reporter App</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAdmin}
              className="text-xs bg-black/25 hover:bg-black/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors"
            >
              <span>అడ్మిన్ డెస్క్</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Dynamic Profile Card: Authenticated vs Guest */}
        {isAuthenticated ? (
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {/* Avatar with Camera Overlay */}
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#E41E26]/20 bg-neutral-100 flex-shrink-0 flex items-center justify-center shadow-inner relative">
                    {isUploadingAvatar ? (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    ) : null}

                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-[#E41E26]">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10" />
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    aria-label="అవతార్ చిత్రం అప్‌లోడ్ (Avatar image upload)"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />

                  {/* Camera icon button */}
                  <button
                    id="avatar-upload-btn"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    aria-label="అవతార్ చిత్రం మార్చండి (Change avatar photo)"
                    title="అవతార్ చిత్రం మార్చండి / Change Avatar"
                    className="absolute -bottom-1 -right-1 p-1 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-full shadow-md transition-transform active:scale-90 border-2 border-white z-20 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                {/* Profile Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base font-black text-neutral-900 leading-tight truncate">
                      {displayName}
                    </h2>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-neutral-600 mt-0.5">
                    ID: <span className="font-bold text-neutral-800">{user?.id?.slice(0, 8).toUpperCase() || 'RB-USER'}</span>
                  </p>
                  <p className="text-[11px] text-neutral-600 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#E41E26] flex-shrink-0" />
                    <span>{displayLocation}</span>
                  </p>
                </div>
              </div>

              {/* Top right actions: Notification Bell */}
              <button
                id="profile-notifications-btn"
                onClick={onOpenNotifications}
                aria-label="నోటిఫికేషన్లు (Notifications)"
                title="నోటిఫికేషన్లు (Notifications)"
                className="w-9 h-9 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-colors relative cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute 0 right-0 w-2.5 h-2.5 rounded-full bg-[#E41E26] ring-2 ring-white" />
                )}
              </button>
            </div>

            {/* Bio snippet if present */}
            {profile?.bio && (
              <p className="mt-3 text-xs text-neutral-700 bg-neutral-50 rounded-xl p-2.5 border border-neutral-100 leading-relaxed italic">
                "{profile.bio}"
              </p>
            )}

            {/* Avatar feedback */}
            {avatarSuccess && (
              <p role="status" className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                <Check className="w-3 h-3" />
                <span>{avatarSuccess}</span>
              </p>
            )}
            {avatarError && (
              <p role="alert" className="mt-2 text-[11px] text-red-600 font-medium flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                <span>{avatarError}</span>
              </p>
            )}

            {/* Edit Profile Button */}
            <div className="mt-3.5 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-600 font-medium">
                ఖాతా వివరాలు నిర్వహించండి
              </span>
              <button
                id="edit-profile-btn"
                onClick={handleOpenEdit}
                aria-label="ప్రొఫైల్ ఎడిట్ చేయండి (Edit Profile)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#E41E26]" />
                <span>ప్రొఫైల్ ఎడిట్ చేయండి</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white to-red-50/40 rounded-2xl p-4.5 border border-red-100 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#E41E26] mx-auto flex items-center justify-center shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 leading-tight telugu-heading">
                లాగిన్ చేయండి / Sign In
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                మీ రిపోర్టర్ ప్రొఫైల్ నిర్వహించడానికి మరియు వార్తలు పంపడానికి లాగిన్ అవ్వండి.
              </p>
            </div>
            <button
              id="reporter-login-trigger-btn"
              onClick={openAuthModal}
              className="w-full py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>లాగిన్ / రిజిస్టర్ అవ్వండి (Login / Sign Up)</span>
            </button>
          </div>
        )}

        {/* Big Red '+ కొత్త వార్త' Button matching Screen 5 */}
        <button
          id="reporter-new-post-btn"
          onClick={() => onOpenSubmitNews && onOpenSubmitNews()}
          className="w-full py-3.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-base font-black shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 telugu-heading cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>+ కొత్త వార్త రాయండి</span>
        </button>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* My News */}
          <button
            onClick={() => {
              setActiveTab('submissions');
              setSubmissionFilter('all');
            }}
            className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">My News</span>
            <span className="text-xl font-black text-neutral-900 mt-0.5">
              {totalNews}
            </span>
          </button>

          {/* Pending */}
          <button
            onClick={() => {
              setActiveTab('submissions');
              setSubmissionFilter('pending');
            }}
            className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">Pending</span>
            <span className="text-xl font-black text-amber-600 mt-0.5">
              {pendingCount}
            </span>
          </button>

          {/* Published */}
          <button
            onClick={() => {
              setActiveTab('submissions');
              setSubmissionFilter('approved');
            }}
            className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">Published</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5">
              {publishedCount}
            </span>
          </button>
        </div>

        {/* Quick Shortcuts Row: Bookmarks & Follows */}
        <div className="grid grid-cols-2 gap-3">
          {/* Saved Bookmarks Shortcut */}
          <button
            id="profile-saved-shortcut-btn"
            onClick={onNavigateToSaved}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-red-50 text-[#E41E26] flex items-center justify-center flex-shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-neutral-600 block uppercase">సేవ్ చేసినవి</span>
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                <span>{savedCount} వార్తలు</span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </span>
            </div>
          </button>

          {/* Followed Topics Shortcut */}
          <button
            id="profile-follows-shortcut-btn"
            onClick={() => setActiveTab('profile')}
            aria-label={`ఫాలో అవుతున్నవి, ${follows.length} అంశాలు (Followed Topics)`}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-neutral-600 block uppercase">ఫాలో అవుతున్నవి</span>
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                <span>{follows.length} అంశాలు</span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </span>
            </div>
          </button>
        </div>

        {/* Action Menu Tabs List */}
        <div role="tablist" aria-label="ఖాతా ఎంపికలు (Account Options)" className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden divide-y divide-neutral-100">
          <button
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
              activeTab === 'profile' ? 'bg-red-50/40 text-[#E41E26]' : 'hover:bg-neutral-50 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">
                నా ప్రొఫైల్ & వివరాలు (Profile Details)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            id="tab-submissions-btn"
            role="tab"
            aria-selected={activeTab === 'submissions'}
            onClick={() => setActiveTab('submissions')}
            className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
              activeTab === 'submissions' ? 'bg-red-50/40 text-[#E41E26]' : 'hover:bg-neutral-50 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">
                  నా వార్తా కథనాలు (My Submissions)
                </span>
                {totalNews > 0 && (
                  <span className="bg-red-100 text-[#E41E26] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {totalNews}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {isAuthenticated && (
            <button
              id="tab-reports-btn"
              role="tab"
              aria-selected={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'reports' ? 'bg-red-50/40 text-[#E41E26]' : 'hover:bg-neutral-50 text-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                  <Flag className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    నా రిపోర్టులు (My Reports)
                  </span>
                  {myReports.length > 0 && (
                    <span className="bg-neutral-100 text-neutral-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {myReports.length}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          )}

          <button
            role="tab"
            aria-selected={activeTab === 'guidelines'}
            onClick={() => setActiveTab('guidelines')}
            className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
              activeTab === 'guidelines' ? 'bg-red-50/40 text-[#E41E26]' : 'hover:bg-neutral-50 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">
                రిపోర్టర్ నిబంధనలు (Guidelines)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'support'}
            onClick={() => setActiveTab('support')}
            className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
              activeTab === 'support' ? 'bg-red-50/40 text-[#E41E26]' : 'hover:bg-neutral-50 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">
                సహాయం & మద్దతు (Help & Support)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {isAuthenticated ? (
            <>
              <button
                id="reporter-logout-btn"
                onClick={() => signOut()}
                aria-label="లాగౌట్ (Logout)"
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors text-red-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">లాగౌట్ (Logout)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-300" />
              </button>

              <button
                id="reporter-delete-account-btn"
                onClick={() => setIsDeleteDialogOpen(true)}
                aria-label="ఖాతాను తొలగించండి (Delete Account)"
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-red-50/70 transition-colors text-red-700 border-t border-neutral-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/80 flex items-center justify-center text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-red-700 block">ఖాతాను తొలగించండి</span>
                    <span className="text-[10px] text-red-500 font-medium block">Permanently Delete Account</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </>
          ) : (
            <button
              id="reporter-login-menu-btn"
              onClick={openAuthModal}
              aria-label="లాగిన్ అవ్వండి (Login)"
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors text-[#E41E26] cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#E41E26]">
                  <LogIn className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">లాగిన్ అవ్వండి (Login)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-300" />
            </button>
          )}
        </div>

        {/* Dynamic Detail Card based on selection */}

        {/* 1. SUBMISSIONS TAB */}
        {activeTab === 'submissions' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 telugu-heading flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#E41E26]" />
                <span>మీ సమర్పణలు ({filteredSubmissions.length})</span>
              </h3>

              {/* Filter chips with All, Pending, Approved, and Rejected */}
              <div className="flex items-center gap-1 text-[10px] flex-wrap">
                <button
                  onClick={() => setSubmissionFilter('all')}
                  className={`px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                    submissionFilter === 'all'
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  అన్నీ ({totalNews})
                </button>
                <button
                  onClick={() => setSubmissionFilter('pending')}
                  className={`px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                    submissionFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  పెండింగ్ ({pendingCount})
                </button>
                <button
                  onClick={() => setSubmissionFilter('approved')}
                  className={`px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                    submissionFilter === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  ఆమోదం ({publishedCount})
                </button>
                <button
                  onClick={() => setSubmissionFilter('rejected')}
                  className={`px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                    submissionFilter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  తిరస్కరించబడింది ({rejectedCount})
                </button>
              </div>
            </div>

            {/* Withdrawal feedback alerts */}
            {withdrawSuccess && (
              <div role="status" className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}
            {withdrawError && (
              <div role="alert" className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {isLoadingSubmissions ? (
              <div className="py-8 flex flex-col items-center justify-center text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#E41E26] mb-2" />
                <p className="text-xs">సమర్పణలు లోడ్ అవుతున్నాయి...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-8 text-center text-neutral-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p className="text-xs font-medium text-neutral-600">
                  {submissionFilter === 'all'
                    ? 'మీరు ఇంకా ఎలాంటి వార్తలు సమర్పించలేదు.'
                    : `${submissionFilter} స్థితిలో వార్తలు లేవు.`}
                </p>
                <button
                  onClick={() => onOpenSubmitNews && onOpenSubmitNews()}
                  className="mt-3 text-xs font-bold text-[#E41E26] hover:underline"
                >
                  + మొదటి వార్తను సమర్పించండి
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSubmissions.map((sub) => {
                  const isApproved = sub.status === 'approved';
                  const isRejected = sub.status === 'rejected';
                  const isPending = sub.status === 'pending';

                  return (
                    <div
                      key={sub.id}
                      className="p-3 bg-neutral-50/70 hover:bg-neutral-50 rounded-xl border border-neutral-200/80 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-neutral-900 leading-snug telugu-heading flex-1">
                          {sub.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isRejected
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isApproved ? 'ఆమోదించబడింది' : isRejected ? 'తిరస్కరించబడింది' : 'పరిశీలనలో ఉంది'}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                        {sub.details}
                      </p>

                      {/* Media indicators with accessible labels */}
                      {(sub.imageUrl || sub.audioUrl || sub.videoUrl) && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5" aria-label="జతచేయబడిన మీడియా (Attached media)">
                          {sub.imageUrl && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-medium">
                              <Camera className="w-3 h-3" />
                              <span>ఫోటో (Photo)</span>
                            </span>
                          )}
                          {sub.audioUrl && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-medium">
                              <Mic className="w-3 h-3" />
                              <span>ఆడియో (Audio)</span>
                            </span>
                          )}
                          {sub.videoUrl && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-medium">
                              <Video className="w-3 h-3" />
                              <span>వీడియో (Video)</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Rejection reason box */}
                      {isRejected && sub.rejectionReason && (
                        <div className="bg-red-50 text-red-800 p-2 rounded-lg text-[10px] border border-red-200/80">
                          <span className="font-bold">తిరస్కరణ కారణం:</span> {sub.rejectionReason}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1.5 border-t border-neutral-100 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-600">
                            {sub.locationText || 'స్థానిక'}
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(sub.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Pending: Withdraw button for authenticated owner */}
                          {isPending && user?.id && sub.userId === user.id && (
                            <button
                              onClick={() => {
                                setWithdrawError(null);
                                setWithdrawModalSubmission(sub);
                              }}
                              className="font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
                              aria-label={`'${sub.title}' వార్తను ఉపసంహరించు (Withdraw submission)`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>ఉపసంహరించు (Withdraw)</span>
                            </button>
                          )}

                          {/* Rejected: Resubmit button */}
                          {isRejected && (
                            <button
                              onClick={() => handleResubmit(sub)}
                              className="font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                              aria-label={`'${sub.title}' వార్తను మళ్లీ సమర్పించండి (Resubmit news)`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>మళ్లీ సమర్పించు (Resubmit)</span>
                            </button>
                          )}

                          {/* View published article link */}
                          {isApproved && sub.publishedNewsId && onSelectNews && (
                            <button
                              onClick={() => onSelectNews({ id: sub.publishedNewsId })}
                              className="font-bold text-[#E41E26] hover:text-[#B71C1C] flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>వార్త చూడండి</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. PROFILE TAB (Account Details & Followed Topics) */}
        {activeTab === 'profile' && isAuthenticated && (
          <div className="space-y-3 animate-in fade-in">
            {/* Account Details Box */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-neutral-900 telugu-heading flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#E41E26]" />
                  <span>ఖాతా వివరాలు / Account Information</span>
                </h3>
                <button
                  onClick={handleOpenEdit}
                  className="text-xs font-bold text-[#E41E26] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>సవరించండి</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block mb-0.5">పూర్తి పేరు / Name</span>
                  <span className="font-bold text-neutral-800">{profile?.full_name || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block mb-0.5">ఇమెయిల్ / Email</span>
                  <span className="font-bold text-neutral-800 break-all">{user?.email || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block mb-0.5">ఫోన్ / Phone</span>
                  <span className="font-bold text-neutral-800">{profile?.phone || 'నమోదు చేయలేదు'}</span>
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block mb-0.5">పాత్ర / Role</span>
                  <span className="font-bold text-neutral-800">{roleInfo.label}</span>
                </div>
                <div className="col-span-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block mb-0.5">ప్రాంతం (జిల్లా / మండలం)</span>
                  <span className="font-bold text-neutral-800">{displayLocation}</span>
                </div>
              </div>
            </div>

            {/* Followed Topics Section */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-neutral-900 telugu-heading flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-purple-600" />
                <span>మీరు ఫాలో అవుతున్న అంశాలు ({follows.length})</span>
              </h3>

              {isLoadingFollows ? (
                <div className="py-4 text-center text-neutral-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-purple-600" />
                  <span>అంశాలు లోడ్ అవుతున్నాయి...</span>
                </div>
              ) : follows.length === 0 ? (
                <div className="py-4 text-center text-neutral-400">
                  <Heart className="w-6 h-6 mx-auto mb-1 text-neutral-300" />
                  <p className="text-xs text-neutral-500">
                    మీరు ఇంకా ఎలాంటి వర్గాలు లేదా ప్రాంతాలను ఫాలో అవ్వడం లేదు.
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    హోమ్‌పేజీలో వర్గాలు లేదా లొకేషన్ పక్కన ఉన్న 'ఫాలో' బటన్‌పై క్లిక్ చేయండి.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {follows.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200"
                    >
                      {item.followType === 'category' ? (
                        <Tag className="w-3 h-3 text-purple-600" />
                      ) : (
                        <MapPin className="w-3 h-3 text-purple-600" />
                      )}
                      <span>{item.targetId}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. GUIDELINES TAB */}
        {activeTab === 'guidelines' && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed animate-in fade-in">
            <h3 className="font-bold text-sm text-amber-950 mb-1.5 telugu-heading flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              రిపోర్టర్ మార్గదర్శకాలు (Reporting Rules)
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>వార్తలో వాస్తవాలు మాత్రమే ఉండాలి, ఎలాంటి అసత్య ప్రచారం చేయరాదు.</li>
              <li>ప్రజల సమస్యలు, ప్రమాదాలు, ప్రభుత్వ పథకాల అమలుపై దృష్టి సారించండి.</li>
              <li>లైవ్ వీడియో లేదా ఫోటో స్పష్టంగా ఉండేలా చూడండి.</li>
              <li>స్థానిక ప్రజల వాయిస్ నోట్ జతచేస్తే ప్రాధాన్యత లభిస్తుంది.</li>
            </ul>
          </div>
        )}

        {/* 4. SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed animate-in fade-in">
            <h3 className="font-bold text-sm text-blue-950 mb-1.5 telugu-heading">
              రచ్చ బండ న్యూస్ డెస్క్ హెల్ప్‌లైన్
            </h3>
            <p>ఫోన్: <strong>+91 98480 12345</strong> (24x7 న్యూస్ డెస్క్)</p>
            <p className="mt-1">ఈమెయిల్: <strong>newsdesk@rachabanda-voice.com</strong></p>
            <p className="mt-1">ఖమ్మం ప్రధాన కార్యాలయం: కలెక్టరేట్ రోడ్, ఖమ్మం.</p>
          </div>
        )}

        {/* 5. MY REPORTS TAB (#8D-2) */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 telugu-heading flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-[#E41E26]" />
                <span>మీరు పంపిన రిపోర్టులు ({myReports.length})</span>
              </h3>
              <button
                type="button"
                onClick={loadUserReports}
                disabled={isLoadingReports}
                aria-label="రిపోర్టుల జాబితా తాజాకరించండి (Refresh reports)"
                className="text-[11px] text-neutral-500 hover:text-neutral-800 font-medium focus-visible:ring-2 focus-visible:ring-red-400 rounded px-1.5 py-0.5"
              >
                {isLoadingReports ? 'లోడ్ అవుతోంది...' : 'రిఫ్రెష్ (Refresh)'}
              </button>
            </div>

            {isLoadingReports ? (
              <div className="py-6 text-center text-neutral-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#E41E26]" />
                <span>మీ రిపోర్టులు లోడ్ అవుతున్నాయి...</span>
              </div>
            ) : reportsError ? (
              <div role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reportsError}</span>
              </div>
            ) : myReports.length === 0 ? (
              <div className="py-6 text-center text-neutral-400">
                <Flag className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p className="text-xs text-neutral-600 font-medium">
                  మీరు ఇంకా ఎలాంటి కంటెంట్‌పై రిపోర్ట్ చేయలేదు.
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  అనుచిత లేదా తప్పుడు కంటెంట్ గమనించినప్పుడు మీరు రిపోర్ట్ చేయవచ్చు.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700">
                          {report.contentType === 'news' ? 'వార్త / News' : 'కామెంట్ / Comment'}
                        </span>
                        <span className="text-xs font-bold text-neutral-800">
                          {report.reason}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          report.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : report.status === 'reviewed'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : report.status === 'actioned'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {report.status === 'pending'
                          ? 'పరిశీలనలో ఉంది'
                          : report.status === 'reviewed'
                          ? 'సమీక్షించబడింది'
                          : report.status === 'actioned'
                          ? 'చర్య తీసుకున్నారు'
                          : 'పరిష్కరించబడింది'}
                      </span>
                    </div>
                    {report.details && (
                      <p className="text-xs text-neutral-600 line-clamp-2 bg-white/70 p-2 rounded-lg border border-neutral-100">
                        {report.details}
                      </p>
                    )}
                    <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-0.5">
                      <span>తేదీ: {new Date(report.createdAt).toLocaleDateString('te-IN')}</span>
                      <span className="font-mono text-[9px] text-neutral-400">ID: {report.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E41E26]" />
                <h3 id="edit-profile-modal-title" className="text-base font-bold text-neutral-900 telugu-heading">
                  ప్రొఫైల్ సవరించండి / Edit Profile
                </h3>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                aria-label="మూసివేయండి (Close dialog)"
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-only Role Notice */}
            <div className="bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-neutral-500" />
                <span className="text-neutral-600 font-medium">మీ పాత్ర (User Role):</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>

            {/* Feedback Banners */}
            {profileSaveSuccess && (
              <div role="status" className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSaveSuccess}</span>
              </div>
            )}
            {profileSaveError && (
              <div role="alert" className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{profileSaveError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label htmlFor="edit-profile-name-input" className="block text-xs font-bold text-neutral-700 mb-1 telugu-heading">
                  పూర్తి పేరు (Full Name) *
                </label>
                <input
                  id="edit-profile-name-input"
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="మీ పూర్తి పేరు నమోదు చేయండి"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E41E26] focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="edit-profile-bio-input" className="block text-xs font-bold text-neutral-700 mb-1 telugu-heading">
                  మీ గురించి (Bio / About)
                </label>
                <textarea
                  id="edit-profile-bio-input"
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="మీ వృత్తి లేదా రిపోర్టింగ్ ఆసక్తుల గురించి క్లుప్తంగా..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E41E26] focus:border-transparent resize-none"
                />
              </div>

              {/* District & Mandal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={districts && districts.length > 0 ? 'edit-profile-district-select' : 'edit-profile-district-input'} className="block text-xs font-bold text-neutral-700 mb-1 telugu-heading">
                    జిల్లా (District)
                  </label>
                  {districts && districts.length > 0 ? (
                    <select
                      id="edit-profile-district-select"
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E41E26] focus:border-transparent bg-white"
                    >
                      <option value="">జిల్లా ఎంచుకోండి</option>
                      {districts.map((d: any) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.english_name || d.name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="edit-profile-district-input"
                      type="text"
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      placeholder="ఉదా: ఖమ్మం"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E41E26] focus:border-transparent"
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="edit-profile-mandal-input" className="block text-xs font-bold text-neutral-700 mb-1 telugu-heading">
                    మండలం (Mandal)
                  </label>
                  <input
                    id="edit-profile-mandal-input"
                    type="text"
                    value={editMandal}
                    onChange={(e) => setEditMandal(e.target.value)}
                    placeholder="ఉదా: ఖమ్మం అర్బన్"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E41E26] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="edit-profile-phone-input" className="block text-xs font-bold text-neutral-700 mb-1 telugu-heading">
                  ఫోన్ నంబర్ (Phone Number)
                </label>
                <input
                  id="edit-profile-phone-input"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="ఉదా: 9848012345"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E41E26] focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  id="edit-profile-cancel-btn"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={isSavingProfile}
                  aria-label="రద్దు చేయండి (Cancel)"
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400"
                >
                  రద్దు చేయండి (Cancel)
                </button>
                <button
                  type="submit"
                  id="edit-profile-save-btn"
                  disabled={isSavingProfile}
                  aria-label="ప్రొఫైల్ వివరాలు భద్రపరచండి (Save profile details)"
                  className="px-5 py-2 text-xs font-bold bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>భద్రపరుస్తోంది...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>భద్రపరచండి (Save)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Deletion Dialog (#8E TASK 2) */}
      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirmDelete={deleteAccount}
        onSuccess={() => {
          setIsDeleteDialogOpen(false);
          navigate('/');
        }}
      />

      {/* Pending Submission Withdrawal Confirmation Dialog (#8F) */}
      {withdrawModalSubmission && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-dialog-title"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="withdraw-dialog-title" className="text-sm font-black text-neutral-900 telugu-heading">
                  వార్త ఉపసంహరణ / Withdraw Submission
                </h3>
                <p className="text-[11px] text-neutral-500 font-medium">
                  పరిశీలనలో ఉన్న వార్తను ఉపసంహరించండి
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-neutral-800 line-clamp-2">
                {withdrawModalSubmission.title}
              </span>
              <span className="text-[10px] text-neutral-500 block">
                {withdrawModalSubmission.locationText || 'స్థానిక'} • {formatTimeAgo(withdrawModalSubmission.createdAt)}
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              మీరు ఈ పెండింగ్ వార్తను ఖచ్చితంగా ఉపసంహరించుకోవాలనుకుంటున్నారా? ఉపసంహరించిన తర్వాత ఈ రికార్డు శాశ్వతంగా తొలగించబడుతుంది మరియు రిపోర్టర్ స్క్రీన్ ద్వారా తిరిగి పొందడం సాధ్యం కాదు.
            </p>

            {withdrawError && (
              <div role="alert" className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                disabled={isWithdrawing}
                onClick={() => {
                  setWithdrawModalSubmission(null);
                  setWithdrawError(null);
                }}
                className="px-3.5 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                రద్దు చేయి (Cancel)
              </button>
              <button
                type="button"
                disabled={isWithdrawing}
                onClick={handleConfirmWithdraw}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>తొలగిస్తోంది...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ఉపసంహరించు (Withdraw)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

