import { Award, CalendarCheck, CheckCircle2, History, Search, Ticket, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookingCard } from '../components/BookingCard';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { Booking } from '../types';

export function PassengerDashboardPage() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    refreshProfile();
    api
      .get<Booking[]>(`/bookings/user/${user.id}`)
      .then((res) => setBookings(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load dashboard bookings.'), 'error'))
      .finally(() => setLoading(false));
  }, [user, refreshProfile, showToast]);

  const today = new Date().toISOString().slice(0, 10);
  const totalBookings = bookings.length;
  const upcomingJourneys = bookings.filter((b) => b.status === 'CONFIRMED' && b.journeyDate >= today).length;
  const completedJourneys = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;

  const handleDownload = async (booking: Booking) => {
    try {
      const res = await api.get(`/bookings/${booking.id}/ticket-file`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BlueLine_Ticket_${booking.bookingReference}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(extractApiError(err, 'Failed to download ticket.'), 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome & Profile Header */}
        <section className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-sky-300">Passenger Account Overview</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Welcome back, {user?.fullName}</h1>
            <p className="text-sm text-slate-300 mt-1.5">
              {user?.email} · <span className="font-mono">{user?.phone}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Search Buses</span>
            </Link>
            <Link
              to="/cancellations/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold whitespace-nowrap"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Booking</span>
            </Link>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Bookings</span>
              <Ticket className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div className="text-2xl font-bold text-[#0F294A] mt-2 tabular-nums font-mono">{totalBookings}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Upcoming Journeys</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums font-mono">{upcomingJourneys}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div className="text-2xl font-bold text-[#0284C7] mt-2 tabular-nums font-mono">{completedJourneys}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Cancelled</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-2 tabular-nums font-mono">{cancelledBookings}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Loyalty Points</span>
              <Award className="w-4 h-4 text-[#F97316]" />
            </div>
            <div className="text-2xl font-bold text-[#F97316] mt-2 tabular-nums font-mono">
              {user?.loyaltyPoints ?? 0}
            </div>
          </div>
        </section>

        {/* Quick Navigation Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/search"
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0284C7] transition-colors text-sm font-semibold text-[#0F294A]"
          >
            Search New Bus →
          </Link>
          <Link
            to="/my-bookings"
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0284C7] transition-colors text-sm font-semibold text-[#0F294A]"
          >
            View My Bookings →
          </Link>
          <Link
            to="/cancellations/new"
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0284C7] transition-colors text-sm font-semibold text-[#0F294A]"
          >
            Booking Cancellation →
          </Link>
          <Link
            to="/cancellations/history"
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0284C7] transition-colors text-sm font-semibold text-[#0F294A] flex items-center justify-between"
          >
            <span>Cancellation History</span>
            <History className="w-4 h-4 text-[#0284C7]" />
          </Link>
        </section>

        {/* Recent Bookings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F294A]">Recent Booking History</h2>
            <Link to="/my-bookings" className="text-sm font-semibold text-[#0284C7] hover:underline">
              View All Bookings →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading recent bookings..." />
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <p className="text-sm text-slate-600">You have not booked any bus tickets yet.</p>
              <Link
                to="/search"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#F97316] text-white text-xs font-semibold"
              >
                Search Buses Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 3).map((b) => (
                <BookingCard key={b.id} booking={b} onDownloadTicket={handleDownload} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
