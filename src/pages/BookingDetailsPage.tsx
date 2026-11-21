import { ArrowLeft, Download, Printer, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { Booking } from '../types';

export function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get<Booking>(`/bookings/${id}`)
      .then((res) => setBooking(res.data))
      .catch((err) => setError(extractApiError(err, 'Unable to load booking details.')))
      .finally(() => setLoading(false));
  }, [id]);

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
    } catch (err) {
      showToast(extractApiError(err, 'Failed to download ticket.'), 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between no-print">
          <Link to="/my-bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0284C7] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Bookings</span>
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading booking details..." />
        ) : error || !booking ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-sm text-rose-700 font-medium">
            {error || 'Booking not found.'}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500">Booking Reference</div>
                <h1 className="font-mono text-2xl font-bold text-[#0F294A]">{booking.bookingReference}</h1>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">Booked on {booking.bookingDate}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            {/* Bus & Route */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
              <div>
                <div className="text-xs text-slate-500">Bus Service</div>
                <div className="font-bold text-slate-900">{booking.busName}</div>
                <div className="font-mono text-xs text-slate-500">{booking.registrationNumber}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Route Corridor</div>
                <div className="font-bold text-slate-900">
                  {booking.originDistrict} → {booking.destinationDistrict}
                </div>
                <div className="text-xs text-slate-500">
                  {booking.acType} · {booking.seatCategory}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Journey Date & Timing</div>
                <div className="font-bold text-slate-900 tabular-nums">{booking.journeyDate}</div>
                <div className="text-xs text-slate-500 tabular-nums">
                  {booking.departureTime} → {booking.arrivalTime} ({booking.duration})
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold text-[#0F294A] mb-3">Seat & Passenger Information</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Seat No</th>
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

            {/* Payment Details */}
            {booking.payment && (
              <div className="border-t border-slate-200 pt-5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Transaction Reference</div>
                  <div className="font-mono font-semibold text-slate-900">{booking.payment.transactionReference}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Payment Method</div>
                  <div className="font-semibold text-slate-900">{booking.payment.paymentMethod.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Payment Status</div>
                  <div className="font-semibold text-slate-900">{booking.payment.status}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="font-mono font-bold text-[#0F294A] tabular-nums">
                    ₹{booking.totalFare.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Details when applicable */}
            {booking.status === 'CANCELLED' && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 space-y-2 text-sm">
                <div className="font-bold text-rose-900">Cancellation Summary</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-rose-800">
                  <div>
                    <span className="text-xs block text-rose-600">Cancelled On</span>
                    <span className="font-semibold tabular-nums">{booking.cancelledAt || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-rose-600">Reason</span>
                    <span className="font-semibold">{booking.cancellationReason || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-rose-600">Refund Processed</span>
                    <span className="font-mono font-bold tabular-nums">
                      ₹{(booking.cancellation?.refundAmount ?? 0).toLocaleString('en-IN')} ({booking.cancellation?.refundStatus || 'PROCESSED'})
                    </span>
                  </div>
                </div>
              </div>
            )}

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
              {booking.status === 'CONFIRMED' && (
                <Link
                  to={`/cancellations/new?bookingId=${booking.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold ml-auto"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Booking</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
