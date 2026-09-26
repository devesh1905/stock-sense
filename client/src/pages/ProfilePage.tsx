import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfileApi, changePasswordApi } from '../api/auth';
import {
  User as UserIcon,
  Shield,
  Mail,
  Key,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Personal Info Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Preferences State (persisted in localStorage)
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('stocksense-table-density') as 'comfortable' | 'compact') || 'comfortable';
  });
  const [defaultView, setDefaultView] = useState<'list' | 'kanban'>(() => {
    return (localStorage.getItem('stocksense-default-view') as 'list' | 'kanban') || 'list';
  });

  // Password rules check
  const hasMinLength = newPassword.length > 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasSpecial && passwordsMatch;

  // Save Personal Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setProfileError('Please enter a valid email address');
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await updateProfileApi({ name: name.trim(), email: email.trim() });
      updateUser(updated);
      setProfileSuccess('Profile updated successfully');
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!isPasswordValid) {
      setPasswordError('Please meet all password complexity requirements');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePasswordApi({ currentPassword, newPassword });
      setPasswordSuccess(res.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Save Preferences
  const handleDensityChange = (density: 'comfortable' | 'compact') => {
    setTableDensity(density);
    localStorage.setItem('stocksense-table-density', density);
  };

  const handleDefaultViewChange = (view: 'list' | 'kanban') => {
    setDefaultView(view);
    localStorage.setItem('stocksense-default-view', view);
    localStorage.setItem('stock-moves-view', view);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Account settings, security, and interface preferences</p>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-2xl flex items-center justify-center uppercase shadow-xs">
              {user?.name ? user.name[0] : user?.loginId ? user.loginId[0] : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{user?.name || 'User Profile'}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {user?.role === 'MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-mono">Login ID: <strong>{user?.loginId}</strong></span>
                <span>•</span>
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            User ID: {user?.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Section 1: Personal Information */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-slate-900">Personal Information</h3>
          </div>
          <span className="text-xs text-slate-400">Update your account name and email</span>
        </div>

        {profileSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Login ID (Read-only)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-500">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>{user?.loginId}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Account Role
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>{user?.role === 'MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Change Password */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-slate-900">Change Password</h3>
          </div>
          <span className="text-xs text-slate-400">Update your login security credentials</span>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 9 characters"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password Strength Checklist */}
          {newPassword && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="font-semibold text-slate-700 mb-1">Password Requirements:</div>
              <div className="flex items-center gap-2">
                {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  More than 8 characters (min 9 chars)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                <span className={hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least one uppercase letter (A-Z)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                <span className={hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least one lowercase letter (a-z)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                <span className={hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least one special character (!@#$%^&*)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  Passwords match
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordSaving || (newPassword.length > 0 && !isPasswordValid)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Interface & View Preferences */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-slate-900">User Interface Preferences</h3>
          </div>
          <span className="text-xs text-slate-400">Settings saved locally in browser</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-800">Table Data Density</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Control row padding across tables</div>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
              <button
                onClick={() => handleDensityChange('comfortable')}
                className={`flex-1 py-1 px-2.5 rounded-md transition-colors ${
                  tableDensity === 'comfortable' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Comfortable
              </button>
              <button
                onClick={() => handleDensityChange('compact')}
                className={`flex-1 py-1 px-2.5 rounded-md transition-colors ${
                  tableDensity === 'compact' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-800">Default Operations View</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Preferred view for receipts, deliveries, transfers</div>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
              <button
                onClick={() => handleDefaultViewChange('list')}
                className={`flex-1 py-1 px-2.5 rounded-md transition-colors ${
                  defaultView === 'list' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => handleDefaultViewChange('kanban')}
                className={`flex-1 py-1 px-2.5 rounded-md transition-colors ${
                  defaultView === 'kanban' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Kanban Board
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Danger Zone / Logout */}
      <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-rose-900">Sign Out of Session</h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Securely end your current session and clear browser authorization cookies
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
