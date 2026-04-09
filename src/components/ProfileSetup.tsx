import React, { useState, useRef, useCallback } from 'react';
import type { UserProfile, GitHubAuth } from '../types';
import { supabase } from '../supabaseClient';
import '../styles/ProfileSetup.css';

interface ProfileSetupProps {
  isOpen: boolean;
  githubAuth: GitHubAuth | null;
  onComplete: (profile: UserProfile) => void;
}

const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d9ff"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="#1a1a2e"/><circle cx="50" cy="38" r="16" fill="url(#g)"/><path d="M20 85 Q20 62 50 62 Q80 62 80 85" fill="url(#g)"/></svg>`)}`;

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  isOpen,
  githubAuth,
  onComplete,
}) => {
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState<string>(DEFAULT_AVATAR);
  const [rawImage, setRawImage] = useState<string>('');
  const [useDefault, setUseDefault] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef(zoom);
  const offsetXRef = useRef(offsetX);
  const offsetYRef = useRef(offsetY);

  zoomRef.current = zoom;
  offsetXRef.current = offsetX;
  offsetYRef.current = offsetY;

  const renderCroppedImage = useCallback((img: string, z: number, ox: number, oy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      canvas.width = 200;
      canvas.height = 200;

      ctx.clearRect(0, 0, 200, 200);

      ctx.beginPath();
      ctx.arc(100, 100, 100, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const size = Math.min(image.width, image.height);
      const srcX = (image.width - size) / 2;
      const srcY = (image.height - size) / 2;

      const drawSize = 200 * z;
      const drawX = (200 - drawSize) / 2 + ox;
      const drawY = (200 - drawSize) / 2 + oy;

      ctx.drawImage(image, srcX, srcY, size, size, drawX, drawY, drawSize, drawSize);

      setProfilePic(canvas.toDataURL('image/png'));
    };
    image.src = img;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (useDefault || !rawImage) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !rawImage) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffsetX(newX);
    setOffsetY(newY);
    renderCroppedImage(rawImage, zoomRef.current, newX, newY);
  }, [isDragging, dragStart, rawImage, renderCroppedImage]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (useDefault || !rawImage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoomRef.current + delta));
    setZoom(newZoom);
    renderCroppedImage(rawImage, newZoom, offsetXRef.current, offsetYRef.current);
  }, [useDefault, rawImage, renderCroppedImage]);

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
      setRawImage(result);
      setProfilePic(result);
      setUseDefault(false);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setError('');
      // Render initial crop after a tick so canvas is visible
      setTimeout(() => renderCroppedImage(result, 1, 0, 0), 50);
    };
    reader.readAsDataURL(file);
  };

  const handleUseDefault = () => {
    setProfilePic(DEFAULT_AVATAR);
    setRawImage('');
    setUseDefault(true);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
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
      // Save by GitHub user ID so profile survives logout
      if (githubAuth.user.id) {
        localStorage.setItem(`userProfile_github_${githubAuth.user.id}`, JSON.stringify(profile));
      }
      // Also save by email if logged in via Supabase
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          localStorage.setItem(`userProfile_email_${user.email}`, JSON.stringify(profile));
        }
      });
      setLoading(false);
      onComplete(profile);
    }, 500);
  };

  return (
    <div className="profile-setup-overlay">
      <div className="profile-setup-container">
        <h2>Complete Your Profile</h2>
        <p className="profile-setup-subtitle">
          Welcome! Let's set up your profile.
        </p>

        <form onSubmit={handleComplete} className="profile-setup-form">
          {/* Profile Picture Section */}
          <div className="profile-pic-section">
            <h3>Profile Picture</h3>
            <div
              className={`profile-pic-preview ${!useDefault && rawImage ? 'draggable' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <img
                src={profilePic}
                alt="Profile preview"
                className="profile-pic-img"
                draggable={false}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {!useDefault && rawImage && (
              <p className="drag-hint">Drag to reposition • Scroll to zoom</p>
            )}

            <div className="profile-pic-options">
              <button
                type="button"
                className={`pic-option ${useDefault ? 'active' : ''}`}
                onClick={handleUseDefault}
              >
                Use Default
              </button>
              <button
                type="button"
                className={`pic-option ${!useDefault ? 'active' : ''}`}
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
