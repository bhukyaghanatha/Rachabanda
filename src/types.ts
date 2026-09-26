export interface NewsMediaItem {
  id: string;
  newsId: string;
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl: string;
  caption?: string | null;
  displayOrder: number;
  createdAt?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  shortSummary: string; // 60-word Way2News format
  content: string;
  location: string;
  category: string;
  categorySlug?: string;
  locationSlug?: string;
  imageUrl: string;
  timeAgo: string;
  publishedDate: string;
  reporterName: string;
  reporterId: string;
  audioDuration: string;
  likes: number;
  commentsCount: number;
  isBreaking?: boolean;
  isVideo?: boolean;
  videoDuration?: string;
  factChecked?: boolean;
  audioNarratedText?: string;
  audioUrl?: string | null;
  videoUrl?: string | null;
  media?: NewsMediaItem[];
}

export interface CategoryInfo {
  id: string;
  uuid?: string;
  name: string;
  englishName: string;
  color: string;
  iconName: string;
}

export interface NewsSubmission {
  id: string;
  userId?: string | null;
  reporterName: string;
  reporterPhone?: string | null;
  title: string;
  details: string;
  locationId?: string | null;
  locationText?: string;
  categoryId?: string | null;
  categoryText?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  publishedNewsId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // UI helper fields
  location: string;
  category: string;
  timeAgo: string;
  timestamp?: number;
  hasVoice?: boolean;
  hasVideo?: boolean;
}

export interface CreateSubmissionInput {
  title: string;
  details: string;
  locationId?: string | null;
  locationText: string;
  categoryId?: string | null;
  categoryText: string;
  reporterName: string;
  reporterPhone?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
}

export interface NewsComment {
  id: string;
  newsId: string;
  newsTitle?: string;
  userId?: string | null;
  userName: string;
  userLocation: string;
  comment: string;
  timeAgo: string;
  likes: number;
  isApproved?: boolean;
  createdAt?: string;
}

export type AppViewMode = 'mobile' | 'admin';
export type MobileTab = 'home' | 'video' | 'submit' | 'saved' | 'profile';
export type TopCategoryTab = 'హోం' | 'వీడియో' | 'VOICE' | 'ఫోటోలు' | 'ఫాలో';

// Authentication & User Profile Types
export type UserRole = 'reader' | 'citizen_reporter' | 'reporter' | 'editor' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  district?: string | null;
  mandal?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserProfileInput {
  full_name?: string;
  bio?: string | null;
  district?: string | null;
  mandal?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface AdminUserFilters {
  role?: UserRole | 'all';
  search?: string;
  limit?: number;
}

export interface AdminUserProfile extends UserProfile {}

export interface AdminSetUserRoleResult {
  id: string;
  full_name: string;
  role: UserRole;
  updated_at: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isReporter: boolean;
  isAdmin: boolean;
  isEditor: boolean;
}

export interface BookmarkItem {
  id: string;
  userId: string;
  newsId: string;
  createdAt: string;
}

export type ReactionType = 'like' | 'love' | 'support' | 'angry';

export interface ReactionItem {
  id: string;
  newsId: string;
  userId: string;
  reaction: ReactionType;
  createdAt?: string;
}

export interface ReactionCounts {
  like: number;
  love: number;
  support: number;
  angry: number;
  total: number;
}

export type FollowType = 'category' | 'location';

export interface FollowItem {
  id: string;
  userId: string;
  followType: FollowType;
  targetId: string;
  createdAt?: string;
}

export type NotificationType =
  | 'breaking'
  | 'news'
  | 'submission_approved'
  | 'submission_rejected'
  | 'comment'
  | 'reaction'
  | 'system';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// CONTENT REPORTING TYPES (#8D-1)
// ============================================================================

export type ContentReportType = 'news' | 'comment';

export type ContentReportReason =
  | 'misinformation'
  | 'hate_speech'
  | 'harassment'
  | 'spam'
  | 'inappropriate'
  | 'copyright'
  | 'other';

export type ContentReportStatus =
  | 'pending'
  | 'reviewed'
  | 'dismissed'
  | 'actioned';

export interface ContentReport {
  id: string;
  reporterId: string | null;
  contentType: ContentReportType;
  contentId: string;
  reason: ContentReportReason;
  details?: string | null;
  status: ContentReportStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentReportInput {
  contentType: ContentReportType;
  contentId: string;
  reason: ContentReportReason;
  details?: string | null;
}

export interface ModerationContentReport extends ContentReport {
  reporterName?: string;
  targetTitle?: string;
  targetSnippet?: string;
  targetAuthorName?: string;
}


