import { Eye, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { AdminPassengerSummary } from '../../types';

interface PassengerBookingHistoryRow {
  id: number;
  bookingReference: string;
  busName: string;
  originDistrict: string;
  destinationDistrict: string;
  journeyDate: string;
  totalFare: number;
  passengerCount: number;
  status: string;
}

export function AdminManagePassengersPage() {
  const [passengers, setPassengers] = useState<AdminPassengerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState<AdminPassengerSummary | null>(null);
  const [history, setHistory] = useState<PassengerBookingHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    api
      .get<AdminPassengerSummary[]>('/admin/passengers')
      .then((res) => setPassengers(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load passengers.'), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return passengers;
    return passengers.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [passengers, query]);

  const handleInspect = async (passenger: AdminPassengerSummary) => {
    setSelectedPassenger(passenger);
    setHistoryLoading(true);
    try {
      const res = await api.get<PassengerBookingHistoryRow[]>(`/admin/passengers/${passenger.id}/bookings`);
      setHistory(res.data);
    } catch (err) {
      showToast(extractApiError(err, 'Unable to load passenger booking history.'), 'error');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <AdminLayout title="Manage Registered Passengers" breadcrumb="Manage Passengers">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search passengers by name, email, or phone..."
            className="w-full text-sm focus:outline-none"
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading passenger directory..." />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Passenger Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-right">Loyalty Pts</th>
                    <th className="py-3 px-4 text-right">Bookings</th>
                    <th className="py-3 px-4 text-right">Total Spent</th>
                    <th className="py-3 px-4 text-right">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No registered passengers match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-[#0F294A]">{p.fullName}</td>
                        <td className="py-3 px-4 text-slate-600">{p.email}</td>
                        <td className="py-3 px-4 font-mono tabular-nums">{p.phone}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{p.loyaltyPoints}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{p.totalBookings}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                          ₹{p.totalSpent.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleInspect(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-[#0284C7] hover:bg-sky-50 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View History</span>
                          </button>
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

      {selectedPassenger && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#0F294A]">{selectedPassenger.fullName}</h2>
                <p className="text-xs text-slate-500">
                  {selectedPassenger.email} · {selectedPassenger.phone} · Loyalty Points:{' '}
                  {selectedPassenger.loyaltyPoints}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPassenger(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <LoadingSpinner label="Loading passenger bookings..." />
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">This passenger has no booking records yet.</p>
            ) : (
              <div className="space-y-2.5">
                {history.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <div className="font-mono font-bold text-[#0F294A]">{h.bookingReference}</div>
                      <div className="text-xs text-slate-600">
                        {h.busName} · {h.originDistrict} → {h.destinationDistrict} ({h.journeyDate})
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <StatusBadge status={h.status} />
                      <div className="font-mono text-xs font-bold tabular-nums">
                        ₹{h.totalFare.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
