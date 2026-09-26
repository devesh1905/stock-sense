import React from 'react';
import { User, Shield, Mail, Key } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Account settings and user preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-white font-bold text-2xl flex items-center justify-center">
            A
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Administrator</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                MANAGER
              </span>
              <span className="text-xs text-slate-400 font-mono">loginId: admin</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Login ID
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <span>admin</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>admin@stocksense.local</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Role
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Inventory Manager</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-400" />
                <span>&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
              </span>
              <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Change
              </button>
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
