import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-extrabold text-slate-300">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
};
