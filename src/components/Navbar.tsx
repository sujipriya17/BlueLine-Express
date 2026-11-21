import { Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BlueLineLogo } from './BlueLineLogo';

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
      isActive
        ? 'text-[#0F294A] border-[#F97316]'
        : 'text-slate-600 border-transparent hover:text-[#0F294A] hover:border-slate-300'
    }`;

  const handlePrimaryAction = () => {
    setMobileOpen(false);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link to="/" className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded-lg">
          <BlueLineLogo />
        </Link>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Search Buses
          </NavLink>
          <NavLink to={isAuthenticated && !isAdmin ? '/my-bookings' : '/login'} className={navLinkClass}>
            My Bookings
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About Us
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact Us
          </NavLink>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#0F294A] text-white hover:bg-[#163864] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>{isAdmin ? 'Admin Console' : user?.fullName.split(' ')[0] || 'Dashboard'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-sm font-medium text-slate-600 hover:text-rose-600 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-slate-700">
            Home
          </Link>
          <Link to="/search" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-slate-700">
            Search Buses
          </Link>
          <Link
            to={isAuthenticated && !isAdmin ? '/my-bookings' : '/login'}
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700"
          >
            My Bookings
          </Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-slate-700">
            About Us
          </Link>
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-slate-700">
            Contact Us
          </Link>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0F294A] text-white text-sm font-semibold text-center"
                >
                  {isAdmin ? 'Admin Console' : 'Passenger Dashboard'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-2 px-4 rounded-lg border border-slate-200 text-sm font-medium text-rose-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#F97316] text-white text-sm font-semibold"
                >
                  Sign In
                </button>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2 px-4 rounded-lg border border-slate-200 text-sm font-medium text-center text-[#0F294A]"
                >
                  Create Passenger Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
