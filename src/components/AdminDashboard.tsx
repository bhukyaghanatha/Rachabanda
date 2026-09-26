import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Logo } from './Logo';
import { NewsSubmission, NewsItem, UserRole, AdminUserProfile, ContentReportStatus, ContentReportType, ModerationContentReport } from '../types';
import {
  LayoutDashboard,
  Newspaper,
  Clock,
  CheckCircle,
  Users,
  Megaphone,
  Layers,
  Bell,
  Settings,
  LogOut,
  Check,
  X,
  Smartphone,
  Sparkles,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Trash2,
  EyeOff,
  Flag,
  FileText,
} from 'lucide-react';
import {
  fetchSubmissions,
  approveSubmission,
  rejectSubmission,
} from '../services/submissionService';
import {
  fetchAllCommentsForModeration,
  updateCommentApproval,
  deleteComment,
  ModerationComment,
} from '../services/commentService';
import {
  fetchAllUsersForAdmin,
  adminSetUserRole,
} from '../services/userService';
import {
  fetchReportsForModeration,
  updateReportStatus,
} from '../services/reportService';
import { useAuth } from '../hooks/useAuth';

const ROLE_CONFIG: Record<
  UserRole,
  {
    telugu: string;
    english: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  reader: {
    telugu: 'రీడర్',
    english: 'Reader',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
    dot: 'bg-neutral-400',
  },
  citizen_reporter: {
    telugu: 'పౌర రిపోర్టర్',
    english: 'Citizen Reporter',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  reporter: {
    telugu: 'రిపోర్టర్',
    english: 'Reporter',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  editor: {
    telugu: 'ఎడిటర్',
    english: 'Editor',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  admin: {
    telugu: 'అడ్మిన్',
    english: 'Admin',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

const REPORT_STATUS_CONFIG: Record<
  ContentReportStatus,
  {
    telugu: string;
    english: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  pending: {
    telugu: 'పరిశీలనలో ఉంది',
    english: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  reviewed: {
    telugu: 'పరిశీలించబడింది',
    english: 'Reviewed',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  actioned: {
    telugu: 'చర్య తీసుకోబడింది',
    english: 'Actioned',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  dismissed: {
    telugu: 'తిరస్కరించబడింది',
    english: 'Dismissed',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
    dot: 'bg-neutral-400',
  },
};

const REPORT_REASON_LABELS: Record<string, { telugu: string; english: string }> = {
  misinformation: { telugu: 'తప్పుడు సమాచారం', english: 'Misinformation' },
  hate_speech: { telugu: 'ద్వేషపూరిత ప్రసంగం', english: 'Hate speech' },
  harassment: { telugu: 'వేధింపు', english: 'Harassment' },
  spam: { telugu: 'స్పామ్', english: 'Spam' },
  inappropriate: { telugu: 'అనుచిత కంటెంట్', english: 'Inappropriate' },
  copyright: { telugu: 'కాపీరైట్', english: 'Copyright' },
  other: { telugu: 'ఇతర కారణం', english: 'Other' },
};

export interface StandardRejectionReason {
  id: string;
  labelTe: string;
  labelEn: string;
  template: string;
}

export const STANDARD_REJECTION_REASONS: StandardRejectionReason[] = [
  {
    id: 'incomplete',
    labelTe: 'అసంపూర్ణ సమాచారం',
    labelEn: 'Incomplete information',
    template: 'అసంపూర్ణ సమాచారం / Incomplete information: మరిన్ని పూర్తి వివరాలు మరియు ఆధారాలు అవసరం.',
  },
  {
    id: 'unclear_photo',
    labelTe: 'స్పష్టత లేని ఫోటో',
    labelEn: 'Unclear photo',
    template: 'స్పష్టత లేని ఫోటో / Unclear photo: వార్తకు సంబంధించి స్పష్టమైన ఫోటోను జతచేయండి.',
  },
  {
    id: 'misleading',
    labelTe: 'నకిలీ లేదా తప్పుదారి పట్టించే సమాచారం',
    labelEn: 'Misleading information',
    template: 'నకిలీ లేదా తప్పుదారి పట్టించే సమాచారం / Misleading information: వివరాలు సరిచూడబడలేదు.',
  },
  {
    id: 'duplicate',
    labelTe: 'డూప్లికేట్ వార్త',
    labelEn: 'Duplicate news',
    template: 'డూప్లికేట్ వార్త / Duplicate news: ఈ ఘటనకు సంబంధించిన వార్త ఇప్పటికే ప్రచురించబడింది.',
  },
  {
    id: 'other',
    labelTe: 'ఇతర కారణం',
    labelEn: 'Other',
    template: '',
  },
];

/**
 * Safely validates user-submitted external media URLs.
 * Strictly permits only http: and https: protocols to prevent DOM-XSS via javascript:, data:, vbscript:, file:, blob:, etc.
 */
function isSafeExternalMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface AdminDashboardProps {
  submissions?: NewsSubmission[];
  onApproveSubmission?: (subId: string) => void;
  onRejectSubmission?: (subId: string) => void;
  onSwitchToMobile: () => void;
  publishedCount?: number;
  totalNewsCount?: number;
  onArticlePublished?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  submissions: fallbackSubmissions = [],
  onApproveSubmission,
  onRejectSubmission,
  onSwitchToMobile,
  publishedCount = 0,
  totalNewsCount = 0,
  onArticlePublished,
}) => {
  const { user, profile } = useAuth();
  const isCurrentUserAdmin = profile?.role === 'admin';
  const isCurrentUserEditor = profile?.role === 'editor';

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'pending' | 'published' | 'users' | 'reporters' | 'citizen' | 'comments' | 'reports'
  >('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [submissionsList, setSubmissionsList] = useState<NewsSubmission[]>(fallbackSubmissions);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rejection Dialog Modal State (#8F)
  const [rejectModalSubmission, setRejectModalSubmission] = useState<NewsSubmission | null>(null);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('incomplete');
  const [customReasonText, setCustomReasonText] = useState<string>(
    STANDARD_REJECTION_REASONS[0].template
  );
  const [rejectDialogError, setRejectDialogError] = useState<string | null>(null);
  const rejectTriggerElementRef = useRef<HTMLElement | null>(null);
  const rejectTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Comments Moderation State
  const [commentsList, setCommentsList] = useState<ModerationComment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState<boolean>(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentStatusFilter, setCommentStatusFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [commentSearchQuery, setCommentSearchQuery] = useState<string>('');
  const [commentProcessingId, setCommentProcessingId] = useState<string | null>(null);
  const [deletingCommentTarget, setDeletingCommentTarget] = useState<ModerationComment | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<AdminUserProfile[]>([]);
  const [allUsersList, setAllUsersList] = useState<AdminUserProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'all'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [userProcessingId, setUserProcessingId] = useState<string | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: AdminUserProfile;
    newRole: UserRole;
  } | null>(null);

  // Content Reports Moderation State (#8D-2)
  const [reportsList, setReportsList] = useState<ModerationContentReport[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState<boolean>(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState<ContentReportStatus | 'all'>('pending');
  const [reportTypeFilter, setReportTypeFilter] = useState<ContentReportType | 'all'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [reportProcessingId, setReportProcessingId] = useState<string | null>(null);

  const loadReports = async () => {
    setIsReportsLoading(true);
    setReportsError(null);
    try {
      const { data, error } = await fetchReportsForModeration();
      if (error) {
        console.warn('Could not fetch reports for moderation:', error.message);
        setReportsError(error.message);
      } else {
        setReportsList(data);
      }
    } catch (err: any) {
      console.warn('Error loading reports:', err.message);
      setReportsError(err.message || 'రిపోర్టులను లోడ్ చేయడంలో లోపం ఏర్పడింది');
    } finally {
      setIsReportsLoading(false);
    }
  };

  const loadLiveSubmissions = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await fetchSubmissions();
      if (error) {
        console.warn('Could not fetch submissions from Supabase, using fallback:', error.message);
        setLoadError(error.message);
      } else {
        setSubmissionsList(data);
      }
    } catch (err: any) {
      console.warn('Error loading submissions:', err.message);
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModerationComments = async () => {
    setIsCommentsLoading(true);
    setCommentsError(null);
    try {
      const { data, error } = await fetchAllCommentsForModeration();
      if (error) {
        console.warn('Could not fetch comments from Supabase:', error.message);
        setCommentsError(error.message);
      } else {
        setCommentsList(data);
      }
    } catch (err: any) {
      console.warn('Error loading comments:', err.message);
      setCommentsError(err.message || 'కామెంట్లను లోడ్ చేయడంలో లోపం ఏర్పడింది');
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const loadUsers = async (search?: string, role?: UserRole | 'all') => {
    setIsUsersLoading(true);
    setUsersError(null);
    try {
      const { data, error } = await fetchAllUsersForAdmin({
        search: search?.trim() || undefined,
        role: role && role !== 'all' ? role : undefined,
        limit: 100,
      });

      if (error) {
        console.warn('Could not fetch users from Supabase:', error.message);
        setUsersError(error.message);
      } else {
        setUsersList(data);
        if (!search && (!role || role === 'all')) {
          setAllUsersList(data);
        }
      }
    } catch (err: any) {
      console.warn('Error loading users:', err.message);
      setUsersError(err.message || 'వినియోగదారులను లోడ్ చేయడంలో లోపం ఏర్పడింది');
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Search debounce for user management
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(userSearchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [userSearchQuery]);

  // Load users when search or role filter changes
  useEffect(() => {
    loadUsers(debouncedSearch, userRoleFilter);
  }, [debouncedSearch, userRoleFilter]);

  // Global Escape key support for accessible modal dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (roleChangeTarget && !userProcessingId) {
          setRoleChangeTarget(null);
        }
        if (deletingCommentTarget && !commentProcessingId) {
          setDeletingCommentTarget(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roleChangeTarget, userProcessingId, deletingCommentTarget, commentProcessingId]);

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { user: targetUser, newRole } = roleChangeTarget;
    setUserProcessingId(targetUser.id);
    try {
      const { success, error } = await adminSetUserRole(targetUser.id, newRole);
      if (error || !success) {
        setFeedback({
          type: 'error',
          message: `రోల్ మార్పు విఫలమైంది: ${error?.message || 'తెలియని లోపం'}`,
        });
      } else {
        const roleLabel = ROLE_CONFIG[newRole]?.english || newRole;
        setFeedback({
          type: 'success',
          message: `${targetUser.full_name} రోల్ విజయవంతంగా '${roleLabel}' కి మార్చబడింది! ✓`,
        });
        setRoleChangeTarget(null);
        await loadUsers(debouncedSearch, userRoleFilter);
        const { data: refreshedAll } = await fetchAllUsersForAdmin({ limit: 100 });
        if (refreshedAll) {
          setAllUsersList(refreshedAll);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'రోల్ మార్చడంలో లోపం ఏర్పడింది.',
      });
    } finally {
      setUserProcessingId(null);
    }
  };

  const userMetrics = React.useMemo(() => {
    const source = allUsersList.length > 0 ? allUsersList : usersList;
    return {
      total: source.length,
      readers: source.filter((u) => u.role === 'reader').length,
      citizenReporters: source.filter((u) => u.role === 'citizen_reporter').length,
      reporters: source.filter((u) => u.role === 'reporter').length,
      editors: source.filter((u) => u.role === 'editor').length,
      admins: source.filter((u) => u.role === 'admin').length,
    };
  }, [allUsersList, usersList]);

  useEffect(() => {
    loadLiveSubmissions();
    loadModerationComments();
    loadReports();
  }, []);

  const reportMetrics = React.useMemo(() => {
    const pending = reportsList.filter((r) => r.status === 'pending').length;
    const reviewed = reportsList.filter((r) => r.status === 'reviewed').length;
    const actioned = reportsList.filter((r) => r.status === 'actioned').length;
    const dismissed = reportsList.filter((r) => r.status === 'dismissed').length;
    const newsReports = reportsList.filter((r) => r.contentType === 'news').length;
    const commentReports = reportsList.filter((r) => r.contentType === 'comment').length;
    return {
      total: reportsList.length,
      pending,
      reviewed,
      actioned,
      dismissed,
      newsReports,
      commentReports,
    };
  }, [reportsList]);

  const filteredReports = React.useMemo(() => {
    return reportsList.filter((r) => {
      // 1. Status Filter
      if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) {
        return false;
      }

      // 2. Type Filter
      if (reportTypeFilter !== 'all' && r.contentType !== reportTypeFilter) {
        return false;
      }

      // 3. Search Filter
      const q = reportSearchQuery.toLowerCase().trim();
      if (q) {
        const reasonLabel = REPORT_REASON_LABELS[r.reason];
        const matchReporter = (r.reporterName || '').toLowerCase().includes(q);
        const matchReason =
          r.reason.toLowerCase().includes(q) ||
          (reasonLabel?.telugu || '').toLowerCase().includes(q) ||
          (reasonLabel?.english || '').toLowerCase().includes(q);
        const matchDetails = (r.details || '').toLowerCase().includes(q);
        const matchTargetTitle = (r.targetTitle || '').toLowerCase().includes(q);
        const matchTargetSnippet = (r.targetSnippet || '').toLowerCase().includes(q);
        const matchTargetAuthor = (r.targetAuthorName || '').toLowerCase().includes(q);

        if (
          !matchReporter &&
          !matchReason &&
          !matchDetails &&
          !matchTargetTitle &&
          !matchTargetSnippet &&
          !matchTargetAuthor
        ) {
          return false;
        }
      }

      return true;
    });
  }, [reportsList, reportStatusFilter, reportTypeFilter, reportSearchQuery]);

  const handleUpdateReportStatus = async (reportId: string, nextStatus: ContentReportStatus) => {
    setReportProcessingId(reportId);
    try {
      const { data, error } = await updateReportStatus(reportId, nextStatus);
      if (error) {
        setFeedback({
          type: 'error',
          message: `రిపోర్ట్ స్థితి మార్పు విఫలమైంది: ${error.message}`,
        });
      } else if (data) {
        setReportsList((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: data.status,
                  reviewedBy: data.reviewedBy,
                  reviewedAt: data.reviewedAt,
                  updatedAt: data.updatedAt,
                }
              : r
          )
        );
        const statusLabel = REPORT_STATUS_CONFIG[nextStatus]?.telugu || nextStatus;
        setFeedback({
          type: 'success',
          message: `రిపోర్ట్ స్థితి విజయవంతంగా "${statusLabel}"గా మార్చబడింది ✓`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'రిపోర్ట్ స్థితి మార్చడంలో లోపం ఏర్పడింది',
      });
    } finally {
      setReportProcessingId(null);
    }
  };

  const handleApprove = async (subId: string) => {
    setProcessingId(subId);
    setFeedback(null);
    try {
      const reviewerId = user?.id || 'admin';
      const { error } = await approveSubmission(subId, reviewerId);
      if (error) {
        setFeedback({
          type: 'error',
          message: `ఆమోదం విఫలమైంది: ${error.message}`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'వార్త విజయవంతంగా ఆమోదించబడింది & లైవ్‌లో ప్రచురించబడింది! ✓',
        });
        await loadLiveSubmissions();
        if (onArticlePublished) {
          onArticlePublished();
        }
        if (onApproveSubmission) {
          onApproveSubmission(subId);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'ఆమోద ప్రక్రియలో లోపం ఏర్పడింది.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Rejection Dialog Modal Handlers (#8F)
  const handleOpenRejectModal = (sub: NewsSubmission, e?: React.MouseEvent) => {
    if (e) {
      rejectTriggerElementRef.current = e.currentTarget as HTMLElement;
    }
    setRejectModalSubmission(sub);
    setSelectedReasonId('incomplete');
    setCustomReasonText(STANDARD_REJECTION_REASONS[0].template);
    setRejectDialogError(null);
  };

  const handleCloseRejectModal = () => {
    setRejectModalSubmission(null);
    setRejectDialogError(null);
    if (rejectTriggerElementRef.current) {
      rejectTriggerElementRef.current.focus();
    }
  };

  const handleSelectReasonPreset = (presetId: string) => {
    setSelectedReasonId(presetId);
    setRejectDialogError(null);
    const found = STANDARD_REJECTION_REASONS.find((r) => r.id === presetId);
    if (found) {
      setCustomReasonText(found.template);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalSubmission) return;

    const trimmedReason = customReasonText.trim();
    if (!trimmedReason) {
      setRejectDialogError('దయచేసి తిరస్కరణ కారణాన్ని నమోదు చేయండి. / Rejection reason is required.');
      return;
    }

    if (trimmedReason.length > 500) {
      setRejectDialogError('తిరస్కరణ కారణం 500 అక్షరాల కంటే తక్కువగా ఉండాలి. / Reason must be under 500 characters.');
      return;
    }

    const subId = rejectModalSubmission.id;
    setProcessingId(subId);
    setRejectDialogError(null);

    try {
      const reviewerId = user?.id || 'admin';
      const { error } = await rejectSubmission(subId, reviewerId, trimmedReason);

      if (error) {
        setRejectDialogError(`తిరస్కరణ విఫలమైంది: ${error.message}`);
        setFeedback({
          type: 'error',
          message: `తిరస్కరణ విఫలమైంది: ${error.message}`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'వార్త విజయవంతంగా తిరస్కరించబడింది.',
        });
        handleCloseRejectModal();
        await loadLiveSubmissions();
        if (onRejectSubmission) {
          onRejectSubmission(subId);
        }
      }
    } catch (err: any) {
      setRejectDialogError(err.message || 'తిరస్కరణ ప్రక్రియలో లోపం ఏర్పడింది.');
      setFeedback({
        type: 'error',
        message: err.message || 'తిరస్కరణ ప్రక్రియలో లోపం ఏర్పడింది.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (subId: string, reason?: string) => {
    const target = submissionsList.find((s) => s.id === subId);
    if (target && !reason) {
      handleOpenRejectModal(target);
      return;
    }

    setProcessingId(subId);
    setFeedback(null);
    try {
      const reviewerId = user?.id || 'admin';
      const { error } = await rejectSubmission(subId, reviewerId, reason);
      if (error) {
        setFeedback({
          type: 'error',
          message: `తిరస్కరణ విఫలమైంది: ${error.message}`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'వార్త తిరస్కరించబడింది.',
        });
        await loadLiveSubmissions();
        if (onRejectSubmission) {
          onRejectSubmission(subId);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'తిరస్కరణ ప్రక్రియలో లోపం ఏర్పడింది.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Keyboard accessibility for Rejection Dialog (Escape dismiss)
  useEffect(() => {
    if (!rejectModalSubmission) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRejectModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rejectModalSubmission]);

  const handleToggleCommentApproval = async (comment: ModerationComment) => {
    setCommentProcessingId(comment.id);
    const nextApprovedState = !comment.isApproved;
    try {
      const { error } = await updateCommentApproval(comment.id, nextApprovedState);
      if (error) {
        setFeedback({
          type: 'error',
          message: `కామెంట్ స్థితి మార్పు విఫలమైంది: ${error.message}`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: nextApprovedState
            ? 'కామెంట్ ఆమోదించబడింది! ✓ (Comment Approved)'
            : 'కామెంట్ దాచబడింది! ✓ (Comment Hidden)',
        });
        await loadModerationComments();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'కామెంట్ స్థితి మార్చడంలో లోపం ఏర్పడింది.',
      });
    } finally {
      setCommentProcessingId(null);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!deletingCommentTarget) return;
    const targetId = deletingCommentTarget.id;
    setCommentProcessingId(targetId);
    try {
      const { success, error } = await deleteComment(targetId);
      if (error || !success) {
        setFeedback({
          type: 'error',
          message: `కామెంట్ తొలగింపు విఫలమైంది: ${error?.message || 'తెలియని లోపం'}`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'కామెంట్ విజయవంతంగా తొలగించబడింది! ✓ (Comment Deleted)',
        });
        setDeletingCommentTarget(null);
        await loadModerationComments();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'కామెంట్ తొలగించడంలో లోపం ఏర్పడింది.',
      });
    } finally {
      setCommentProcessingId(null);
    }
  };

  const currentSubmissions = submissionsList.length > 0 ? submissionsList : fallbackSubmissions;
  const pendingSubmissions = currentSubmissions.filter((s) => s.status === 'pending');
  const approvedSubmissions = currentSubmissions.filter((s) => s.status === 'approved');

  const uniqueReportersCount = React.useMemo(() => {
    const names = new Set(
      currentSubmissions
        .map((s) => s.reporterName?.trim())
        .filter(Boolean)
    );
    return names.size;
  }, [currentSubmissions]);

  const adminName =
    profile?.full_name?.trim() ||
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    user?.email ||
    'Admin';

  const adminRole =
    profile?.role === 'admin'
      ? 'Admin'
      : profile?.role === 'editor'
      ? 'Editor'
      : profile?.role
      ? profile.role.toUpperCase()
      : 'Admin';

  const adminInitials = adminName.includes('@')
    ? adminName.substring(0, 2).toUpperCase()
    : (
        adminName
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join('') || 'AD'
      ).toUpperCase();

  const filteredSubmissions = currentSubmissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.reporterName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      statusFilter === 'all' ? true : sub.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const getSubmissionsHeading = () => {
    switch (statusFilter) {
      case 'pending':
        return 'Pending News (పరిశీలించాల్సిన వార్తలు)';
      case 'approved':
        return 'Published News (ప్రచురిత వార్తలు)';
      case 'rejected':
        return 'Rejected News (తిరస్కరించిన వార్తలు)';
      case 'all':
      default:
        return 'All News Submissions (అన్ని వార్తల సమర్పణలు)';
    }
  };

  const filteredComments = React.useMemo(() => {
    return commentsList.filter((c) => {
      const q = commentSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.comment.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        (c.userLocation && c.userLocation.toLowerCase().includes(q)) ||
        (c.newsTitle && c.newsTitle.toLowerCase().includes(q));

      const matchesStatus =
        commentStatusFilter === 'all'
          ? true
          : commentStatusFilter === 'approved'
          ? c.isApproved === true
          : c.isApproved === false;

      return matchesSearch && matchesStatus;
    });
  }, [commentsList, commentSearchQuery, commentStatusFilter]);

  const approvedCommentsCount = React.useMemo(
    () => commentsList.filter((c) => c.isApproved).length,
    [commentsList]
  );

  const hiddenCommentsCount = React.useMemo(
    () => commentsList.filter((c) => !c.isApproved).length,
    [commentsList]
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col md:flex-row text-neutral-900 font-sans">
      {/* Left Dark Sidebar matching Screen 6 */}
      <aside className="w-full md:w-64 bg-[#111111] text-white flex-shrink-0 flex flex-col justify-between p-4 border-r border-neutral-800">
        <div>
          {/* Logo */}
          <div className="pb-5 border-b border-neutral-800">
            <Logo variant="admin" />
          </div>

          {/* Navigation Links */}
          <nav aria-label="అడ్మిన్ నావిగేషన్ (Admin Navigation)" className="mt-5 space-y-1">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setStatusFilter('all');
              }}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'dashboard'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('dashboard');
                setStatusFilter('all');
              }}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'dashboard'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>వార్తలు (All News)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('pending');
                setStatusFilter('pending');
              }}
              aria-current={activeTab === 'pending' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'pending'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                <span>Pending</span>
              </div>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                {pendingSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('published');
                setStatusFilter('approved');
              }}
              aria-current={activeTab === 'published' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'published'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Published ({publishedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              aria-current={activeTab === 'users' || activeTab === 'reporters' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'users' || activeTab === 'reporters'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>వినియోగదారులు (Users)</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  activeTab === 'users' || activeTab === 'reporters'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                {userMetrics.total}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('citizen')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Megaphone className="w-4 h-4" />
              <span>ప్రజల వార్తలు</span>
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              aria-current={activeTab === 'comments' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'comments'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>కామెంట్లు (Comments)</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  activeTab === 'comments'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                {commentsList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reports');
                setReportStatusFilter('pending');
              }}
              aria-current={activeTab === 'reports' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
                activeTab === 'reports'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4" />
                <span>రిపోర్టులు (Reports)</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  activeTab === 'reports'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                {reportMetrics.pending}
              </span>
            </button>

            <div className="pt-4 mt-4 border-t border-neutral-800/80">
              <span className="text-[10px] font-bold text-neutral-500 px-3 uppercase tracking-wider block mb-1">
                సెట్టింగ్స్
              </span>
              <button
                onClick={() => alert('నోటిఫికేషన్ మేనేజర్ సిద్ధంగా ఉంది.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60 focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Bell className="w-4 h-4" />
                <span>Push Notification</span>
              </button>
              <button
                onClick={() => alert('యాడ్స్ మేనేజర్ సిద్ధంగా ఉంది.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60 focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Layers className="w-4 h-4" />
                <span>Ads Management</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Switch back to mobile app preview & Logout */}
        <div className="pt-4 border-t border-neutral-800 space-y-2">
          <button
            onClick={onSwitchToMobile}
            aria-label="మొబైల్ యాప్ చూడండి (Switch to mobile preview)"
            className="w-full flex items-center justify-center gap-2 bg-[#E41E26] hover:bg-[#B71C1C] text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
          >
            <Smartphone className="w-4 h-4" />
            <span>మొబైల్ యాప్ చూడండి</span>
          </button>

          <button
            onClick={onSwitchToMobile}
            aria-label="లాగౌట్ (Logout)"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>లాగౌట్</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area matching Screen 6 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar matching Screen 6 */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-neutral-900 leading-tight telugu-heading">
              {activeTab === 'comments'
                ? 'కామెంట్ల నిర్వహణ (Comments)'
                : activeTab === 'users' || activeTab === 'reporters'
                ? 'వినియోగదారుల నిర్వహణ (User Management)'
                : activeTab === 'reports'
                ? 'రిపోర్టుల నిర్వహణ (Reports Moderation)'
                : 'Dashboard'}
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {activeTab === 'comments'
                ? 'పాఠకుల కామెంట్లను పరిశీలించి ఆమోదించండి లేదా దాచండి'
                : activeTab === 'users' || activeTab === 'reporters'
                ? 'రచ్చబండ వినియోగదారుల ప్రొఫైల్స్ మరియు రోల్ అనుమతుల నిర్వహణ'
                : activeTab === 'reports'
                ? 'పాఠకులు సమర్పించిన కంటెంట్ ఫిర్యాదుల పరిశీలన మరియు మోడరేషన్'
                : 'రచ్చ బండ న్యూస్ మేనేజ్‌మెంట్ సెంటర్'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
              📅 {new Date().toLocaleDateString('te-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>

            {/* Admin Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200">
              <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {adminInitials}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-neutral-900 leading-none">
                  {adminName}
                </span>
                <span className="text-[10px] font-bold text-red-600 uppercase mt-0.5">
                  {adminRole}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* 6 Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1. ఈరోజు వార్తలు */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center flex-shrink-0">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  ఈరోజు వార్తలు
                </span>
                <span className="text-2xl font-black text-neutral-900 mt-0.5 block">
                  {totalNewsCount}
                </span>
              </div>
            </div>

            {/* 2. Pending */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FF9800] flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  Pending
                </span>
                <span className="text-2xl font-black text-amber-600 mt-0.5 block">
                  {pendingSubmissions.length}
                </span>
              </div>
            </div>

            {/* 3. Published */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#43A047] flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  Published
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                  {publishedCount}
                </span>
              </div>
            </div>

            {/* 4. వినియోగదారులు (Users) */}
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              aria-label={`వినియోగదారుల నిర్వహణ చూడండి - మొత్తం ${userMetrics.total} యూజర్లు (Open user management)`}
              className={`bg-white p-4 rounded-2xl border text-left shadow-xs flex items-center gap-3.5 transition-all focus-visible:ring-2 focus-visible:ring-red-400 cursor-pointer ${
                activeTab === 'users' || activeTab === 'reporters'
                  ? 'border-red-500 ring-2 ring-red-100'
                  : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#8E24AA] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  వినియోగదారులు (Users)
                </span>
                <span className="text-2xl font-black text-purple-700 mt-0.5 block font-mono">
                  {userMetrics.total}
                </span>
              </div>
            </button>

            {/* 5. ప్రజల వార్తలు */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E41E26] flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  ప్రజల వార్తలు
                </span>
                <span className="text-2xl font-black text-[#E41E26] mt-0.5 block">
                  {currentSubmissions.length}
                </span>
              </div>
            </div>

            {/* 6. కామెంట్లు (Comments) */}
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              aria-label={`కామెంట్ల నిర్వహణ చూడండి - మొత్తం ${commentsList.length} కామెంట్లు (Open comments moderation)`}
              className={`bg-white p-4 rounded-2xl border text-left shadow-xs flex items-center gap-3.5 transition-all focus-visible:ring-2 focus-visible:ring-red-400 cursor-pointer ${
                activeTab === 'comments'
                  ? 'border-red-500 ring-2 ring-red-100'
                  : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  కామెంట్లు (Comments)
                </span>
                <span className="text-2xl font-black text-neutral-900 mt-0.5 block font-mono">
                  {commentsList.length}
                </span>
              </div>
            </button>

            {/* 7. రిపోర్టులు (Reports) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('reports');
                setReportStatusFilter('pending');
              }}
              aria-label={`రిపోర్టుల నిర్వహణ చూడండి - ${reportMetrics.pending} పెండింగ్ (Open reports moderation)`}
              className={`bg-white p-4 rounded-2xl border text-left shadow-xs flex items-center gap-3.5 transition-all focus-visible:ring-2 focus-visible:ring-red-400 cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-red-500 ring-2 ring-red-100'
                  : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 text-[#E41E26] flex items-center justify-center flex-shrink-0">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  రిపోర్టులు (Reports)
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 block font-mono">
                    {reportMetrics.total}
                  </span>
                  {reportMetrics.pending > 0 && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200">
                      {reportMetrics.pending}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Feedback Toast Banner */}
          {feedback && (
            <div
              role="alert"
              className={`p-3 text-xs rounded-xl flex items-center justify-between border shadow-2xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span className="font-semibold">{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                aria-label="సందేశాన్ని తీసివేయండి (Dismiss message)"
                className="text-neutral-400 hover:text-neutral-600 font-bold px-1 focus-visible:ring-2 focus-visible:ring-neutral-400 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {/* Comments Moderation Panel vs News Submissions Table */}
          {activeTab === 'comments' ? (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              {/* Comments Panel Header */}
              <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-neutral-900 telugu-heading flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#E41E26]" aria-hidden="true" />
                      <span>కామెంట్ల నిర్వహణ (Comments Moderation)</span>
                    </h2>
                    <button
                      onClick={loadModerationComments}
                      disabled={isCommentsLoading}
                      aria-label="కామెంట్లు రీఫ్రెష్ చేయండి (Refresh comments)"
                      title="కామెంట్లు రీఫ్రెష్ చేయండి"
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCommentsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    మొత్తం కామెంట్లు: <span className="font-bold text-neutral-800">{commentsList.length}</span> (ఆమోదించినవి: <span className="font-semibold text-emerald-700">{approvedCommentsCount}</span> | దాచినవి: <span className="font-semibold text-amber-700">{hiddenCommentsCount}</span>) — సరికొత్తవి మొదట
                  </p>
                </div>

                {/* Search & Status Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      id="comment-moderation-search-input"
                      aria-label="కామెంట్ లేదా రచయిత వెతకండి (Search comment or user)"
                      type="text"
                      value={commentSearchQuery}
                      onChange={(e) => setCommentSearchQuery(e.target.value)}
                      placeholder="కామెంట్, రచయిత లేదా వార్త వెతకండి..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                    />
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2 pointer-events-none" aria-hidden="true" />
                  </div>

                  <select
                    id="comment-status-filter-select"
                    aria-label="కామెంట్ స్థితి ఫిల్టర్ (Filter comments by status)"
                    value={commentStatusFilter}
                    onChange={(e) => setCommentStatusFilter(e.target.value as any)}
                    className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-red-400 font-medium"
                  >
                    <option value="all">అన్నీ ({commentsList.length}) / All</option>
                    <option value="approved">ఆమోదించబడింది ({approvedCommentsCount}) / Approved</option>
                    <option value="hidden">దాచబడింది ({hiddenCommentsCount}) / Hidden</option>
                  </select>
                </div>
              </div>

              {/* Error banner if commentsError */}
              {commentsError && (
                <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{commentsError}</span>
                  </div>
                  <button
                    onClick={loadModerationComments}
                    className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[11px] font-bold hover:bg-red-700 transition-colors"
                  >
                    మళ్ళీ ప్రయత్నించండి (Retry)
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isCommentsLoading && commentsList.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600 mb-2" />
                  <p className="text-xs font-semibold">కామెంట్లు లోడ్ అవుతున్నాయి... (Loading comments...)</p>
                </div>
              ) : filteredComments.length === 0 ? (
                /* Empty State */
                <div className="py-16 text-center text-neutral-500">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-neutral-700">కామెంట్లు ఏవీ లేవు (No comments found)</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    {commentSearchQuery || commentStatusFilter !== 'all'
                      ? 'మీ ఫిల్టర్ లేదా సెర్చ్ పదం సరిపోలడం లేదు. దయచేసి మార్చి ప్రయత్నించండి.'
                      : 'ఇప్పటివరకు ఎటువంటి కామెంట్లు రాలేదు.'}
                  </p>
                </div>
              ) : (
                /* Comments Moderation Table */
                <div className="overflow-x-auto">
                  <table
                    aria-label="కామెంట్ల మోడరేషన్ పట్టిక (Comments moderation table)"
                    className="w-full text-left text-xs border-collapse"
                  >
                    <thead>
                      <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-bold">
                        <th className="py-3 px-4 w-12">#</th>
                        <th className="py-3 px-4 min-w-[280px]">కామెంట్ & వార్త (Comment & Article)</th>
                        <th className="py-3 px-4 min-w-[150px]">రచయిత (User & Location)</th>
                        <th className="py-3 px-4 min-w-[140px]">సమయం (Date & Time)</th>
                        <th className="py-3 px-4 min-w-[140px]">స్థితి (Status)</th>
                        <th className="py-3 px-4 text-center min-w-[160px]">చర్యలు (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredComments.map((comment, index) => {
                        const isProcessing = commentProcessingId === comment.id;
                        return (
                          <tr
                            key={comment.id}
                            className="hover:bg-neutral-50/60 transition-colors group"
                          >
                            {/* Index */}
                            <td className="py-3.5 px-4 font-mono font-bold text-neutral-400 align-top">
                              {index + 1}
                            </td>

                            {/* Comment text & Associated news title */}
                            <td className="py-3.5 px-4 align-top">
                              <p className="text-xs font-semibold text-neutral-900 leading-relaxed whitespace-pre-wrap break-words">
                                {comment.comment}
                              </p>
                              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
                                <span className="font-semibold text-neutral-400">వార్త:</span>
                                <span
                                  className="font-medium text-neutral-700 line-clamp-1"
                                  title={comment.newsTitle || `వార్తా ఐడీ: ${comment.newsId}`}
                                >
                                  {comment.newsTitle || `వార్తా ఐడీ: ${comment.newsId}`}
                                </span>
                              </div>
                            </td>

                            {/* User details */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="font-bold text-neutral-900">{comment.userName}</div>
                              {comment.userLocation && (
                                <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                                  <span>📍</span>
                                  <span>{comment.userLocation}</span>
                                </div>
                              )}
                            </td>

                            {/* Date / Time */}
                            <td className="py-3.5 px-4 text-neutral-600 font-mono text-[11px] align-top">
                              <div>{comment.timeAgo}</div>
                              <div className="text-[10px] text-neutral-400 mt-0.5 font-sans">
                                {new Date(comment.createdAt).toLocaleDateString('te-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 align-top">
                              {comment.isApproved ? (
                                <span
                                  className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  title="ఆమోదించబడింది - ప్రజలకు కనిపిస్తుంది"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                                  <span>ఆమోదించబడింది (Approved)</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  title="దాచబడింది - ప్రజలకు కనిపించదు"
                                >
                                  <EyeOff className="w-3 h-3 text-amber-600" aria-hidden="true" />
                                  <span>దాచబడింది (Hidden)</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-center align-top">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {comment.isApproved ? (
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => handleToggleCommentApproval(comment)}
                                    aria-label={`కామెంట్ దాచు: "${comment.comment.slice(0, 25)}" (Hide comment)`}
                                    title="ఈ కామెంట్‌ను దాచండి"
                                    className={`px-2.5 py-1 bg-white border border-amber-400 text-amber-700 hover:bg-amber-50 rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-400 ${
                                      isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-amber-600" aria-hidden="true" />
                                    )}
                                    <span>దాచు (Hide)</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => handleToggleCommentApproval(comment)}
                                    aria-label={`కామెంట్ ఆమోదించు: "${comment.comment.slice(0, 25)}" (Approve comment)`}
                                    title="ఈ కామెంట్‌ను ఆమోదించండి"
                                    className={`px-2.5 py-1 bg-white border border-emerald-500 text-emerald-700 hover:bg-emerald-50 rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                                      isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                                    )}
                                    <span>ఆమోదించు (Approve)</span>
                                  </button>
                                )}

                                <button
                                  disabled={isProcessing}
                                  onClick={() => setDeletingCommentTarget(comment)}
                                  aria-label={`కామెంట్ తొలగించు: "${comment.comment.slice(0, 25)}" (Delete comment)`}
                                  title="ఈ కామెంట్‌ను శాశ్వతంగా తొలగించండి"
                                  className={`px-2 py-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red-400 ${
                                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" aria-hidden="true" />
                                  <span>తొలగించు (Delete)</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'users' || activeTab === 'reporters' ? (
            /* Users Management Panel (Requirement 1-9) */
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-neutral-900 telugu-heading flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#E41E26]" aria-hidden="true" />
                      <span>వినియోగదారుల నిర్వహణ (User Management)</span>
                    </h2>
                    <button
                      onClick={() => loadUsers(debouncedSearch, userRoleFilter)}
                      disabled={isUsersLoading}
                      aria-label="వినియోగదారుల జాబితా రీఫ్రెష్ చేయండి (Refresh users)"
                      title="వినియోగదారుల జాబితా రీఫ్రెష్ చేయండి"
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isUsersLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    రచ్చబండ నమోదిత వినియోగదారులు, సిటిజన్ రిపోర్టర్లు, జర్నలిస్టులు మరియు సిబ్బంది రోల్స్ నిర్వహణ
                  </p>
                </div>

                {/* Search & Role Filter (Requirement 3 & 4) */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <input
                      id="user-management-search-input"
                      aria-label="పేరు, జిల్లా, మండలం లేదా యూజర్ ఐడీ వెతకండి (Search name, district, mandal, or user ID)"
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="పేరు, జిల్లా, మండలం లేదా ID..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                    />
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2 pointer-events-none" aria-hidden="true" />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        aria-label="సెర్చ్ ఖాళీ చేయండి (Clear search)"
                        className="absolute right-2 top-1.5 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    id="user-role-filter-select"
                    aria-label="వినియోగదారుల రోల్ ఫిల్టర్ (Filter users by role)"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as UserRole | 'all')}
                    className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-red-400 font-medium"
                  >
                    <option value="all">అన్నీ ({userMetrics.total}) / All</option>
                    <option value="reader">రీడర్ ({userMetrics.readers}) / Reader</option>
                    <option value="citizen_reporter">పౌర రిపోర్టర్ ({userMetrics.citizenReporters}) / Citizen Reporter</option>
                    <option value="reporter">రిపోర్టర్ ({userMetrics.reporters}) / Reporter</option>
                    <option value="editor">ఎడిటర్ ({userMetrics.editors}) / Editor</option>
                    <option value="admin">అడ్మిన్ ({userMetrics.admins}) / Admin</option>
                  </select>
                </div>
              </div>

              {/* User Metrics Cards (Requirement 2) */}
              <div className="p-5 pb-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                  {/* Total Users */}
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('all')}
                    aria-label={`అన్ని రోల్స్ చూపించు - మొత్తం ${userMetrics.total} (Show all roles)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
                      userRoleFilter === 'all'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${userRoleFilter === 'all' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      మొత్తం వినియోగదారులు (Total)
                    </span>
                    <span className="text-xl font-black block font-mono mt-1">
                      {userMetrics.total}
                    </span>
                  </button>

                  {/* Readers */}
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('reader')}
                    aria-label={`రీడర్లను చూపించు - ${userMetrics.readers} (Show readers)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
                      userRoleFilter === 'reader'
                        ? 'bg-neutral-800 text-white border-neutral-800 shadow-sm'
                        : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${userRoleFilter === 'reader' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      రీడర్లు (Readers)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${userRoleFilter === 'reader' ? 'text-white' : 'text-neutral-700'}`}>
                      {userMetrics.readers}
                    </span>
                  </button>

                  {/* Citizen Reporters */}
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('citizen_reporter')}
                    aria-label={`పౌర రిపోర్టర్లను చూపించు - ${userMetrics.citizenReporters} (Show citizen reporters)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      userRoleFilter === 'citizen_reporter'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white hover:bg-amber-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${userRoleFilter === 'citizen_reporter' ? 'text-amber-100' : 'text-amber-700'}`}>
                      పౌర రిపోర్టర్లు
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${userRoleFilter === 'citizen_reporter' ? 'text-white' : 'text-amber-600'}`}>
                      {userMetrics.citizenReporters}
                    </span>
                  </button>

                  {/* Reporters */}
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('reporter')}
                    aria-label={`రిపోర్టర్లను చూపించు - ${userMetrics.reporters} (Show reporters)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      userRoleFilter === 'reporter'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white hover:bg-blue-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${userRoleFilter === 'reporter' ? 'text-blue-100' : 'text-blue-700'}`}>
                      రిపోర్టర్లు (Reporters)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${userRoleFilter === 'reporter' ? 'text-white' : 'text-blue-600'}`}>
                      {userMetrics.reporters}
                    </span>
                  </button>

                  {/* Editors */}
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('editor')}
                    aria-label={`ఎడిటర్లను చూపించు - ${userMetrics.editors} (Show editors)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                      userRoleFilter === 'editor'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white hover:bg-purple-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${userRoleFilter === 'editor' ? 'text-purple-100' : 'text-purple-700'}`}>
                      ఎడిటర్లు (Editors)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${userRoleFilter === 'editor' ? 'text-white' : 'text-purple-700'}`}>
                      {userMetrics.editors}
                    </span>
                  </button>

                  {/* Admins */}
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('admin')}
                    aria-label={`అడ్మిన్లను చూపించు - ${userMetrics.admins} (Show admins)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
                      userRoleFilter === 'admin'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-white hover:bg-red-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${userRoleFilter === 'admin' ? 'text-red-100' : 'text-red-700'}`}>
                      అడ్మిన్లు (Admins)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${userRoleFilter === 'admin' ? 'text-white' : 'text-red-600'}`}>
                      {userMetrics.admins}
                    </span>
                  </button>
                </div>

                {/* Editor View-Only Note (Requirement 7) */}
                {!isCurrentUserAdmin && (
                  <div
                    role="note"
                    className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
                    <span>
                      గమనిక: మీరు వీక్షణ మాత్రమే చేయగలరు. యూజర్ రోల్స్ మార్చడానికి కేవలం అడ్మినిస్ట్రేటర్లకు మాత్రమే అనుమతి ఉంది. (Only administrators can change user roles.)
                    </span>
                  </div>
                )}
              </div>

              {/* Error banner if usersError */}
              {usersError && (
                <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{usersError}</span>
                  </div>
                  <button
                    onClick={() => loadUsers(debouncedSearch, userRoleFilter)}
                    className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[11px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    మళ్ళీ ప్రయత్నించండి (Retry)
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isUsersLoading && usersList.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600 mb-2" />
                  <p className="text-xs font-semibold">వినియోగదారుల సమాచారం లోడ్ అవుతోంది... (Loading users...)</p>
                </div>
              ) : usersList.length === 0 ? (
                /* Empty State */
                <div className="py-16 text-center text-neutral-500">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-neutral-700">వినియోగదారులు ఎవరూ కనుగొనబడలేదు (No users found)</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    {userSearchQuery || userRoleFilter !== 'all'
                      ? 'మీ ఫిల్టర్ లేదా సెర్చ్ పదం సరిపోలడం లేదు. దయచేసి మార్చి ప్రయత్నించండి.'
                      : 'ఇప్పటివరకు ఎటువంటి వినియోగదారుల ప్రొఫైల్స్ నమోదు కాలేదు.'}
                  </p>
                  {(userSearchQuery || userRoleFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setUserSearchQuery('');
                        setUserRoleFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ఫిల్టర్లు తొలగించండి (Reset Filters)
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table View (Requirement 5) */}
                  <div className="overflow-x-auto hidden md:block">
                    <table
                      aria-label="వినియోగదారుల నిర్వహణ పట్టిక (Users management table)"
                      className="w-full text-left text-xs border-collapse"
                    >
                      <thead>
                        <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-bold">
                          <th className="py-3 px-4 w-12">#</th>
                          <th className="py-3 px-4 min-w-[220px]">వినియోగదారుడు (User Profile)</th>
                          <th className="py-3 px-4 min-w-[150px]">ప్రాంతం (District & Mandal)</th>
                          <th className="py-3 px-4 min-w-[120px]">నమోదు తేదీ (Registered)</th>
                          <th className="py-3 px-4 min-w-[130px]">ప్రస్తుత రోల్ (Role)</th>
                          <th className="py-3 px-4 min-w-[180px] text-center">చర్యలు (Role Management)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {usersList.map((u, index) => {
                          const isSelf = user?.id === u.id;
                          const isProcessing = userProcessingId === u.id;
                          const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.reader;

                          return (
                            <tr
                              key={u.id}
                              className={`hover:bg-neutral-50/60 transition-colors group ${
                                isSelf ? 'bg-red-50/20' : ''
                              }`}
                            >
                              {/* Index */}
                              <td className="py-3.5 px-4 font-mono font-bold text-neutral-400 align-middle">
                                {index + 1}
                              </td>

                              {/* User Profile (Avatar + Name + ID) */}
                              <td className="py-3.5 px-4 align-middle">
                                <div className="flex items-center gap-3">
                                  {u.avatar_url ? (
                                    <img
                                      src={u.avatar_url}
                                      alt={u.full_name}
                                      className="w-9 h-9 rounded-full object-cover border border-neutral-200 flex-shrink-0"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold text-xs border border-neutral-200 flex-shrink-0">
                                      {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                                      <span>{u.full_name || 'పేరులేని యూజర్ (Anonymous)'}</span>
                                      {isSelf && (
                                        <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                                          మీరు (You)
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className="font-mono text-[10px] text-neutral-400 block mt-0.5"
                                      title={`పూర్తి ఐడీ: ${u.id}`}
                                    >
                                      ID: {u.id.slice(0, 8)}...{u.id.slice(-4)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Location (District & Mandal) */}
                              <td className="py-3.5 px-4 text-neutral-700 text-xs align-middle">
                                {u.district || u.mandal ? (
                                  <div>
                                    <span className="font-semibold text-neutral-800">{u.district || '—'}</span>
                                    {u.mandal && (
                                      <span className="text-neutral-500 text-[11px] block mt-0.5">
                                        📍 {u.mandal}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-neutral-400 italic">లొకేషన్ ఇవ్వలేదు (N/A)</span>
                                )}
                              </td>

                              {/* Registration Date */}
                              <td className="py-3.5 px-4 text-neutral-500 font-mono text-[11px] align-middle">
                                {u.created_at ? (
                                  new Date(u.created_at).toLocaleDateString('te-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                ) : (
                                  '—'
                                )}
                              </td>

                              {/* Role Badge */}
                              <td className="py-3.5 px-4 align-middle">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
                                  <span>{config.telugu} ({config.english})</span>
                                </span>
                              </td>

                              {/* Role Management Action (Requirement 6, 7, 8) */}
                              <td className="py-3.5 px-4 text-center align-middle">
                                {!isCurrentUserAdmin ? (
                                  <span className="text-[11px] text-neutral-400 font-medium">
                                    వీక్షణ మాత్రమే (View Only)
                                  </span>
                                ) : isSelf && u.role === 'admin' ? (
                                  <div className="flex flex-col items-center">
                                    <select
                                      aria-label={`${u.full_name} అడ్మిన్ హోదా (Admin status)`}
                                      value="admin"
                                      disabled
                                      className="text-xs font-semibold border border-neutral-200 rounded-lg px-2.5 py-1 bg-neutral-100 text-neutral-500 cursor-not-allowed shadow-2xs"
                                    >
                                      <option value="admin">అడ్మిన్ (Admin)</option>
                                    </select>
                                    <span
                                      title="మీ స్వంత అడ్మినిస్ట్రేటర్ ఖాతాను మార్చలేరు (You cannot demote your own administrator account)"
                                      className="text-[10px] text-neutral-400 mt-1 max-w-[200px] text-center leading-tight block"
                                    >
                                      మీ స్వంత అడ్మినిస్ట్రేటర్ ఖాతాను మార్చలేరు (You cannot demote your own administrator account)
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    {isProcessing ? (
                                      <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                        <span>మార్చుతోంది...</span>
                                      </div>
                                    ) : (
                                      <select
                                        aria-label={`${u.full_name} రోల్ మార్చండి (Change role for ${u.full_name})`}
                                        value={u.role}
                                        disabled={isProcessing}
                                        onChange={(e) => {
                                          const nextRole = e.target.value as UserRole;
                                          if (nextRole !== u.role) {
                                            setRoleChangeTarget({ user: u, newRole: nextRole });
                                          }
                                        }}
                                        className="text-xs font-semibold border border-neutral-300 rounded-lg px-2.5 py-1 bg-white text-neutral-800 hover:border-neutral-400 focus-visible:ring-2 focus-visible:ring-red-400 outline-none cursor-pointer transition-colors shadow-2xs"
                                      >
                                        <option value="reader">రీడర్ (Reader)</option>
                                        <option value="citizen_reporter">పౌర రిపోర్టర్ (Citizen Reporter)</option>
                                        <option value="reporter">రిపోర్టర్ (Reporter)</option>
                                        <option value="editor">ఎడిటర్ (Editor)</option>
                                        <option value="admin">అడ్మిన్ (Admin)</option>
                                      </select>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Cards View (Requirement 5) */}
                  <div className="p-4 space-y-3 md:hidden">
                    {usersList.map((u) => {
                      const isSelf = user?.id === u.id;
                      const isProcessing = userProcessingId === u.id;
                      const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.reader;

                      return (
                        <div
                          key={u.id}
                          className={`p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs space-y-3 ${
                            isSelf ? 'ring-1 ring-red-200 bg-red-50/10' : ''
                          }`}
                        >
                          {/* Card Header: Avatar, Name, ID, Self badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              {u.avatar_url ? (
                                <img
                                  src={u.avatar_url}
                                  alt={u.full_name}
                                  className="w-10 h-10 rounded-full object-cover border border-neutral-200 flex-shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold text-xs border border-neutral-200 flex-shrink-0">
                                  {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5 flex-wrap">
                                  <span>{u.full_name || 'పేరులేని యూజర్ (Anonymous)'}</span>
                                  {isSelf && (
                                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                                      మీరు (You)
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-neutral-400 block mt-0.5">
                                  ID: {u.id.slice(0, 8)}...{u.id.slice(-4)}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
                              <span>{config.english}</span>
                            </span>
                          </div>

                          {/* Location & Date */}
                          <div className="text-[11px] text-neutral-600 flex items-center justify-between pt-2 border-t border-neutral-100">
                            <div>
                              <span className="text-neutral-400">ప్రాంతం: </span>
                              <span className="font-semibold text-neutral-800">
                                {u.district || u.mandal ? `${u.district || ''} ${u.mandal ? `(${u.mandal})` : ''}` : '—'}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-neutral-400">
                              {u.created_at ? (
                                new Date(u.created_at).toLocaleDateString('te-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              ) : (
                                '—'
                              )}
                            </div>
                          </div>

                          {/* Role Selector for Mobile */}
                          {isCurrentUserAdmin && (
                            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-neutral-600">రోల్ మార్చు:</span>
                              {isSelf && u.role === 'admin' ? (
                                <div className="text-right">
                                  <select
                                    aria-label={`${u.full_name} అడ్మిన్ హోదా (Admin status)`}
                                    value="admin"
                                    disabled
                                    className="text-xs font-semibold border border-neutral-200 rounded-lg px-2 py-1 bg-neutral-100 text-neutral-500 cursor-not-allowed shadow-2xs"
                                  >
                                    <option value="admin">అడ్మిన్ (Admin)</option>
                                  </select>
                                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                                    మీ స్వంత అడ్మినిస్ట్రేటర్ ఖాతాను మార్చలేరు (You cannot demote your own administrator account)
                                  </span>
                                </div>
                              ) : isProcessing ? (
                                <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                  <span>మార్చుతోంది...</span>
                                </div>
                              ) : (
                                <select
                                  aria-label={`${u.full_name} మొబైల్ రోల్ మార్చండి (Change role for ${u.full_name})`}
                                  value={u.role}
                                  disabled={isProcessing}
                                  onChange={(e) => {
                                    const nextRole = e.target.value as UserRole;
                                    if (nextRole !== u.role) {
                                      setRoleChangeTarget({ user: u, newRole: nextRole });
                                    }
                                  }}
                                  className="text-xs font-semibold border border-neutral-300 rounded-lg px-2 py-1 bg-white text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                                >
                                  <option value="reader">రీడర్ (Reader)</option>
                                  <option value="citizen_reporter">పౌర రిపోర్టర్ (Citizen Reporter)</option>
                                  <option value="reporter">రిపోర్టర్ (Reporter)</option>
                                  <option value="editor">ఎడిటర్ (Editor)</option>
                                  <option value="admin">అడ్మిన్ (Admin)</option>
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : activeTab === 'reports' ? (
            /* Content Reports Moderation Panel (#8D-2) */
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-neutral-900 telugu-heading flex items-center gap-2">
                      <Flag className="w-5 h-5 text-[#E41E26]" aria-hidden="true" />
                      <span>రిపోర్టుల నిర్వహణ (Content Reports Moderation)</span>
                    </h2>
                    <button
                      onClick={loadReports}
                      disabled={isReportsLoading}
                      aria-label="రిపోర్టుల సమాచారం రీఫ్రెష్ చేయండి (Refresh reports)"
                      title="తాజా సమాచారం రీఫ్రెష్ చేయండి"
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isReportsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    పాఠకుల నుండి వచ్చిన కంటెంట్ ఫిర్యాదుల పరిశీలన మరియు మోడరేషన్
                  </p>
                </div>

                {/* Search & Type Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <input
                      id="admin-reports-search-input"
                      aria-label="రిపోర్టుల్లో వెతకండి (Search reports by reporter, reason, details)"
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      placeholder="రిపోర్టర్, కారణం, వివరాలు వెతకండి..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                    />
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2 pointer-events-none" aria-hidden="true" />
                  </div>

                  <select
                    id="admin-reports-type-filter"
                    aria-label="కంటెంట్ రకం ఫిల్టర్ (Content type filter)"
                    value={reportTypeFilter}
                    onChange={(e) => setReportTypeFilter(e.target.value as any)}
                    className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-red-400 w-full sm:w-auto cursor-pointer"
                  >
                    <option value="all">అన్ని రకాలు (All Types)</option>
                    <option value="news">వార్తలు (News: {reportMetrics.newsReports})</option>
                    <option value="comment">కామెంట్లు (Comments: {reportMetrics.commentReports})</option>
                  </select>
                </div>
              </div>

              {/* Status Filter Metric Pills */}
              <div className="p-4 bg-neutral-50/60 border-b border-neutral-100">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* 1. Pending (Default & Emphasized) */}
                  <button
                    type="button"
                    onClick={() => setReportStatusFilter('pending')}
                    aria-label={`పరిశీలనలో ఉన్నవి చూపించు - ${reportMetrics.pending} (Show pending reports)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      reportStatusFilter === 'pending'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white hover:bg-amber-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${reportStatusFilter === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
                      పరిశీలనలో ఉన్నవి (Pending)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${reportStatusFilter === 'pending' ? 'text-white' : 'text-amber-700'}`}>
                      {reportMetrics.pending}
                    </span>
                  </button>

                  {/* 2. Reviewed */}
                  <button
                    type="button"
                    onClick={() => setReportStatusFilter('reviewed')}
                    aria-label={`పరిశీలించినవి చూపించు - ${reportMetrics.reviewed} (Show reviewed reports)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      reportStatusFilter === 'reviewed'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white hover:bg-blue-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${reportStatusFilter === 'reviewed' ? 'text-blue-100' : 'text-blue-700'}`}>
                      పరిశీలించినవి (Reviewed)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${reportStatusFilter === 'reviewed' ? 'text-white' : 'text-blue-700'}`}>
                      {reportMetrics.reviewed}
                    </span>
                  </button>

                  {/* 3. Actioned */}
                  <button
                    type="button"
                    onClick={() => setReportStatusFilter('actioned')}
                    aria-label={`చర్య తీసుకున్నవి చూపించు - ${reportMetrics.actioned} (Show actioned reports)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      reportStatusFilter === 'actioned'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-emerald-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${reportStatusFilter === 'actioned' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      చర్య తీసుకున్నవి (Actioned)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${reportStatusFilter === 'actioned' ? 'text-white' : 'text-emerald-700'}`}>
                      {reportMetrics.actioned}
                    </span>
                  </button>

                  {/* 4. Dismissed */}
                  <button
                    type="button"
                    onClick={() => setReportStatusFilter('dismissed')}
                    aria-label={`తిరస్కరించినవి చూపించు - ${reportMetrics.dismissed} (Show dismissed reports)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                      reportStatusFilter === 'dismissed'
                        ? 'bg-neutral-700 text-white border-neutral-700 shadow-sm'
                        : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${reportStatusFilter === 'dismissed' ? 'text-neutral-200' : 'text-neutral-600'}`}>
                      తిరస్కరించినవి (Dismissed)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${reportStatusFilter === 'dismissed' ? 'text-white' : 'text-neutral-700'}`}>
                      {reportMetrics.dismissed}
                    </span>
                  </button>

                  {/* 5. All */}
                  <button
                    type="button"
                    onClick={() => setReportStatusFilter('all')}
                    aria-label={`మొత్తం చూపించు - ${reportMetrics.total} (Show all reports)`}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 ${
                      reportStatusFilter === 'all'
                        ? 'bg-[#E41E26] text-white border-[#E41E26] shadow-sm'
                        : 'bg-white hover:bg-red-50/50 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${reportStatusFilter === 'all' ? 'text-red-100' : 'text-[#E41E26]'}`}>
                      అన్నీ (All Reports)
                    </span>
                    <span className={`text-xl font-black block font-mono mt-1 ${reportStatusFilter === 'all' ? 'text-white' : 'text-neutral-900'}`}>
                      {reportMetrics.total}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {reportsError && (
                <div
                  role="alert"
                  className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-800"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{reportsError}</span>
                  </div>
                  <button
                    onClick={loadReports}
                    className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[11px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    మళ్ళీ ప్రయత్నించండి (Retry)
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isReportsLoading && reportsList.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E41E26] mb-2" />
                  <p className="text-xs font-semibold">రిపోర్టుల సమాచారం లోడ్ అవుతోంది... (Loading content reports...)</p>
                </div>
              ) : filteredReports.length === 0 ? (
                /* Empty State */
                <div className="py-16 text-center text-neutral-500">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                    <Flag className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-neutral-700">ఫిర్యాదులు ఏవీ కనుగొనబడలేదు (No reports found)</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    {reportSearchQuery || reportStatusFilter !== 'all' || reportTypeFilter !== 'all'
                      ? 'మీ ఫిల్టర్ లేదా శోధన పదం సరిపోలడం లేదు. దయచేసి మార్చి ప్రయత్నించండి.'
                      : 'ప్రస్తుతం పరిశీలించాల్సిన ఫిర్యాదులు ఏవీ లేవు. కమ్యూనిటీ నిబంధనలు సక్రమంగా ఉన్నాయి.'}
                  </p>
                  {(reportSearchQuery || reportStatusFilter !== 'all' || reportTypeFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setReportSearchQuery('');
                        setReportStatusFilter('pending');
                        setReportTypeFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ఫిల్టర్లు రీసెట్ చేయండి (Reset Filters)
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="overflow-x-auto hidden md:block">
                    <table
                      aria-label="కంటెంట్ రిపోర్టుల పట్టిక (Content reports moderation table)"
                      className="w-full text-left text-xs border-collapse"
                    >
                      <thead>
                        <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-bold">
                          <th className="py-3 px-4 w-12">#</th>
                          <th className="py-3 px-4 min-w-[150px]">రకం & కారణం (Type / Reason)</th>
                          <th className="py-3 px-4 min-w-[260px]">ఫిర్యాదు కంటెంట్ (Reported Content)</th>
                          <th className="py-3 px-4 min-w-[180px]">రిపోర్టర్ & వివరాలు (Reporter & Details)</th>
                          <th className="py-3 px-4 min-w-[130px]">స్థితి (Status)</th>
                          <th className="py-3 px-4 min-w-[200px] text-center">చర్యలు (Moderation Actions)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filteredReports.map((report, index) => {
                          const isProcessing = reportProcessingId === report.id;
                          const statusCfg = REPORT_STATUS_CONFIG[report.status] || REPORT_STATUS_CONFIG.pending;
                          const reasonLabel = REPORT_REASON_LABELS[report.reason] || {
                            telugu: report.reason,
                            english: report.reason,
                          };

                          return (
                            <tr
                              key={report.id}
                              className={`hover:bg-neutral-50/60 transition-colors group ${
                                report.status === 'pending' ? 'bg-amber-50/15' : ''
                              }`}
                            >
                              {/* Index */}
                              <td className="py-3.5 px-4 font-mono font-bold text-neutral-400 align-top">
                                {index + 1}
                              </td>

                              {/* Type & Reason */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1.5">
                                  {/* Type Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      report.contentType === 'news'
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : 'bg-purple-50 text-purple-800 border-purple-200'
                                    }`}
                                  >
                                    {report.contentType === 'news' ? (
                                      <FileText className="w-3 h-3" />
                                    ) : (
                                      <MessageSquare className="w-3 h-3" />
                                    )}
                                    <span>{report.contentType === 'news' ? 'వార్త (News)' : 'కామెంట్ (Comment)'}</span>
                                  </span>

                                  {/* Reason Badge */}
                                  <div>
                                    <span className="font-bold text-neutral-900 block text-xs telugu-heading">
                                      {reasonLabel.telugu}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 font-mono">
                                      {reasonLabel.english}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Target Content */}
                              <td className="py-3.5 px-4 align-top">
                                {report.contentType === 'news' ? (
                                  <div className="space-y-1">
                                    <p className="font-bold text-neutral-900 text-xs line-clamp-2 leading-snug telugu-heading">
                                      {report.targetTitle || 'వార్తా శీర్షిక అందుబాటులో లేదు'}
                                    </p>
                                    {report.targetSnippet && (
                                      <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                                        {report.targetSnippet}
                                      </p>
                                    )}
                                    <span className="font-mono text-[10px] text-neutral-400 block" title={report.contentId}>
                                      ID: {report.contentId.slice(0, 13)}...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200/80 text-[11px] text-neutral-800 italic leading-relaxed">
                                      "{report.targetSnippet || 'కామెంట్ కంటెంట్ అందుబాటులో లేదు'}"
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                                      <span className="font-semibold text-neutral-600">రచయిత:</span>
                                      <span>{report.targetAuthorName || 'రచ్చబండ యూజర్'}</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-neutral-400 block" title={report.contentId}>
                                      ID: {report.contentId.slice(0, 13)}...
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Reporter & Details */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1.5">
                                  <div className="font-bold text-neutral-900 text-xs">
                                    {report.reporterName || 'రచ్చబండ యూజర్'}
                                  </div>
                                  <div className="text-[10px] text-neutral-500 font-mono">
                                    {new Date(report.createdAt).toLocaleDateString('te-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                  {report.details && (
                                    <div className="p-1.5 bg-amber-50/70 border border-amber-200/70 rounded-md text-[10px] text-amber-900 leading-snug">
                                      <span className="font-bold block text-[9px] uppercase tracking-wider text-amber-800">
                                        వివరాలు:
                                      </span>
                                      <span>{report.details}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Current Status */}
                              <td className="py-3.5 px-4 align-top">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                  <span>{statusCfg.telugu}</span>
                                </span>
                                {report.reviewedAt && (
                                  <span className="block text-[9px] text-neutral-400 font-mono mt-1">
                                    సమీక్ష: {new Date(report.reviewedAt).toLocaleDateString('te-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </td>

                              {/* Moderation Actions */}
                              <td className="py-3.5 px-4 text-center align-top">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {/* Actioned Button */}
                                  <button
                                    disabled={isProcessing || report.status === 'actioned'}
                                    onClick={() => handleUpdateReportStatus(report.id, 'actioned')}
                                    aria-label={`రిపోర్ట్‌పై చర్య తీసుకోండి (Mark Actioned)`}
                                    title="ఫిర్యాదును ఆమోదించి చర్య తీసుకోండి"
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                                      report.status === 'actioned'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 opacity-60 cursor-default'
                                        : 'bg-white border border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                                    )}
                                    <span>చర్య (Action)</span>
                                  </button>

                                  {/* Reviewed Button */}
                                  <button
                                    disabled={isProcessing || report.status === 'reviewed'}
                                    onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                                    aria-label={`రిపోర్ట్ సమీక్షించబడిందిగా గుర్తించండి (Mark Reviewed)`}
                                    title="ఫిర్యాదు సమీక్షించబడిందిగా గుర్తించండి"
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                      report.status === 'reviewed'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-300 opacity-60 cursor-default'
                                        : 'bg-white border border-blue-400 text-blue-700 hover:bg-blue-50'
                                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <span>సమీక్ష (Reviewed)</span>
                                  </button>

                                  {/* Dismissed Button */}
                                  <button
                                    disabled={isProcessing || report.status === 'dismissed'}
                                    onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                    aria-label={`రిపోర్ట్ తిరస్కరించండి (Dismiss report)`}
                                    title="ఈ ఫిర్యాదును తిరస్కరించండి"
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                                      report.status === 'dismissed'
                                        ? 'bg-neutral-100 text-neutral-600 border border-neutral-300 opacity-60 cursor-default'
                                        : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <X className="w-3 h-3 text-neutral-500" aria-hidden="true" />
                                    <span>తిరస్కరించు (Dismiss)</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="divide-y divide-neutral-200 md:hidden">
                    {filteredReports.map((report) => {
                      const isProcessing = reportProcessingId === report.id;
                      const statusCfg = REPORT_STATUS_CONFIG[report.status] || REPORT_STATUS_CONFIG.pending;
                      const reasonLabel = REPORT_REASON_LABELS[report.reason] || {
                        telugu: report.reason,
                        english: report.reason,
                      };

                      return (
                        <div key={report.id} className="p-4 space-y-3 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  report.contentType === 'news'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                              >
                                {report.contentType === 'news' ? 'వార్త' : 'కామెంట్'}
                              </span>
                              <span className="text-xs font-bold text-neutral-900 telugu-heading">
                                {reasonLabel.telugu} ({reasonLabel.english})
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              {statusCfg.telugu}
                            </span>
                          </div>

                          {/* Target snippet */}
                          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs">
                            <span className="font-bold text-neutral-600 block text-[10px] uppercase">
                              {report.contentType === 'news' ? 'వార్త:' : 'కామెంట్:'}
                            </span>
                            <p className="font-medium text-neutral-900 mt-0.5 line-clamp-3">
                              {report.contentType === 'news'
                                ? report.targetTitle || report.contentId
                                : `"${report.targetSnippet || report.contentId}"`}
                            </p>
                          </div>

                          {/* User details */}
                          {report.details && (
                            <div className="p-2 bg-amber-50/70 border border-amber-200/70 rounded-lg text-xs text-amber-900">
                              <span className="font-bold block text-[10px] uppercase">వివరాలు:</span>
                              <p className="mt-0.5">{report.details}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                            <span>రిపోర్టర్: {report.reporterName || 'యూజర్'}</span>
                            <span>{new Date(report.createdAt).toLocaleDateString('te-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
                            <button
                              disabled={isProcessing || report.status === 'actioned'}
                              onClick={() => handleUpdateReportStatus(report.id, 'actioned')}
                              className="py-1.5 px-2 bg-emerald-50 border border-emerald-400 text-emerald-800 text-[11px] font-bold rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              చర్య (Action)
                            </button>
                            <button
                              disabled={isProcessing || report.status === 'reviewed'}
                              onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                              className="py-1.5 px-2 bg-blue-50 border border-blue-400 text-blue-800 text-[11px] font-bold rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              సమీక్ష (Review)
                            </button>
                            <button
                              disabled={isProcessing || report.status === 'dismissed'}
                              onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                              className="py-1.5 px-2 bg-neutral-100 border border-neutral-300 text-neutral-700 text-[11px] font-bold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                            >
                              తిరస్కరించు
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Recent Pending News Section matching Screen 6 */
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-neutral-900 telugu-heading">
                      {getSubmissionsHeading()}
                    </h2>
                    <button
                      onClick={loadLiveSubmissions}
                      disabled={isLoading}
                      aria-label="తాజా సమాచారం రీఫ్రెష్ చేయండి (Refresh submissions)"
                      title="తాజా సమాచారం రీఫ్రెష్ చేయండి"
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    పౌరులు మరియు రిపోర్టర్ల నుండి వచ్చిన తాజా వార్తల ఆమోదం
                  </p>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      id="admin-search-input"
                      aria-label="శీర్షిక లేదా ప్రాంతం వెతకండి (Search headline or location)"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="శీర్షిక లేదా ప్రాంతం వెతకండి..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                    />
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2 pointer-events-none" aria-hidden="true" />
                  </div>

                  <select
                    id="admin-status-filter-select"
                    aria-label="వార్తా స్థితి ఫిల్టర్ (Status filter)"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <option value="all">అన్నీ (All)</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Submissions Load Error Banner */}
              {loadError && (
                <div
                  role="alert"
                  className="p-4 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" aria-hidden="true" />
                    <span className="break-words font-medium">
                      వార్తల సమర్పణల లోడింగ్ విఫలమైంది: {loadError}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={loadLiveSubmissions}
                    aria-label="వార్తల సమర్పణలను మళ్ళీ లోడ్ చేయండి (Retry loading submissions)"
                    className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[11px] font-bold hover:bg-red-700 transition-colors cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                  >
                    మళ్ళీ ప్రయత్నించండి (Retry)
                  </button>
                </div>
              )}

              {/* Table matching Screen 6 */}
              <div className="overflow-x-auto">
                <table aria-label="వార్తా సమర్పణల జాబితా (News submissions table)" className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-bold">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">శీర్షిక (Headline & Thumbnail)</th>
                      <th className="py-3 px-4">ప్రాంతం (Location)</th>
                      <th className="py-3 px-4">రిపోర్టర్ (Reporter)</th>
                      <th className="py-3 px-4">సమయం (Time)</th>
                      <th className="py-3 px-4 text-center">చర్యలు (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400">
                          వార్తలు ఏవీ కనుగొనబడలేదు.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub, index) => (
                        <tr
                          key={sub.id}
                          className="hover:bg-neutral-50/60 transition-colors group"
                        >
                          {/* Index */}
                          <td className="py-3 px-4 font-mono font-bold text-neutral-400">
                            {index + 1}
                          </td>

                          {/* Title with thumbnail & media links */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {sub.imageUrl && isSafeExternalMediaUrl(sub.imageUrl) ? (
                                <a
                                  href={sub.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`${sub.title} పూర్తి చిత్రాన్ని చూడండి (Open full image)`}
                                  title="పూర్తి చిత్రాన్ని చూడండి / Open full image"
                                  className="block relative group/thumb flex-shrink-0 focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg"
                                >
                                  <img
                                    src={sub.imageUrl}
                                    alt={sub.title}
                                    className="w-12 h-10 object-cover rounded-lg shadow-2xs group-hover/thumb:ring-2 ring-red-400 transition-all"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80';
                                    }}
                                  />
                                </a>
                              ) : (
                                <div className="w-12 h-10 rounded-lg bg-red-100 text-[#E41E26] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  RB
                                </div>
                              )}
                              <div className="max-w-xs">
                                <h3 className="font-bold text-neutral-900 line-clamp-1 telugu-heading text-xs">
                                  {sub.title}
                                </h3>
                                <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                                  {sub.details}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {isSafeExternalMediaUrl(sub.audioUrl) ? (
                                    <a
                                      href={sub.audioUrl!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`${sub.title} వాయిస్ రికార్డింగ్ వినండి (Listen to voice note)`}
                                      className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                                    >
                                      🎙️ Voice Note
                                    </a>
                                  ) : (sub.hasVoice || sub.audioUrl) ? (
                                    <span
                                      title="వాయిస్ నోట్ URL అందుబాటులో లేదు లేదా సురక్షితం కాదు"
                                      className="inline-flex items-center gap-1 text-[9px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded opacity-75 cursor-not-allowed"
                                    >
                                      🎙️ Voice Note
                                    </span>
                                  ) : null}
                                  {isSafeExternalMediaUrl(sub.videoUrl) ? (
                                    <a
                                      href={sub.videoUrl!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`${sub.title} వీడియో చూడండి (Watch video)`}
                                      className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-purple-400"
                                    >
                                      📹 Video
                                    </a>
                                  ) : (sub.hasVideo || sub.videoUrl) ? (
                                    <span
                                      title="వీడియో URL అందుబాటులో లేదు లేదా సురక్షితం కాదు"
                                      className="inline-flex items-center gap-1 text-[9px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded opacity-75 cursor-not-allowed"
                                    >
                                      📹 Video
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-4 font-semibold text-neutral-700">
                            {sub.location}
                          </td>

                          {/* Reporter */}
                          <td className="py-3 px-4 text-neutral-700 font-medium">
                            {sub.reporterName}
                          </td>

                          {/* Time */}
                          <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                            {sub.timeAgo}
                          </td>

                          {/* Actions (Approve / Reject buttons matching Screen 6) */}
                          <td className="py-3 px-4 text-center">
                            {sub.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  disabled={processingId === sub.id}
                                  onClick={() => handleApprove(sub.id)}
                                  aria-label={`${sub.title} వార్తను ఆమోదించండి (Approve news)`}
                                  className={`px-3 py-1 bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                                    processingId === sub.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {processingId === sub.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <span>Approve</span>
                                  )}
                                </button>
                                <button
                                  disabled={processingId === sub.id}
                                  onClick={(e) => handleOpenRejectModal(sub, e)}
                                  aria-label={`${sub.title} వార్తను తిరస్కరించండి (Reject news)`}
                                  className={`px-3 py-1 bg-white border border-red-400 text-red-600 hover:bg-red-600 hover:text-white rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red-400 ${
                                    processingId === sub.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {processingId === sub.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <span>Reject</span>
                                  )}
                                </button>
                              </div>
                            ) : sub.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                <Check className="w-3 h-3" />
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                <X className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Accessible Delete Confirmation Modal */}
        {deletingCommentTarget && (
          <div
            role="presentation"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => {
              if (commentProcessingId !== deletingCommentTarget.id) {
                setDeletingCommentTarget(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-comment-dialog-title"
              aria-describedby="delete-comment-dialog-desc"
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && commentProcessingId !== deletingCommentTarget.id) {
                  setDeletingCommentTarget(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150 focus:outline-none"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-6 h-6" aria-hidden="true" />
              </div>

              <h3
                id="delete-comment-dialog-title"
                className="text-base font-black text-center text-neutral-900 telugu-heading"
              >
                కామెంట్ తొలగింపు నిర్ధారణ (Confirm Delete)
              </h3>

              <p
                id="delete-comment-dialog-desc"
                className="text-xs text-center text-neutral-600 mt-1.5"
              >
                ఈ కామెంట్‌ను శాశ్వతంగా తొలగించాలనుకుంటున్నారా? ఈ చర్యను వెనక్కి తీసుకోలేరు.
              </p>

              {/* Comment snippet */}
              <div className="my-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700 mb-1">
                  <span>{deletingCommentTarget.userName}</span>
                  {deletingCommentTarget.userLocation && (
                    <span className="text-neutral-400 font-normal">📍 {deletingCommentTarget.userLocation}</span>
                  )}
                </div>
                <p className="text-xs text-neutral-900 font-medium italic break-words line-clamp-3">
                  "{deletingCommentTarget.comment}"
                </p>
                {deletingCommentTarget.newsTitle && (
                  <p className="text-[10px] text-neutral-500 mt-1 line-clamp-1">
                    వార్త: {deletingCommentTarget.newsTitle}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  type="button"
                  autoFocus
                  disabled={commentProcessingId === deletingCommentTarget.id}
                  onClick={() => setDeletingCommentTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400"
                >
                  రద్దు చేయి (Cancel)
                </button>
                <button
                  type="button"
                  aria-label="కామెంట్ తొలగించు నిర్ధారణ (Confirm comment deletion)"
                  disabled={commentProcessingId === deletingCommentTarget.id}
                  onClick={handleConfirmDeleteComment}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                >
                  {commentProcessingId === deletingCommentTarget.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>తొలగిస్తోంది...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>శాశ్వతంగా తొలగించు (Delete)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accessible Role Change Confirmation Modal (Requirement 6) */}
        {roleChangeTarget && (
          <div
            role="presentation"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => {
              if (userProcessingId !== roleChangeTarget.user.id) {
                setRoleChangeTarget(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="role-change-dialog-title"
              aria-describedby="role-change-dialog-desc"
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && userProcessingId !== roleChangeTarget.user.id) {
                  setRoleChangeTarget(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150 focus:outline-none"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>

              <h3
                id="role-change-dialog-title"
                className="text-base font-black text-center text-neutral-900 telugu-heading"
              >
                రోల్ మార్పు నిర్ధారణ (Confirm Role Change)
              </h3>

              <p
                id="role-change-dialog-desc"
                className="text-xs text-center text-neutral-600 mt-1.5"
              >
                మీరు ఈ వినియోగదారుడి అధికారాలను/రోల్‌ను మార్చాలనుకుంటున్నారా? ఈ మార్పు వారి అనుమతులపై వెంటనే ప్రభావం చూపుతుంది. (This role change directly affects the user&apos;s permissions and dashboard access.)
              </p>

              {/* User details snippet */}
              <div className="my-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">వినియోగదారుడు:</span>
                  <span className="font-bold text-neutral-900">{roleChangeTarget.user.full_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">యూజర్ ఐడీ:</span>
                  <span className="font-mono text-[11px] text-neutral-600">
                    {roleChangeTarget.user.id.slice(0, 8)}...{roleChangeTarget.user.id.slice(-4)}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">ప్రస్తుత రోల్</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        ROLE_CONFIG[roleChangeTarget.user.role].bg
                      } ${ROLE_CONFIG[roleChangeTarget.user.role].text} ${
                        ROLE_CONFIG[roleChangeTarget.user.role].border
                      }`}
                    >
                      {ROLE_CONFIG[roleChangeTarget.user.role].english}
                    </span>
                  </div>

                  <span className="text-neutral-400 font-black text-sm">➔</span>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block mb-0.5">కొత్త రోల్</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        ROLE_CONFIG[roleChangeTarget.newRole].bg
                      } ${ROLE_CONFIG[roleChangeTarget.newRole].text} ${
                        ROLE_CONFIG[roleChangeTarget.newRole].border
                      }`}
                    >
                      {ROLE_CONFIG[roleChangeTarget.newRole].english}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  type="button"
                  autoFocus
                  disabled={userProcessingId === roleChangeTarget.user.id}
                  onClick={() => setRoleChangeTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 cursor-pointer"
                >
                  రద్దు చేయి (Cancel)
                </button>
                <button
                  type="button"
                  aria-label="రోల్ మార్పు నిర్ధారించండి (Confirm role change)"
                  disabled={userProcessingId === roleChangeTarget.user.id}
                  onClick={handleConfirmRoleChange}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 cursor-pointer"
                >
                  {userProcessingId === roleChangeTarget.user.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>మార్చుతోంది...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>రోల్ మార్చు (Confirm Role Change)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Dialog Modal (#8F) */}
        {rejectModalSubmission && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="reject-dialog-title" className="text-base font-black text-neutral-900 telugu-heading">
                      వార్తను తిరస్కరించండి / Reject Submission
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      తిరస్కరణ కారణాన్ని తప్పనిసరిగా ఎంచుకోండి లేదా రాయండి
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseRejectModal}
                  aria-label="మూసివేయండి (Close)"
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Submission summary snippet */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
                <span className="font-bold text-neutral-900 line-clamp-2">
                  {rejectModalSubmission.title}
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  రిపోర్టర్: <span className="font-medium text-neutral-700">{rejectModalSubmission.reporterName}</span> • ప్రాంతం: <span className="font-medium text-neutral-700">{rejectModalSubmission.locationText || 'స్థానిక'}</span>
                </span>
              </div>

              {/* Standard preset reasons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 telugu-heading">
                  ప్రామాణిక కారణాలు (Standard Reasons):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STANDARD_REJECTION_REASONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectReasonPreset(preset.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        selectedReasonId === preset.id
                          ? 'border-red-500 bg-red-50/70 text-red-900 ring-2 ring-red-300 font-bold'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="leading-tight">{preset.labelTe}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{preset.labelEn}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom reason textarea with character counter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="reject-reason-textarea" className="font-bold text-neutral-700 telugu-heading">
                    వివరణాత్మక కారణం (Reason for Reporter) *
                  </label>
                  <span className={`text-[10px] font-mono ${customReasonText.length > 500 ? 'text-red-600 font-bold' : 'text-neutral-500'}`}>
                    {customReasonText.length}/500
                  </span>
                </div>
                <textarea
                  id="reject-reason-textarea"
                  ref={rejectTextareaRef}
                  value={customReasonText}
                  onChange={(e) => {
                    setCustomReasonText(e.target.value);
                    setRejectDialogError(null);
                  }}
                  rows={3}
                  maxLength={500}
                  placeholder="రిపోర్టర్‌కు స్పష్టమైన కారణాన్ని నమోదు చేయండి..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 leading-relaxed resize-none"
                />
              </div>

              {rejectDialogError && (
                <div role="alert" className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{rejectDialogError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={processingId === rejectModalSubmission.id}
                  onClick={handleCloseRejectModal}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  రద్దు చేయి (Cancel)
                </button>
                <button
                  type="button"
                  disabled={
                    processingId === rejectModalSubmission.id ||
                    !customReasonText.trim() ||
                    customReasonText.trim().length > 500
                  }
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {processingId === rejectModalSubmission.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>తిరస్కరిస్తోంది...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>తిరస్కరించు (Confirm Rejection)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
