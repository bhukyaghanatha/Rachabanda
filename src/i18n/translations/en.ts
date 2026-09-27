/**
 * @file en.ts
 * @description English UI translation dictionary for Rachabanda.
 */

export const en: Record<string, string> = {
  // App General
  'app.name': 'Rachabanda',
  'app.tagline': 'Local News, Live Breaking Updates & Citizen Journalism',
  'app.motto': 'Voice of the People',

  // Language Selection
  'language.selectTitle': 'Choose your app language',
  'language.selectSubtitle': 'Select your preferred language for the application interface',
  'language.continue': 'Continue',
  'language.appLanguage': 'App Language',
  'language.changeLanguage': 'Change Language',
  'language.newsLanguage': 'News Language',

  // Common Actions
  'common.login': 'Log In',
  'common.register': 'Create Account',
  'common.continue': 'Continue',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.back': 'Back',
  'common.submit': 'Submit',
  'common.loading': 'Loading...',
  'common.noData': 'No data available',
  'common.error': 'An error occurred',
  'common.success': 'Successful',
  'common.search': 'Search',
  'common.share': 'Share',
  'common.close': 'Close',
  'common.refresh': 'Refresh',
  'common.all': 'All',

  // Navigation Tabs
  'nav.home': 'Home',
  'nav.video': 'Video',
  'nav.voice': 'VOICE',
  'nav.submit': 'Submit News',
  'nav.saved': 'Saved',
  'nav.profile': 'Profile',
  'nav.dashboard': 'Dashboard',
  'nav.admin': 'Admin',
  'nav.photos': 'Photos',
  'nav.follow': 'Follow',
  'nav.flipReader': 'Flip Reader',

  // News Feed & Filters
  'news.allNews': 'All News',
  'news.breakingNews': 'Breaking News',
  'news.topStories': 'Top Stories',
  'news.readMore': 'Read Full Story',
  'news.filterByLanguage': 'Filter by News Language',
  'news.filterByCategory': 'Filter by Category',
  'news.filterByLocation': 'Filter by Location',
  'news.allLanguages': 'All Languages',
  'news.telugu': 'తెలుగు (Telugu)',
  'news.english': 'English',
  'news.hindi': 'हिंदी (Hindi)',
  'news.views': 'views',
  'news.likes': 'likes',
  'news.comments': 'comments',

  // Dashboard Overview
  'dashboard.title': 'Reporter Dashboard',
  'dashboard.subtitle': 'Citizen Journalism & Account Management Hub',
  'dashboard.welcome': 'Welcome',
  'dashboard.guestUser': 'Guest User',
  'dashboard.guestNotice': 'Log in to submit stories, track submissions, and manage your account.',
  'dashboard.myProfile': 'My Profile',
  'dashboard.myProfileDesc': 'Personal details, language preference, and location settings',
  'dashboard.mySubmissions': 'My Submissions',
  'dashboard.mySubmissionsDesc': 'Review submitted news stories and their editorial status',
  'dashboard.myReports': 'My Reports',
  'dashboard.myReportsDesc': 'Track inappropriate content reports you submitted',
  'dashboard.guidelines': 'Reporter Guidelines',
  'dashboard.guidelinesDesc': 'Editorial standards, ethics, and fact-checking principles',
  'dashboard.help': 'Help & Support',
  'dashboard.helpDesc': 'Frequently asked questions and technical assistance',
  'dashboard.adminDesk': 'Admin Dashboard',
  'dashboard.adminDeskDesc': 'Review pending news and platform moderation desk',
  'dashboard.logout': 'Sign Out',
  'dashboard.deleteAccount': 'Delete Account',
  'dashboard.backToDashboard': 'Back to Dashboard',

  // Profile Details
  'profile.title': 'Profile Details',
  'profile.editProfile': 'Edit Profile',
  'profile.fullName': 'Full Name',
  'profile.email': 'Email Address',
  'profile.phone': 'Phone Number',
  'profile.role': 'Role / Status',
  'profile.district': 'District',
  'profile.mandal': 'Mandal',
  'profile.bio': 'Bio / About',
  'profile.selectDistrict': 'Select District',
  'profile.selectMandal': 'Select Mandal',
  'profile.notSet': 'Not provided',
  'profile.saveChanges': 'Save Changes',
  'profile.saving': 'Saving...',
  'profile.savedSuccessfully': 'Profile updated successfully!',

  // Submissions
  'submissions.title': 'My Submissions',
  'submissions.subtitle': 'Local news stories you submitted to Rachabanda and their review status',
  'submissions.newSubmission': 'Submit New Story',
  'submissions.all': 'All',
  'submissions.pending': 'Pending',
  'submissions.approved': 'Approved',
  'submissions.rejected': 'Rejected',
  'submissions.empty': 'You have not submitted any news stories yet.',
  'submissions.emptyFilter': 'No news stories found in this section.',
  'submissions.withdraw': 'Withdraw Submission',
  'submissions.resubmit': 'Resubmit Story',
  'submissions.rejectionReason': 'Editorial Feedback',
  'submissions.viewArticle': 'View Published Story',

  // Reports
  'reports.title': 'My Content Reports',
  'reports.subtitle': 'Issues and inappropriate content you flagged for moderation review',
  'reports.empty': 'You have not submitted any content reports yet.',
  'reports.pending': 'Pending Review',
  'reports.reviewed': 'Reviewed',
  'reports.actioned': 'Action Taken',
  'reports.dismissed': 'Dismissed',
  'reports.contentType': 'Content Type',
  'reports.reason': 'Reason',
  'reports.date': 'Reported Date',

  // Guidelines
  'guidelines.title': 'Reporter Guidelines',
  'guidelines.subtitle': 'Rachabanda community journalism standards and editorial rules',

  // Help
  'help.title': 'Help & Support',
  'help.subtitle': 'Frequently asked questions, troubleshooting, and support',
  'help.faq': 'Frequently Asked Questions',
  'help.contactSupport': 'Contact Support Team',
  'help.inAppSupportNotice': 'You can submit feedback or queries directly in the app. Our editorial team reviews messages regularly.',

  // Auth Modal
  'auth.loginTitle': 'Rachabanda Sign In',
  'auth.signupTitle': 'Create an Account',
  'auth.loginSubtitle': 'Log in to your account',
  'auth.signupSubtitle': 'Join Rachabanda as a Citizen Reporter',
  'auth.email': 'Email Address',
  'auth.password': 'Password',
  'auth.googleContinue': 'Continue with Google',
  'auth.dontHaveAccount': "Don't have an account?",
  'auth.alreadyHaveAccount': 'Already have an account?',
  'auth.signIn': 'Sign In',
  'auth.signUp': 'Sign Up',

  // Account Deletion
  'account.deleteTitle': 'Permanently Delete Account',
  'account.deleteWarning': 'This action is irreversible. All your profile information, drafts, and preferences will be permanently wiped.',
  'account.confirmDelete': 'Delete My Account Permanently',
  'account.cancel': 'Cancel',
  'account.deleting': 'Deleting...',
};
