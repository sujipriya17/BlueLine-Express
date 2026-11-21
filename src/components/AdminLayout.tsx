import {
  BarChart3,
  Bus,
  FileSpreadsheet,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  Map,
  Ticket,
  Users,
} from 'lucide-react';
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BlueLineLogo } from './BlueLineLogo';

interface AdminLayoutProps {
  title: string;
  breadcrumb: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/buses', label: 'Manage Buses', icon: Bus },
  { to: '/admin/routes', label: 'Manage Routes', icon: Map },
  { to: '/admin/seats', label: 'Manage Seats', icon: Grid3X3 },
  { to: '/admin/bookings', label: 'Manage Bookings', icon: Ticket },
  { to: '/admin/passengers', label: 'Passengers', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: FileSpreadsheet },
];

export function AdminLayout({ title, breadcrumb, actions, children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#0F294A] text-slate-200 flex flex-col shrink-0">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <Link to="/admin/dashboard">
            <BlueLineLogo variant="light" />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-x-auto lg:overflow-visible flex lg:flex-col gap-1">
          {ADMIN_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#0284C7] text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs text-slate-400">
            <div className="font-semibold text-white truncate">{user?.fullName || 'Administrator'}</div>
            <div className="truncate">{user?.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 text-center py-2 px-3 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap"
            >
              Public Site
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-xs font-semibold text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Admin Console / {breadcrumb}</span>
            </div>
            <h1 className="text-xl font-bold text-[#0F294A] mt-0.5">{title}</h1>
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
