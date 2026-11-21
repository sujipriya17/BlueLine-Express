import { LogIn, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { User } from '../types';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { loginSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = (location.state as { from?: string } | null)?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email: email.trim(),
        password,
        rememberMe,
      });
      loginSession(res.data.token, res.data.user);
      showToast(`Welcome back, ${res.data.user.fullName}.`, 'success');
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxPassenger = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/demo-passenger');
      loginSession(res.data.token, res.data.user);
      showToast('Signed in to Sample Passenger sandbox with sample bookings.', 'success');
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0F294A]">Passenger Sign In</h1>
            <p className="text-sm text-slate-600 mt-1">
              Access your bookings, e-tickets, loyalty points, and cancellations.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="passenger@example.com"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7]"
                />
                <span>Remember Me</span>
              </label>
              <Link to="/forgot-password" className="font-medium text-[#0284C7] hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[#0F294A] hover:bg-[#163864] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Signing In...' : 'Login'}</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Academic Evaluation Sandbox</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            disabled={demoLoading}
            onClick={handleSandboxPassenger}
            className="w-full h-11 rounded-lg border border-sky-200 bg-[#E0F2FE]/60 hover:bg-[#E0F2FE] text-[#0F294A] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#0284C7]" />
            <span>{demoLoading ? 'Preparing Sample Account...' : 'Sign In as Sample Passenger'}</span>
          </button>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
            <span>
              New here?{' '}
              <Link to="/register" className="font-semibold text-[#0284C7] hover:underline">
                Register
              </Link>
            </span>
            <Link to="/admin/login" className="text-xs font-medium text-slate-500 hover:text-[#0F294A]">
              Admin Portal →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
