/**
 * @file useUser.ts
 * @description Custom React hook for user profile, preferences, and saved articles.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { fetchUserBookmarks, addBookmark, removeBookmark } from '../services/userService';

export function useUser() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [savedNewsIds, setSavedNewsIds] = useState<string[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState<boolean>(false);

  const loadBookmarks = useCallback(async () => {
    if (user?.id) {
      setIsLoadingBookmarks(true);
      try {
        const { data, error } = await fetchUserBookmarks(user.id);
        if (!error) {
          setSavedNewsIds(data);
        }
      } catch (err) {
        console.warn('Error loading user bookmarks:', err);
      } finally {
        setIsLoadingBookmarks(false);
      }
    } else {
      setSavedNewsIds([]);
      setIsLoadingBookmarks(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const toggleBookmark = useCallback(
    async (newsId: string): Promise<{ success: boolean; isSaved: boolean }> => {
      if (!isAuthenticated || !user?.id) {
        openAuthModal();
        return { success: false, isSaved: false };
      }

      const wasSaved = savedNewsIds.includes(newsId);

      // Optimistic update
      setSavedNewsIds((prev) =>
        wasSaved ? prev.filter((id) => id !== newsId) : [...prev, newsId]
      );

      try {
        const { error } = wasSaved
          ? await removeBookmark(user.id, newsId)
          : await addBookmark(user.id, newsId);

        if (error) {
          // Rollback on error
          setSavedNewsIds((prev) =>
            wasSaved ? [...prev, newsId] : prev.filter((id) => id !== newsId)
          );
          return { success: false, isSaved: wasSaved };
        }

        return { success: true, isSaved: !wasSaved };
      } catch (err) {
        // Rollback on exception
        setSavedNewsIds((prev) =>
          wasSaved ? [...prev, newsId] : prev.filter((id) => id !== newsId)
        );
        return { success: false, isSaved: wasSaved };
      }
    },
    [isAuthenticated, user?.id, savedNewsIds, openAuthModal]
  );

  const isBookmarked = useCallback(
    (newsId: string) => savedNewsIds.includes(newsId),
    [savedNewsIds]
  );

  return {
    savedNewsIds,
    setSavedNewsIds,
    isLoadingBookmarks,
    toggleBookmark,
    isBookmarked,
    refreshBookmarks: loadBookmarks,
  };
}
