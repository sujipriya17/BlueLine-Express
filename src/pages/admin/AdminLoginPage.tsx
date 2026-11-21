import { KeyRound, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BlueLineLogo } from '../../components/BlueLineLogo';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { User } from '../../types';

export function AdminLoginPage() {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [requiresSetup, setRequiresSetup] = useState(false);

  // Setup state
  const [fullName, setFullName] = useState('Operations Administrator');
  const [phone, setPhone] = useState('9840000000');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Shared login/setup fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginSession, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    api
      .get<{ adminConfigured: boolean; requiresInitialSetup: boolean }>('/auth/admin-status')
      .then((res) => setRequiresSetup(res.data.requiresInitialSetup))
      .catch(() => setRequiresSetup(false))
      .finally(() => setCheckingStatus(false));
  }, [isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/admin-login', {
        email: email.trim(),
        password,
      });
      loginSession(res.data.token, res.data.user);
      showToast('Signed in to BlueLine Operations Console.', 'success');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(extractApiError(err, 'Invalid administrator credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Administrator password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User; message: string }>('/auth/admin-setup', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });
      loginSession(res.data.token, res.data.user);
      showToast('Administrator account initialized!', 'success');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(extractApiError(err, 'Failed to initialize administrator account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F294A] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link to="/">
          <BlueLineLogo variant="light" />
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xl">
        {checkingStatus ? (
          <LoadingSpinner label="Checking portal configuration..." />
        ) : requiresSetup ? (
          <>
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0F294A]">Initialize Administrator Account</h1>
                <p className="text-xs text-slate-600 mt-1">
                  First-run setup: create the primary fleet administrator account. This setup locks automatically once claimed.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleInitialSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Administrator Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Administrator Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bluelineexpress.in"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Set Admin Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold cursor-pointer"
              >
                {loading ? 'Initializing Console...' : 'Claim Admin Access'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0F294A]">Administrator Portal</h1>
                <p className="text-xs text-slate-600 mt-1">
                  Authorized fleet operations sign-in. Passenger accounts cannot access this portal.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bluelineexpress.in"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label htmlFor="admin-pass" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password / Passcode
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-[#0F294A] hover:bg-[#163864] text-white text-sm font-semibold cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Sign In to Admin Console'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link to="/" className="text-xs font-semibold text-[#0284C7] hover:underline">
            ← Return to Passenger Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
