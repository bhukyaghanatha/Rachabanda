/**
 * @file useAuth.ts
 * @description Typed React hook to consume the AuthContext.
 */

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

/**
 * Custom hook to access authentication state and methods.
 * Throws a clear developer error if called outside an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. Ensure your component tree is wrapped with <AuthProvider>.'
    );
  }
  return context;
}
