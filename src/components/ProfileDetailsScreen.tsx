/**
 * @file ProfileDetailsScreen.tsx
 * @description Dedicated Profile Details screen with in-app language switcher, profile editing, and account actions.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit3,
  Camera,
  Globe,
  LogOut,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  X,
  Info,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppLanguage, SUPPORTED_LANGUAGES, AppLanguage } from '../i18n';
import { uploadUserAvatar } from '../services/userService';
import { DeleteAccountDialog } from './DeleteAccountDialog';

interface ProfileDetailsScreenProps {
  districts?: string[];
  locations?: any[];
}

export const ProfileDetailsScreen: React.FC<ProfileDetailsScreenProps> = ({ districts = [], locations = [] }) => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, openAuthModal, signOut, deleteAccount, updateProfile, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useAppLanguage();

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

  // Delete Account Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Role Badge Info
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'అడ్మినిస్ట్రేటర్ (Admin)', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'editor':
        return { label: 'ఎడిటర్ (Editor)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'reporter':
        return { label: 'జర్నలిస్ట్ (Reporter)', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'citizen_reporter':
        return { label: 'సిటిజన్ రిపోర్టర్ (Citizen Reporter)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'రీడర్ (Reader)', color: 'bg-neutral-100 text-neutral-800 border-neutral-200' };
    }
  };

  const roleInfo = getRoleBadge(profile?.role);

  // Open Edit Profile Modal
  const handleOpenEdit = () => {
    setEditFullName(profile?.full_name || user?.user_metadata?.full_name || '');
    setEditBio(profile?.bio || '');
    setEditDistrict(profile?.district || '');
    setEditMandal(profile?.mandal || '');
    setEditPhone(profile?.phone || '');
    setProfileSaveSuccess(null);
    setProfileSaveError(null);
    setIsEditingProfile(true);
  };

  // Submit Profile Updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setProfileSaveError('దయచేసి పూర్తి పేరు నమోదు చేయండి. / Name is required.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError(null);
    try {
      const { error } = await updateProfile({
        full_name: editFullName.trim(),
        bio: editBio.trim() || null,
        district: editDistrict.trim() || null,
        mandal: editMandal.trim() || null,
        phone: editPhone.trim() || null,
      });

      if (error) {
        setProfileSaveError(error.message || 'ప్రొఫైల్ సేవ్ చేయడం విఫలమైంది.');
      } else {
        setProfileSaveSuccess(t('profile.savedSuccessfully'));
        await refreshProfile();
        setTimeout(() => {
          setIsEditingProfile(false);
          setProfileSaveSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      setProfileSaveError(err.message || 'ఊహించని లోపం జరిగింది.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Avatar Image File Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('దయచేసి చిత్రం (JPG, PNG) ఫైల్‌ను మాత్రమే ఎంచుకోండి.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('చిత్రం పరిమాణం 2MB కంటే తక్కువగా ఉండాలి.');
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      const { error } = await uploadUserAvatar(file);
      if (error) {
        setAvatarError(error.message || 'అవతార్ అప్‌లోడ్ విఫలమైంది.');
      } else {
        setAvatarSuccess('అవతార్ విజయవంతంగా అప్‌డేట్ చేయబడింది!');
        await refreshProfile();
        setTimeout(() => setAvatarSuccess(null), 3000);
      }
    } catch (err: any) {
      setAvatarError(err.message || 'అవతార్ అప్‌లోడ్ చేయడంలో లోపం.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Handle Confirmed Account Deletion
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
          {t('profile.title')}
        </span>
      </div>

      {/* Screen Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl shadow-lg border border-neutral-700">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black telugu-heading text-white">
                {t('profile.title')}
              </h1>
              <p className="text-xs text-neutral-300">
                {t('dashboard.myProfileDesc')}
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleOpenEdit}
              aria-label="ప్రొఫైల్ సవరించండి (Edit Profile)"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('profile.editProfile')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. APP LANGUAGE SELECTOR CARD (#Change 1 Requirement) */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E41E26] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 telugu-heading">
                {t('language.appLanguage')} (App Language)
              </h2>
              <p className="text-[11px] text-neutral-500">
                యూజర్ ఇంటర్‌ఫేస్ భాషను ఎంచుకోండి (వార్తల భాషను మార్చదు)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isCurrent = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
                  isCurrent
                    ? 'border-[#E41E26] bg-red-50/70 text-[#E41E26] font-black shadow-xs ring-1 ring-[#E41E26]'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-bold'
                }`}
              >
                <span className="text-sm telugu-heading">{lang.nativeLabel}</span>
                <span className="text-[10px] text-neutral-500 font-medium">{lang.englishLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. USER PROFILE DETAILS CARD */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E41E26] mx-auto flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-base font-bold text-neutral-900 telugu-heading">
              లాగిన్ అవ్వండి (Sign In)
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              మీ ప్రొఫైల్ వివరాలు మరియు సిటిజన్ జర్నలిజం సమాచారాన్ని నిర్వహించడానికి లాగిన్ అవ్వండి.
            </p>
          </div>
          <button
            onClick={openAuthModal}
            className="px-6 py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>లాగిన్ / రిజిస్టర్ అవ్వండి</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-6">
          {/* Avatar & Main Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-neutral-100">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 border-2 border-neutral-200 overflow-hidden flex items-center justify-center shadow-inner">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-neutral-400" />
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                aria-label="అవతార్ మార్చండి (Change avatar)"
                className="absolute -bottom-1.5 -right-1.5 p-2 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl shadow-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                id="avatar-file-input"
                aria-label="అవతార్ చిత్రం ఎంచుకోండి (Choose avatar image)"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-lg font-black text-neutral-900 telugu-heading">
                  {profile?.full_name || user?.user_metadata?.full_name || 'రచ్చబండ యూజర్'}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border self-center sm:self-auto ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                {user?.email}
              </p>
              {profile?.bio && (
                <p className="text-xs text-neutral-700 italic pt-1 leading-relaxed">
                  "{profile.bio}"
                </p>
              )}
            </div>
          </div>

          {avatarSuccess && (
            <div role="status" className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{avatarSuccess}</span>
            </div>
          )}
          {avatarError && (
            <div role="alert" className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{avatarError}</span>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                {t('profile.email')}
              </span>
              <p className="text-xs font-bold text-neutral-800 font-mono">
                {user?.email || t('profile.notSet')}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                {t('profile.phone')}
              </span>
              <p className="text-xs font-bold text-neutral-800 font-mono">
                {profile?.phone || t('profile.notSet')}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                {t('profile.district')}
              </span>
              <p className="text-xs font-bold text-neutral-800 telugu-heading">
                {profile?.district || t('profile.notSet')}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                {t('profile.mandal')}
              </span>
              <p className="text-xs font-bold text-neutral-800 telugu-heading">
                {profile?.mandal || t('profile.notSet')}
              </p>
            </div>
          </div>

          {/* Account Actions: Sign Out & Delete Account */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                signOut();
                navigate('/dashboard');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-neutral-500" />
              <span>{t('dashboard.logout')}</span>
            </button>

            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('dashboard.deleteAccount')}</span>
            </button>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E41E26]" />
                <h3 id="edit-profile-modal-title" className="text-base font-bold text-neutral-900 telugu-heading">
                  {t('profile.editProfile')}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                aria-label={t('common.close')}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label htmlFor="edit-name" className="block text-xs font-bold text-neutral-700 mb-1">
                  {t('profile.fullName')} *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-[#E41E26] outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-xs font-bold text-neutral-700 mb-1">
                  {t('profile.phone')}
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-[#E41E26] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="edit-district" className="block text-xs font-bold text-neutral-700 mb-1">
                    {t('profile.district')}
                  </label>
                  <select
                    id="edit-district"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-[#E41E26] outline-hidden bg-white"
                  >
                    <option value="">{t('profile.selectDistrict')}</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-mandal" className="block text-xs font-bold text-neutral-700 mb-1">
                    {t('profile.mandal')}
                  </label>
                  <input
                    id="edit-mandal"
                    type="text"
                    value={editMandal}
                    onChange={(e) => setEditMandal(e.target.value)}
                    placeholder="మండలం పేరు"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-[#E41E26] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-bio" className="block text-xs font-bold text-neutral-700 mb-1">
                  {t('profile.bio')}
                </label>
                <textarea
                  id="edit-bio"
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="మీ గురించి క్లుప్తంగా..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#E41E26] focus:ring-1 focus:ring-[#E41E26] outline-hidden resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={isSavingProfile}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#E41E26] hover:bg-[#B71C1C] text-white flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('profile.saving')}</span>
                    </>
                  ) : (
                    <span>{t('profile.saveChanges')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
