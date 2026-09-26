import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Shield, Mail, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Account settings and user preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-white font-bold text-2xl flex items-center justify-center uppercase">
            {user?.name ? user.name[0] : user?.loginId ? user.loginId[0] : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name || 'User Profile'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {user?.role || 'STAFF'}
              </span>
              <span className="text-xs text-slate-400 font-mono">loginId: {user?.loginId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Login ID
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-mono">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>{user?.loginId}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Role
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>{user?.role === 'MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-400" />
                <span>••••••••••••</span>
              </span>
              <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Change
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          User authentication, password change, and OTP reset flows are implemented in Stage 2.
        </div>
      </div>
    </div>
  );
};
