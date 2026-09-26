import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { fetchLowStockAlerts } from '../../api/dashboard';
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
  Layers,
  AlertTriangle,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const operationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Low stock alerts query
  const { data: alertsData } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: fetchLowStockAlerts,
    refetchInterval: 30000,
    enabled: !!user
  });

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

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
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
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
                v1.0
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
          {/* Low Stock Alert Button & Dropdown */}
          <div className="relative" ref={alertsRef}>
            <button
              type="button"
              onClick={() => {
                setAlertsOpen(!alertsOpen);
                setOperationsOpen(false);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              title="Notifications & Low Stock Alerts"
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {alertsData && alertsData.count > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                  {alertsData.count > 99 ? '99+' : alertsData.count}
                </span>
              )}
            </button>

            {alertsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                      Low Stock Alerts
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    {alertsData?.count || 0} items
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 px-1 py-1">
                  {!alertsData || alertsData.count === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      All products are adequately stocked!
                    </div>
                  ) : (
                    alertsData.alerts.map((item) => (
                      <Link
                        key={item.id}
                        to="/stock"
                        onClick={() => setAlertsOpen(false)}
                        className="flex flex-col gap-1 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                            {item.onHand} / {item.minQty} {item.uom}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono">{item.sku}</span>
                          <span className="text-rose-600 font-medium">
                            {item.onHand === 0 ? 'Out of stock' : `Short by ${item.shortage}`}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <Link
                    to="/stock"
                    onClick={() => setAlertsOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>View all products in Stock</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar "A" */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setOperationsOpen(false);
                setSettingsOpen(false);
              }}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-semibold text-sm flex items-center justify-center hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all shadow-xs uppercase"
              aria-label="User profile menu"
            >
              {user?.name ? user.name[0] : user?.loginId ? user.loginId[0] : 'A'}
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {user?.loginId || 'user'} ({user?.role || 'STAFF'})
                  </p>
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
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/stock"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Package className="w-4 h-4 text-blue-600" />
              <span>Products & Stock</span>
            </Link>
            <Link
              to="/move-history"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <History className="w-4 h-4 text-blue-600" />
              <span>Move History</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Operations
            </div>
            <div className="space-y-1 mt-1">
              <Link
                to="/operations/receipts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                <span>Receipts</span>
              </Link>
              <Link
                to="/operations/deliveries"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowUpFromLine className="w-4 h-4 text-blue-600" />
                <span>Deliveries</span>
              </Link>
              <Link
                to="/operations/transfers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                <span>Internal Transfers</span>
              </Link>
              <Link
                to="/operations/adjustments"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>Stock Adjustments</span>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Settings & Master Data
            </div>
            <div className="space-y-1 mt-1">
              <Link
                to="/settings/warehouses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Warehouses</span>
              </Link>
              <Link
                to="/settings/locations"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Locations</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>My Profile</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
