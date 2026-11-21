import { History, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { CancellationHistoryItem } from '../types';

export function CancellationHistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<CancellationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refQuery, setRefQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    api
      .get<CancellationHistoryItem[]>(`/cancellations/user/${user.id}`)
      .then((res) => setItems(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load cancellation history.'), 'error'))
      .finally(() => setLoading(false));
  }, [user, showToast]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (refQuery.trim() && !item.bookingReference.toLowerCase().includes(refQuery.trim().toLowerCase())) {
        return false;
      }
      if (dateFilter && !item.cancelledAt.startsWith(dateFilter)) {
        return false;
      }
      return true;
    });
  }, [items, refQuery, dateFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F294A]">Cancellation History</h1>
            <p className="text-sm text-slate-600 mt-1">
              Permanent audit log of all cancelled tickets, cancellation reasons, and refund amounts.
            </p>
          </div>
          <Link
            to="/cancellations/new"
            className="px-4 py-2 rounded-lg bg-[#0F294A] text-white text-xs font-semibold hover:bg-[#163864] self-start"
          >
            Cancel Another Booking
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={refQuery}
              onChange={(e) => setRefQuery(e.target.value)}
              placeholder="Search by booking reference (e.g. BLX...)"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by cancelled date"
            className="h-10 px-3 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
          />
          {(refQuery || dateFilter) && (
            <button
              type="button"
              onClick={() => {
                setRefQuery('');
                setDateFilter('');
              }}
              className="px-4 h-10 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading cancellation records..." />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="text-lg font-bold text-[#0F294A]">No Cancellation Records Found</h2>
            <p className="text-sm text-slate-600">
              Any booking cancelled via the Booking Cancellation page will appear here permanently.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Bus & Route</th>
                    <th className="py-3 px-4">Journey Date</th>
                    <th className="py-3 px-4">Cancelled At</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Seats</th>
                    <th className="py-3 px-4 text-right">Fare</th>
                    <th className="py-3 px-4 text-right">Refund</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F294A] whitespace-nowrap">
                        {item.bookingReference}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.busName}</div>
                        <div className="text-xs text-slate-500">
                          {item.originDistrict} → {item.destinationDistrict}
                        </div>
                      </td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap">{item.journeyDate}</td>
                      <td className="py-3 px-4 tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {item.cancelledAt}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-700" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">{item.passengerCount}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        ₹{item.totalFare.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                        ₹{item.refundAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.refundStatus} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/bookings/${item.bookingId}`}
                          className="text-xs font-semibold text-[#0284C7] hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
