/**
 * @file authService.ts
 * @description Authentication service wrapping Supabase Auth for Rachabanda.
 * Supports Email + Password and Google OAuth.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Maps Supabase auth error codes/messages into user-friendly bilingual messages.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return '';
  const msg = (
    error.message ||
    error.msg ||
    error.error_description ||
    error.error_code ||
    String(error)
  ).toLowerCase();

  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_credentials') ||
    msg.includes('invalid password')
  ) {
    return 'చెల్లని ఇమెయిల్ లేదా పాస్‌వర్డ్. దయచేసి సరైన వివరాలు నమోదు చేయండి. / Invalid email or password. Please verify your credentials.';
  }
  if (
    msg.includes('user already registered') ||
    msg.includes('user_already_exists') ||
    msg.includes('already registered')
  ) {
    return 'ఈ ఇమెయిల్‌తో ఇప్పటికే ఖాతా ఉంది. దయచేసి లాగిన్ అవ్వండి. / An account already exists with this email. Please log in.';
  }
  if (
    msg.includes('email rate limit exceeded') ||
    msg.includes('over_email_send_rate_limit')
  ) {
    return 'ఇమెయిల్ పంపే పరిమితి దాటింది. Supabase డాష్‌బోర్డ్‌లో "Confirm email" ఆఫ్ చేయండి లేదా కాసేపటి తర్వాత ప్రయత్నించండి. / Email rate limit exceeded. Please disable "Confirm email" in Supabase Dashboard or try again later.';
  }
  if (msg.includes('email not confirmed')) {
    return 'మీ ఇమెయిల్ ఇంకా ధృవీకరించబడలేదు. దయచేసి మీ ఇన్‌బాక్స్ చూడండి. / Email address has not been confirmed yet. Please check your inbox.';
  }
  if (
    msg.includes('password should be at least') ||
    msg.includes('password must be at least') ||
    msg.includes('weak_password')
  ) {
    return 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి. / Password should be at least 6 characters.';
  }
  if (msg.includes('invalid email') || msg.includes('email_address_invalid')) {
    return 'చెల్లని ఇమెయిల్ చిరునామా. దయచేసి సరైన ఇమెయిల్ నమోదు చేయండి. / Invalid email address. Please enter a valid email.';
  }
  if (
    msg.includes('provider is not enabled') ||
    msg.includes('unsupported provider')
  ) {
    return 'Google లాగిన్ ఇంకా Supabase లో యాక్టివేట్ కాలేదు. / Google Sign-In is not yet configured in Supabase.';
  }

  return error.message || 'ఒక లోపం జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి. / An error occurred. Please try again.';
}

/**
 * Register a new user with email and password.
 * Passes full_name in user_metadata so the database trigger creates public.profiles.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      session: null,
      error: new Error(
        'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable real authentication.'
      ),
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      session: null,
      error: new Error(
        'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable real authentication.'
      ),
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Sign in with Google OAuth using Supabase.
 * Redirects user to Google consent screen and returns to current URL origin.
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      error: new Error(
        'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable Google OAuth.'
      ),
    };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { error: error || null };
  } catch (err: any) {
    return {
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOut(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error || null };
  } catch (err: any) {
    return {
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Retrieve the active Supabase auth session.
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (err) {
    console.warn('Failed to retrieve current session:', err);
    return null;
  }
}

/**
 * Retrieve the active authenticated user.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (err) {
    console.warn('Failed to retrieve current user:', err);
    return null;
  }
}

/**
 * Fetch the public profile record corresponding to the user ID.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching user profile:', error.message);
      return null;
    }

    return data as UserProfile | null;
  } catch (err) {
    console.warn('Unexpected error fetching user profile:', err);
    return null;
  }
}

/**
 * Listen to auth state transitions (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.).
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  if (!isSupabaseConfigured) {
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }

  return supabase.auth.onAuthStateChange(callback);
}
