import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile, resetPassword } from '../services/api';

const Profile = () => {
  const [profile, setProfile] = useState({ username: '', email: '', dob: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: '', type: '' });

  const currentUsername = localStorage.getItem('username');

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile(currentUsername);
      if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
        setProfile({
          username: response.data.username || currentUsername,
          email: response.data.email || '',
          dob: response.data.dob || ''
        });
        if (response.data.imageData) {
          setImagePreview(`data:${response.data.imageType};base64,${response.data.imageData}`);
        }
      } else {
        setProfile(prev => ({ ...prev, username: currentUsername }));
      }
    } catch (err) {
      setProfile(prev => ({ ...prev, username: currentUsername }));
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    const formData = new FormData();
    formData.append('profile', new Blob([JSON.stringify(profile)], { type: 'application/json' }));
    if (imageFile) formData.append('imageFile', imageFile);

    try {
      await updateProfile(currentUsername, formData);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      if (profile.username !== currentUsername) {
        localStorage.setItem('username', profile.username);
        setTimeout(() => window.location.reload(), 1000);
      } else if (imageFile) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      setMessage({ text: err.response?.data || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 4) {
      setPwMessage({ text: 'Password must be at least 4 characters', type: 'error' });
      return;
    }
    setPwSaving(true);
    setPwMessage({ text: '', type: '' });
    try {
      await resetPassword(newPassword);
      setPwMessage({ text: 'Password changed successfully!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMessage({ text: 'Failed to change password', type: 'error' });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex justify-center mt-8">
        <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
          <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1.5rem' }}></div>
          <div className="skeleton mb-4" style={{ height: '20px', width: '60%', margin: '0 auto' }}></div>
          <div className="skeleton mb-4" style={{ height: '44px' }}></div>
          <div className="skeleton mb-4" style={{ height: '44px' }}></div>
          <div className="skeleton" style={{ height: '44px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex justify-center animate-fade-in" style={{ marginTop: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {/* Profile Section */}
        <div className="glass-panel mb-6" style={{ padding: '2rem' }}>
          <h2 className="text-center mb-6" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            My Profile
          </h2>

          {message.text && (
            <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-avatar-lg mb-4" />
              ) : (
                <div className="profile-avatar-placeholder-lg mb-4">
                  {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                📷 Upload Photo
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-control" value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="Enter your email" />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" className="form-control" value={profile.dob}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })} max={new Date().toISOString().split("T")[0]} />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="mb-4">🔒 Change Password</h3>

          {pwMessage.text && (
            <div className={pwMessage.type === 'error' ? 'error-message' : 'success-message'}>
              {pwMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" className="form-control" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" className="form-control" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required />
            </div>
            <button type="submit" className="btn btn-accent btn-block" disabled={pwSaving}>
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
