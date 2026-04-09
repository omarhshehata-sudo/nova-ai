import React, { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/ResetPassword.css';

interface ResetPasswordProps {
  onComplete: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = useCallback((): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must include a number.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => onComplete(), 2000);
    }
  }, [password, validate, onComplete]);

  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];

  if (success) {
    return (
      <div className="reset-pw-overlay">
        <div className="reset-pw-card">
          <div className="reset-pw-success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="reset-pw-title">Password Updated</h2>
          <p className="reset-pw-desc">Your password has been changed successfully. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-pw-overlay">
      <div className="reset-pw-card">
        <div className="reset-pw-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="reset-pw-title">Set New Password</h2>
        <p className="reset-pw-desc">Choose a strong password for your Nova AI account.</p>

        <form className="reset-pw-form" onSubmit={handleSubmit}>
          <div className="reset-pw-field">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter new password"
              autoFocus
              autoComplete="new-password"
            />
          </div>

          <div className="reset-pw-checks">
            {checks.map(c => (
              <span key={c.label} className={`reset-pw-check ${c.pass ? 'reset-pw-check--pass' : ''}`}>
                {c.pass ? '✓' : '○'} {c.label}
              </span>
            ))}
          </div>

          <div className="reset-pw-field">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          {error && <div className="reset-pw-error">{error}</div>}

          <button className="reset-pw-submit" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <button className="reset-pw-skip" type="button" onClick={onComplete}>
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
};
