import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { AdminBookingRow } from '../../types';

export function AdminManageBookingsPage() {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const { showToast } = useToast();

  const loadBookings = () => {
    setLoading(true);
    api
      .get<AdminBookingRow[]>('/admin/bookings')
      .then((res) => setBookings(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load bookings.'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        b.bookingReference.toLowerCase().includes(q) ||
        b.userName.toLowerCase().includes(q) ||
        b.busName.toLowerCase().includes(q)
      );
    });
  }, [bookings, query, statusFilter]);

  const handleStatusChange = async (bookingId: number, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status });
      showToast(`Booking status updated to ${status}.`, 'success');
      loadBookings();
    } catch (err) {
      showToast(extractApiError(err, 'Unable to update booking status.'), 'error');
    }
  };

  return (
    <AdminLayout title="Manage All Reservations" breadcrumb="Manage Bookings">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by booking reference, passenger name, or bus..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading all bookings..." />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Passenger</th>
                    <th className="py-3 px-4">Bus & Route</th>
                    <th className="py-3 px-4">Journey Date</th>
                    <th className="py-3 px-4">Payment Ref</th>
                    <th className="py-3 px-4 text-right">Fare</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No bookings match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F294A] whitespace-nowrap">
                          <Link to={`/bookings/${b.id}`} className="hover:underline">
                            {b.bookingReference}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{b.userName}</div>
                          <div className="text-xs text-slate-500">{b.userEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{b.busName}</div>
                          <div className="text-xs text-slate-500">
                            {b.originDistrict} → {b.destinationDistrict}
                          </div>
                        </td>
                        <td className="py-3 px-4 tabular-nums whitespace-nowrap">{b.journeyDate}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          <div>{b.transactionReference || '—'}</div>
                          {b.cancellationReason && (
                            <div className="text-rose-600 truncate max-w-36" title={b.cancellationReason}>
                              Reason: {b.cancellationReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                          ₹{b.totalFare.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {b.status === 'CANCELLED' ? (
                            <span className="text-xs text-slate-400">Locked</span>
                          ) : (
                            <select
                              value={b.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  b.id,
                                  e.target.value as 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
                                )
                              }
                              className="h-8 px-2 rounded-md border border-slate-300 text-xs bg-white font-semibold"
                            >
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
