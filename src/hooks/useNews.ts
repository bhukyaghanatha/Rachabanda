/**
 * @file useNews.ts
 * @description Custom React hook for querying and managing published news from Supabase.
 */

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { NewsItem, CategoryInfo } from '../types';
import {
  fetchPublishedNews,
  fetchCategories,
  fetchLocations,
  LocationInfo,
} from '../services/newsService';
import { INITIAL_NEWS, CATEGORIES as FALLBACK_CATEGORIES, DISTRICTS as FALLBACK_DISTRICTS } from '../data/mockNews';

export interface UseNewsReturn {
  newsList: NewsItem[];
  categories: CategoryInfo[];
  districts: string[];
  locations: LocationInfo[];
  isLoading: boolean;
  error: Error | null;
  isDatabaseEmpty: boolean;
  refreshNews: () => Promise<void>;
  setNewsList: Dispatch<SetStateAction<NewsItem[]>>;
}

export function useNews(): UseNewsReturn {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>(FALLBACK_CATEGORIES);
  const [districts, setDistricts] = useState<string[]>(FALLBACK_DISTRICTS);
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDatabaseEmpty, setIsDatabaseEmpty] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch news, categories, and locations concurrently
      const [newsResult, catResult, locResult] = await Promise.all([
        fetchPublishedNews(),
        fetchCategories(),
        fetchLocations(),
      ]);

      // 1. Process Categories
      if (!catResult.error && catResult.data.length > 0) {
        setCategories(catResult.data);
      } else if (catResult.error) {
        console.warn('Could not fetch categories from Supabase, using fallback:', catResult.error.message);
      }

      // 2. Process Locations & Districts
      if (!locResult.error && locResult.data.length > 0) {
        setLocations(locResult.data);
        const districtNames = locResult.data
          .filter((loc) => loc.type === 'district' || loc.type === 'mandal')
          .map((loc) => loc.name);

        const uniqueDistricts = Array.from(new Set(districtNames));
        if (uniqueDistricts.length > 0) {
          setDistricts(['అన్ని ప్రాంతాలు', ...uniqueDistricts]);
        }
      } else if (locResult.error) {
        console.warn('Could not fetch locations from Supabase, using fallback:', locResult.error.message);
      }

      // 3. Process News Articles
      if (newsResult.error) {
        setError(newsResult.error);
        console.error('Failed to load published news from Supabase:', newsResult.error.message);
        // Fallback to INITIAL_NEWS during error
        setNewsList(INITIAL_NEWS);
        setIsDatabaseEmpty(false);
      } else if (newsResult.data.length === 0) {
        setIsDatabaseEmpty(true);
        console.info(
          'ℹ️ Supabase returned 0 published news articles. Displaying mock news fallback until database is seeded.'
        );
        // Fallback to INITIAL_NEWS when database is empty
        setNewsList(INITIAL_NEWS);
      } else {
        setIsDatabaseEmpty(false);
        setNewsList(newsResult.data);
      }
    } catch (err: any) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj);
      console.error('Unexpected error loading news:', errObj.message);
      setNewsList(INITIAL_NEWS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    newsList,
    categories,
    districts,
    locations,
    isLoading,
    error,
    isDatabaseEmpty,
    refreshNews: loadData,
    setNewsList,
  };
}
