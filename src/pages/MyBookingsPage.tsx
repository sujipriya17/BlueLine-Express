import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookingCard } from '../components/BookingCard';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { Booking } from '../types';

type BookingTab = 'ALL' | 'UPCOMING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export function MyBookingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingTab>('ALL');

  useEffect(() => {
    if (!user) return;
    api
      .get<Booking[]>(`/bookings/user/${user.id}`)
      .then((res) => setBookings(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load your bookings.'), 'error'))
      .finally(() => setLoading(false));
  }, [user, showToast]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (activeTab === 'UPCOMING') return b.status === 'CONFIRMED' && b.journeyDate >= today;
      if (activeTab === 'CONFIRMED') return b.status === 'CONFIRMED';
      if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
      if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
      return true;
    });
  }, [bookings, activeTab, today]);

  const handleDownloadTicket = async (booking: Booking) => {
    try {
      const res = await api.get(`/bookings/${booking.id}/ticket-file`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BlueLine_Ticket_${booking.bookingReference}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Ticket receipt downloaded.', 'success');
    } catch (err) {
      showToast(extractApiError(err, 'Failed to download ticket.'), 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F294A]">My Bookings</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your upcoming coach reservations, download e-tickets, or request cancellations.
            </p>
          </div>
          <Link
            to="/cancellations/new"
            className="px-4 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 whitespace-nowrap self-start"
          >
            Go to Booking Cancellation
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl w-fit">
          {(
            [
              { id: 'ALL', label: 'All Bookings' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'CONFIRMED', label: 'Confirmed' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#0F294A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching your reservations..." />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
            <h2 className="text-lg font-bold text-[#0F294A]">No Bookings in This View</h2>
            <p className="text-sm text-slate-600">
              No reservations match the selected filter tab.
            </p>
            <Link
              to="/search"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#F97316] text-white text-xs font-semibold"
            >
              Book a Bus Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onDownloadTicket={handleDownloadTicket}
                onCancelClick={(b) => navigate(`/cancellations/new?bookingId=${b.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
