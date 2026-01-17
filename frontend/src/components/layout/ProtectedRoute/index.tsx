/**
 * ProtectedRoute - Wrapper for routes requiring authentication
 *
 * Redirects to login if not authenticated.
 * Redirects to character select if no active character.
 */

import { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import {
  isAuthenticated,
  hasCharacter,
  isLoading,
} from '@/stores/authStore';
import { Skeleton } from '@components/ui';

interface ProtectedRouteProps {
  children: ComponentChildren;
  requireCharacter?: boolean;
}

export function ProtectedRoute({
  children,
  requireCharacter = true,
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Wait for any loading to complete
    if (isLoading.value) return;

    // Check authentication
    if (!isAuthenticated.value) {
      setLocation('/login');
      return;
    }

    // Check character requirement
    if (requireCharacter && !hasCharacter.value) {
      setLocation('/select-character');
      return;
    }
  }, [setLocation, requireCharacter]);

  // Show loading state
  if (isLoading.value) {
    return (
      <div style={{ padding: 'var(--space-8)' }}>
        <Skeleton variant="card" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated.value) {
    return null;
  }

  // Don't render if character required but not selected
  if (requireCharacter && !hasCharacter.value) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
