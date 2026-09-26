import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Boxes,
  ChevronDown,
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Package,
  History,
  Building2,
  MapPin,
  Bell,
  User,
  LogOut,
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const operationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (operationsRef.current && !operationsRef.current.contains(e.target as Node)) {
        setOperationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-700 shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand + Main Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                StockSense
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                Stage 1
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            {/* Operations Dropdown */}
            <div className="relative" ref={operationsRef}>
              <button
                type="button"
                onClick={() => {
                  setOperationsOpen(!operationsOpen);
                  setSettingsOpen(false);
                  setProfileOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  operationsOpen
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Operations</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${operationsOpen ? 'rotate-180' : ''}`} />
              </button>

              {operationsOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    Warehouse Flows
                  </div>
                  <Link
                    to="/operations/receipts"
                    onClick={() => setOperationsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Receipts</div>
                      <div className="text-xs text-slate-400">Receive from vendors</div>
                    </div>
                  </Link>
                  <Link
                    to="/operations/deliveries"
                    onClick={() => setOperationsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <ArrowUpFromLine className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Deliveries</div>
                      <div className="text-xs text-slate-400">Ship to customers</div>
                    </div>
                  </Link>
                  <Link
                    to="/operations/transfers"
                    onClick={() => setOperationsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-medium">Internal Transfers</div>
                      <div className="text-xs text-slate-400">Move between locations</div>
                    </div>
                  </Link>
                  <Link
                    to="/operations/adjustments"
                    onClick={() => setOperationsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-medium">Stock Adjustments</div>
                      <div className="text-xs text-slate-400">Reconcile counts</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Products / Stock */}
            <NavLink to="/stock" className={navLinkClass}>
              <Package className="w-4 h-4" />
              <span>Products / Stock</span>
            </NavLink>

            {/* Move History */}
            <NavLink to="/move-history" className={navLinkClass}>
              <History className="w-4 h-4" />
              <span>Move History</span>
            </NavLink>

            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                  setOperationsOpen(false);
                  setProfileOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  settingsOpen
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Settings</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>

              {settingsOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    Master Data
                  </div>
                  <Link
                    to="/settings/warehouses"
                    onClick={() => setSettingsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Warehouses</span>
                  </Link>
                  <Link
                    to="/settings/locations"
                    onClick={() => setSettingsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>Locations</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right side: Alerts & Avatar "A" menu */}
        <div className="flex items-center gap-3">
          {/* Low Stock Alert Button */}
          <button
            type="button"
            title="Notifications & Low Stock Alerts"
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User Profile Avatar "A" */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setOperationsOpen(false);
                setSettingsOpen(false);
              }}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-semibold text-sm flex items-center justify-center hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all shadow-xs"
              aria-label="User profile menu"
            >
              A
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">Administrator</p>
                  <p className="text-xs text-slate-400 font-mono">admin (Manager)</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
