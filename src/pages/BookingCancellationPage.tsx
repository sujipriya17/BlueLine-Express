import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { Booking } from '../types';

export function BookingCancellationPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedId = Number(searchParams.get('bookingId')) || null;

  const [eligibleBookings, setEligibleBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cancelledResult, setCancelledResult] = useState<Booking | null>(null);

  const loadEligibleBookings = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get<Booking[]>(`/bookings/user/${user.id}`);
      const eligible = res.data.filter((b) => b.status === 'CONFIRMED');
      setEligibleBookings(eligible);
      if (preselectedId) {
        const match = eligible.find((b) => b.id === preselectedId) || eligible[0] || null;
        setSelectedBooking(match);
      } else if (eligible.length > 0) {
        setSelectedBooking(eligible[0]);
      } else {
        setSelectedBooking(null);
      }
    } catch (err) {
      setError(extractApiError(err, 'Unable to load eligible bookings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEligibleBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOpenConfirm = () => {
    setError('');
    if (!selectedBooking) {
      setError('Please select a confirmed booking to cancel.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Please enter a cancellation reason (minimum 3 characters).');
      return;
    }
    setModalOpen(true);
  };

  const handleConfirmCancellation = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post<{ message: string; booking: Booking }>(
        `/cancellations/${selectedBooking.id}/confirm`,
        { reason: reason.trim() }
      );
      setModalOpen(false);
      setCancelledResult(res.data.booking);
      setReason('');
      showToast('Booking cancelled and seats released successfully.', 'success');
      await loadEligibleBookings();
    } catch (err) {
      const msg = extractApiError(err, 'Unable to complete cancellation.');
      setError(msg);
      setModalOpen(false);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F294A]">Booking Cancellation</h1>
            <p className="text-sm text-slate-600 mt-1">
              Select an eligible confirmed journey, review the refund policy, and confirm cancellation safely.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/my-bookings"
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
            >
              My Bookings
            </Link>
            <Link
              to="/cancellations/history"
              className="px-4 py-2 rounded-lg bg-[#0F294A] text-white text-xs font-semibold hover:bg-[#163864]"
            >
              Cancellation History
            </Link>
          </div>
        </div>

        {/* Success Result Banner */}
        {cancelledResult && (
          <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-emerald-950">Cancellation Confirmed</h2>
                <p className="text-sm text-emerald-800 mt-0.5">
                  Your booking has been cancelled, associated seats have been released back to inventory, and your booking history has been preserved.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm pt-2 border-t border-emerald-200">
              <div>
                <div className="text-xs text-emerald-700">Booking Reference</div>
                <div className="font-mono font-bold text-emerald-950">{cancelledResult.bookingReference}</div>
              </div>
              <div>
                <div className="text-xs text-emerald-700">Cancelled Date & Time</div>
                <div className="font-semibold text-emerald-950 tabular-nums">{cancelledResult.cancelledAt}</div>
              </div>
              <div>
                <div className="text-xs text-emerald-700">Status</div>
                <div className="font-bold text-rose-700">{cancelledResult.status}</div>
              </div>
              <div>
                <div className="text-xs text-emerald-700">Expected Refund</div>
                <div className="font-mono font-bold text-emerald-950 tabular-nums">
                  ₹{(cancelledResult.cancellation?.refundAmount ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/cancellations/history"
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
              >
                View Cancellation History
              </Link>
              <Link
                to="/my-bookings"
                className="px-4 py-2 rounded-lg border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-100"
              >
                Return to My Bookings
              </Link>
            </div>
          </section>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Loading eligible confirmed bookings..." />
        ) : eligibleBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <XCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="text-lg font-bold text-[#0F294A]">No Eligible Bookings to Cancel</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Only active CONFIRMED bookings are eligible for cancellation. Completed or already cancelled bookings cannot be cancelled again.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link to="/my-bookings" className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700">
                View My Bookings
              </Link>
              <Link to="/cancellations/history" className="px-4 py-2 rounded-lg bg-[#0F294A] text-white text-xs font-semibold">
                Cancellation History
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* A. Booking Selection */}
            <section className="lg:col-span-6 space-y-3">
              <h2 className="text-base font-bold text-[#0F294A]">
                A. Select Eligible Booking ({eligibleBookings.length})
              </h2>
              <div className="space-y-3">
                {eligibleBookings.map((b) => {
                  const isSelected = selectedBooking?.id === b.id;
                  const seatsList = b.passengers.map((p) => p.seatNumber).join(', ');
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBooking(b);
                        setError('');
                      }}
                      className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE]/50 border-[#0284C7]'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-[#0F294A]">{b.bookingReference}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="font-semibold text-slate-900 mt-1.5">
                        {b.busName} <span className="font-mono text-xs text-slate-500">({b.registrationNumber})</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 tabular-nums">
                        {b.originDistrict} → {b.destinationDistrict} · {b.journeyDate} · {b.departureTime}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-700">
                          Seats: {seatsList} ({b.passengerCount})
                        </span>
                        <span className="font-mono font-bold text-[#0F294A] tabular-nums">
                          ₹{b.totalFare.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* B & C. Cancellation Details & Confirmation */}
            <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <h2 className="text-base font-bold text-[#0F294A] border-b border-slate-100 pb-3">
                B. Cancellation Review & Policy
              </h2>

              {selectedBooking && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Selected Booking</div>
                      <div className="font-mono font-bold text-[#0F294A]">{selectedBooking.bookingReference}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Route</div>
                      <div className="font-semibold text-slate-900">
                        {selectedBooking.originDistrict} → {selectedBooking.destinationDistrict}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Journey Date & Time</div>
                      <div className="font-semibold text-slate-900 tabular-nums">
                        {selectedBooking.journeyDate} · {selectedBooking.departureTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Seats ({selectedBooking.passengerCount})</div>
                      <div className="font-mono font-semibold text-slate-900">
                        {selectedBooking.passengers.map((p) => p.seatNumber).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Refund Policy Notice */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs text-slate-700">
                    <div className="font-bold text-[#0F294A] flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#0284C7]" />
                      <span>Configured Cancellation & Refund Policy</span>
                    </div>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      <li>2+ days before journey date: 85% fare refund</li>
                      <li>24 hours before journey date: 70% fare refund</li>
                      <li>Same-day cancellation: 50% fare refund</li>
                    </ul>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Applicable Tier ({selectedBooking.refundPolicy.refundPercentage}%):
                      </span>
                      <span className="font-mono font-bold text-emerald-700 tabular-nums">
                        Expected Refund: ₹{selectedBooking.refundPolicy.refundAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Cancellation Reason (Required)
                    </label>
                    <textarea
                      id="cancel-reason"
                      rows={3}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        setError('');
                      }}
                      placeholder="e.g. Change in travel schedule, rescheduling to another date..."
                      className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Link
                      to="/my-bookings"
                      className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Go Back
                    </Link>
                    <button
                      type="button"
                      onClick={handleOpenConfirm}
                      className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel Booking</span>
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      <ConfirmationModal
        open={modalOpen}
        title="Confirm Booking Cancellation"
        description={
          selectedBooking
            ? `Are you sure you want to cancel booking ${selectedBooking.bookingReference} (${selectedBooking.originDistrict} to ${selectedBooking.destinationDistrict})? Expected refund: ₹${selectedBooking.refundPolicy.refundAmount}. Seats will be released immediately.`
            : ''
        }
        confirmLabel="Confirm Cancellation"
        cancelLabel="Go Back"
        destructive
        loading={submitting}
        onConfirm={handleConfirmCancellation}
        onCancel={() => setModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
