import { CheckCircle2, Download, Home, Printer, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { Booking } from '../types';

export function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const stateBooking = (location.state as { booking?: Booking } | null)?.booking ?? null;

  const [booking, setBooking] = useState<Booking | null>(stateBooking);
  const [loading, setLoading] = useState(!stateBooking);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (!booking && bookingId) {
      api
        .get<Booking>(`/bookings/${bookingId}`)
        .then((res) => setBooking(res.data))
        .catch((err) => setError(extractApiError(err, 'Unable to load booking confirmation.')))
        .finally(() => setLoading(false));
    }
  }, [booking, bookingId]);

  const handleDownloadTicket = async () => {
    if (!booking) return;
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
      showToast(extractApiError(err, 'Unable to download ticket receipt.'), 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <LoadingSpinner label="Loading booking confirmation..." />
        ) : error || !booking ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-sm text-rose-700 font-medium">
            {error || 'Booking record unavailable.'}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h1 className="text-2xl font-bold text-[#0F294A]">Booking Confirmed</h1>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Your e-ticket is ready. Reference{' '}
                    <span className="font-mono font-bold text-[#0F294A]">{booking.bookingReference}</span>
                  </p>
                </div>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
              <div>
                <div className="text-xs text-slate-500">Booking Reference</div>
                <div className="font-mono font-bold text-[#0F294A]">{booking.bookingReference}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Booking Date</div>
                <div className="font-semibold text-slate-900 tabular-nums">{booking.bookingDate}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Primary Account Holder</div>
                <div className="font-semibold text-slate-900">{booking.userName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Bus Service</div>
                <div className="font-semibold text-slate-900">{booking.busName}</div>
                <div className="font-mono text-xs text-slate-500">{booking.registrationNumber}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Route</div>
                <div className="font-semibold text-slate-900">
                  {booking.originDistrict} → {booking.destinationDistrict}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Journey Schedule</div>
                <div className="font-semibold text-slate-900 tabular-nums">
                  {booking.journeyDate} · {booking.departureTime} → {booking.arrivalTime}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Payment Method</div>
                <div className="font-semibold text-slate-900">
                  {booking.payment?.paymentMethod.replace('_', ' ') || 'UPI'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Transaction Reference</div>
                <div className="font-mono font-semibold text-slate-900">
                  {booking.payment?.transactionReference || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total Fare Paid</div>
                <div className="font-mono text-lg font-bold text-[#0F294A] tabular-nums">
                  ₹{booking.totalFare.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold text-[#0F294A] mb-3">Passenger & Seat Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Seat</th>
                      <th className="py-2.5 px-4">Passenger Name</th>
                      <th className="py-2.5 px-4">Age</th>
                      <th className="py-2.5 px-4">Gender</th>
                      <th className="py-2.5 px-4">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {booking.passengers.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#0F294A]">{p.seatNumber}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">{p.passengerName}</td>
                        <td className="py-2.5 px-4 tabular-nums">{p.age}</td>
                        <td className="py-2.5 px-4">{p.gender}</td>
                        <td className="py-2.5 px-4 font-mono tabular-nums">{p.contactPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3 no-print">
              <button
                type="button"
                onClick={handleDownloadTicket}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F294A] hover:bg-[#163864] text-white text-sm font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ticket</span>
              </button>
              <Link
                to="/my-bookings"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold"
              >
                <Ticket className="w-4 h-4" />
                <span>Go to My Bookings</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
