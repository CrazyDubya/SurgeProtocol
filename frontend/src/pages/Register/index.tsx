/**
 * Register Page
 */

import { useState } from 'preact/hooks';
import { useLocation, Link } from 'wouter-preact';
import { authStore, isAuthenticated } from '@/stores/authStore';
import { authService } from '@/api/authService';
import styles from './Register.module.css';

// Password strength calculation
function getPasswordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak' };
  if (score <= 3) return { score, label: 'Medium' };
  return { score, label: 'Strong' };
}

export function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated.value) {
    setLocation('/select-character');
    return null;
  }

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await authService.register({ email, password });
      // After registration, go to character creation
      setLocation('/select-character');
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
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
          <h1 class={styles.title}>Join the Network</h1>
          <p class={styles.subtitle}>Create Your Neural Link</p>
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
              class={`${styles.input} ${error ? styles.inputError : ''}`}
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
              class={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="••••••••"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {password && (
              <>
                <div class={styles.passwordStrength}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      class={`${styles.strengthBar} ${
                        i <= passwordStrength.score
                          ? passwordStrength.score <= 2
                            ? styles.weak
                            : passwordStrength.score <= 3
                            ? styles.medium
                            : styles.strong
                          : ''
                      }`}
                    />
                  ))}
                </div>
                <span class={styles.strengthText}>
                  Strength: {passwordStrength.label}
                </span>
              </>
            )}
            <span class={styles.fieldHint}>
              Minimum 8 characters
            </span>
          </div>

          <div class={styles.field}>
            <label class={styles.label} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              class={`${styles.input} ${
                confirmPassword && password !== confirmPassword
                  ? styles.inputError
                  : ''
              }`}
              placeholder="••••••••"
              value={confirmPassword}
              onInput={(e) =>
                setConfirmPassword((e.target as HTMLInputElement).value)
              }
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <p class={styles.terms}>
            By registering, you agree to the Algorithm's terms of service
            and acknowledge the risks of neural link connectivity.
          </p>

          <button
            type="submit"
            class={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span class={styles.loading}>
                <span class={styles.spinner} />
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <footer class={styles.footer}>
          <p class={styles.footerText}>
            Already connected?{' '}
            <Link href="/login" class={styles.link}>
              Sign In
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Register;
