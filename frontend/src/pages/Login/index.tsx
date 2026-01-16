/**
 * Login Page
 */

import { useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { Link } from 'wouter-preact';
import { authStore, isAuthenticated, hasCharacter } from '@/stores/authStore';
import { authService } from '@/api/authService';
import styles from './Login.module.css';

export function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated.value) {
    if (hasCharacter.value) {
      setLocation('/');
    } else {
      setLocation('/select-character');
    }
    return null;
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLocalError(null);

    // Basic validation
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }

    try {
      await authService.login({ email, password });

      // Navigate based on character status
      if (authStore.characters.value.length > 0) {
        if (authStore.characters.value.length === 1) {
          // Auto-select if only one character
          await authService.selectCharacter(authStore.characters.value[0].id);
          setLocation('/');
        } else {
          setLocation('/select-character');
        }
      } else {
        // No characters - go to create
        setLocation('/select-character');
      }
    } catch (error) {
      // Error is already set in authStore by the service
      setLocalError(
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      );
    }
  };

  const error = localError || authStore.authError.value;
  const isLoading = authStore.isLoading.value;

  return (
    <div class={styles.page}>
      <div class={styles.container}>
        <header class={styles.header}>
          <div class={styles.logo}>◈</div>
          <h1 class={styles.title}>Surge Protocol</h1>
          <p class={styles.subtitle}>Neural Link Authentication</p>
        </header>

        <form class={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div class={styles.error}>
              <span class={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div class={styles.field}>
            <label class={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              class={`${styles.input} ${error ? styles.error : ''}`}
              placeholder="runner@surge.net"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div class={styles.field}>
            <label class={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              class={`${styles.input} ${error ? styles.error : ''}`}
              placeholder="••••••••"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            class={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span class={styles.loading}>
                <span class={styles.spinner} />
                Authenticating...
              </span>
            ) : (
              'Connect'
            )}
          </button>
        </form>

        <footer class={styles.footer}>
          <p class={styles.footerText}>
            New to the network?{' '}
            <Link href="/register" class={styles.link}>
              Register
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Login;
