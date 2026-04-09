import React, { useState } from 'react';
import '../styles/AuthModal.css';
import { IconAppleWhite } from './Icons';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

type AuthStep = 'choice' | 'login' | 'signup-method' | 'signup-email' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [step, setStep] = useState<AuthStep>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setStep('choice');
    }
  }, [isOpen]);

  // Handle OAuth callback on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      try {
        const authData = JSON.parse(atob(token));
        
        // Store auth data
        localStorage.setItem('githubAuth', JSON.stringify(authData));
        
        // Clean URL first
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Check if user already has a profile
        const existingProfile = localStorage.getItem('userProfile');
        if (existingProfile) {
          // Already set up - just log them in
          setSuccessMessage(`Welcome back!`);
          setTimeout(() => {
            onClose();
            onAuthSuccess?.();
          }, 1000);
        } else {
          setSuccessMessage(`Logged in! Setting up your profile...`);
          setTimeout(() => {
            onClose();
            onAuthSuccess?.();
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to parse auth token:', err);
        setError('Authentication failed');
      }
    }
  }, []);

  if (!isOpen) return null;

  // Validation helpers
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    onClose();
    onAuthSuccess?.();
    setEmail('');
    setPassword('');
    setStep('choice');
  };

  // Signup with email handler
  const handleSignupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccessMessage('Check your email to confirm your account!');
    setTimeout(() => {
      setStep('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }, 3000);
  };

  // Password reset handler
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccessMessage('Password reset link sent to ' + email);
    setTimeout(() => {
      setStep('login');
      setEmail('');
    }, 2000);
  };

  // OAuth handlers
  const handleOAuth = async (provider: string) => {
    if (provider.toLowerCase() === 'apple') {
      setError('');
      setSuccessMessage('Apple sign-in is not available at this time. Please use another method.');
      return;
    }

    if (provider.toLowerCase() === 'google') {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      }
      return;
    }

    if (provider.toLowerCase() === 'github') {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
      
      console.log('OAuth Config:', { clientId, redirectUri });
      
      if (!clientId) {
        setError('GitHub Client ID not configured');
        return;
      }

      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('oauth_state', state);

      // GitHub OAuth authorization URL
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
      
      console.log('Redirecting to:', githubAuthUrl);
      // Redirect in same tab
      window.location.href = githubAuthUrl;
      return;
    }

    setError(`${provider} login is not supported yet`);
  };

  const handleSignupMethodSelect = (method: string) => {
    if (method === 'email') {
      setStep('signup-email');
    } else {
      handleOAuth(method);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Gradient accent line */}
        <div className="auth-modal-accent" />
        
        {/* Close button */}
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>

        {step === 'choice' && (
          <div className="auth-step">
            {/* Nova branding */}
            <div className="auth-brand-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="authNovaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d9ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="10.5" stroke="url(#authNovaGrad)" strokeWidth="1.2" opacity="0.8" />
                <path d="M 7 18 L 7 6 M 7 6 L 17 18 M 17 18 L 17 6" stroke="url(#authNovaGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2>Welcome to Nova AI</h2>
            <p>Choose how you'd like to continue</p>
            <div className="auth-buttons">
              <button
                className="auth-button auth-button-primary"
                onClick={() => setStep('login')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Sign In</span>
              </button>
              <button
                className="auth-button auth-button-secondary"
                onClick={() => setStep('signup-method')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Create Account</span>
              </button>
            </div>
          </div>
        )}

        {step === 'login' && (
          <div className="auth-step">
            <button className="auth-back-button" onClick={() => setStep('choice')}>
              ← Back
            </button>
            <h2>Sign In</h2>
            {error && <div className="auth-error">{error}</div>}
            {successMessage && <div className="auth-success">{successMessage}</div>}
            <form onSubmit={handleLogin} className="auth-form">
              <input
                type="email"
                placeholder="Email address"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="auth-button auth-button-primary auth-button-full"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <button
                type="button"
                className="auth-forgot-password"
                onClick={() => setStep('forgot-password')}
                disabled={loading}
              >
                Forgot password?
              </button>
            </form>
            <div className="auth-divider">or</div>
            <div className="auth-oauth-buttons">
              <button 
                className="auth-oauth-btn" 
                title="Sign in with Google"
                onClick={() => handleOAuth('Google')}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button 
                className="auth-oauth-btn" 
                title="Sign in with Apple"
                onClick={() => handleOAuth('Apple')}
                disabled={loading}
              >
                <IconAppleWhite size={20} />
              </button>
              <button 
                className="auth-oauth-btn" 
                title="Sign in with GitHub"
                onClick={() => handleOAuth('GitHub')}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {step === 'signup-method' && (
          <div className="auth-step">
            <button className="auth-back-button" onClick={() => setStep('choice')}>
              ← Back
            </button>
            <h2>Create Account</h2>
            <p>Choose your preferred sign-up method</p>
            <div className="signup-methods">
              <button
                className="signup-method-btn"
                onClick={() => handleOAuth('Google')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign up with Google</span>
              </button>
              <button
                className="signup-method-btn"
                onClick={() => handleSignupMethodSelect('apple')}
              >
                <IconAppleWhite size={24} />
                <span>Sign up with Apple</span>
              </button>
              <button
                className="signup-method-btn"
                onClick={() => handleOAuth('GitHub')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>Sign up with GitHub</span>
              </button>
              <button
                className="signup-method-btn signup-method-email"
                onClick={() => handleSignupMethodSelect('email')}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>Sign up with Email</span>
              </button>
            </div>
          </div>
        )}

        {step === 'signup-email' && (
          <div className="auth-step">
            <button className="auth-back-button" onClick={() => setStep('signup-method')}>
              ← Back
            </button>
            <h2>Create Account</h2>
            {error && <div className="auth-error">{error}</div>}
            {successMessage && <div className="auth-success">{successMessage}</div>}
            <form onSubmit={handleSignupEmail} className="auth-form">
              <input
                type="email"
                placeholder="Email address"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password (min 8 chars, uppercase, lowercase, number)"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="auth-button auth-button-primary auth-button-full"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        {step === 'forgot-password' && (
          <div className="auth-step">
            <button className="auth-back-button" onClick={() => setStep('login')}>
              ← Back
            </button>
            <h2>Reset Password</h2>
            {error && <div className="auth-error">{error}</div>}
            {successMessage && <div className="auth-success">{successMessage}</div>}
            <form onSubmit={handlePasswordReset} className="auth-form">
              <p className="auth-hint">Enter your email and we'll send you a link to reset your password.</p>
              <input
                type="email"
                placeholder="Email address"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="auth-button auth-button-primary auth-button-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
