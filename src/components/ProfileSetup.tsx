import React, { useState, useRef } from 'react';
import type { UserProfile, GitHubAuth } from '../types';
import '../styles/ProfileSetup.css';

interface ProfileSetupProps {
  isOpen: boolean;
  githubAuth: GitHubAuth | null;
  onComplete: (profile: UserProfile) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  isOpen,
  githubAuth,
  onComplete,
}) => {
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState<string>(
    githubAuth?.user.avatar_url || ''
  );
  const [useGitHubPic, setUseGitHubPic] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !githubAuth) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProfilePic(result);
      setUseGitHubPic(false);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUseGitHubPic = () => {
    setProfilePic(githubAuth.user.avatar_url);
    setUseGitHubPic(true);
    setError('');
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (username.trim().length > 30) {
      setError('Username must be less than 30 characters');
      return;
    }

    if (!profilePic) {
      setError('Please select a profile picture');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const profile: UserProfile = {
        username: username.trim(),
        profilePic,
        githubId: githubAuth.user.id.toString(),
        githubUsername: githubAuth.user.login,
      };

      localStorage.setItem('userProfile', JSON.stringify(profile));
      setLoading(false);
      onComplete(profile);
    }, 500);
  };

  return (
    <div className="profile-setup-overlay">
      <div className="profile-setup-container">
        <h2>Complete Your Profile</h2>
        <p className="profile-setup-subtitle">
          Welcome, {githubAuth.user.login}! Let's set up your profile.
        </p>

        <form onSubmit={handleComplete} className="profile-setup-form">
          {/* Profile Picture Section */}
          <div className="profile-pic-section">
            <h3>Profile Picture</h3>
            <div className="profile-pic-preview">
              <img
                src={profilePic}
                alt="Profile preview"
                className="profile-pic-img"
              />
            </div>

            <div className="profile-pic-options">
              <button
                type="button"
                className={`pic-option ${useGitHubPic ? 'active' : ''}`}
                onClick={handleUseGitHubPic}
              >
                Use GitHub Avatar
              </button>
              <button
                type="button"
                className={`pic-option ${!useGitHubPic ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Custom Picture
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Username Section */}
          <div className="form-group">
            <label htmlFor="username">Choose Your Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter a username (2-30 characters)"
              maxLength={30}
              disabled={loading}
              className="username-input"
            />
            <small className="char-count">
              {username.length}/30 characters
            </small>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="complete-profile-btn"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};
