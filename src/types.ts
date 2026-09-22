export interface NewsItem {
  id: string;
  title: string;
  shortSummary: string; // 60-word Way2News format
  content: string;
  location: string;
  category: string;
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
}

export interface CategoryInfo {
  id: string;
  name: string;
  englishName: string;
  color: string;
  iconName: string;
}

export interface NewsSubmission {
  id: string;
  title: string;
  details: string;
  location: string;
  category: string;
  reporterName: string;
  reporterPhone?: string;
  timeAgo: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  imageUrl?: string;
  hasVoice?: boolean;
  hasVideo?: boolean;
}

export interface NewsComment {
  id: string;
  newsId: string;
  userName: string;
  userLocation: string;
  comment: string;
  timeAgo: string;
  likes: number;
}

export type AppViewMode = 'mobile' | 'admin';
export type MobileTab = 'home' | 'video' | 'submit' | 'saved' | 'profile';
export type TopCategoryTab = 'హోం' | 'వీడియో' | 'VOICE' | 'ఫోటోలు' | 'ఫాలో';
