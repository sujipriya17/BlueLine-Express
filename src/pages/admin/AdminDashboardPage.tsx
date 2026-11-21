import { Bus, CheckCircle2, IndianRupee, Map, Plus, Ticket, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { AdminBookingRow, AdminStats } from '../../types';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get<AdminStats>('/admin/stats'),
      api.get<AdminBookingRow[]>('/admin/bookings'),
    ])
      .then(([statsRes, bookingsRes]) => {
        setStats(statsRes.data);
        setRecentBookings(bookingsRes.data.slice(0, 8));
      })
      .catch((err) => showToast(extractApiError(err, 'Failed to load admin dashboard.'), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const maxRevenue = Math.max(1, ...(stats?.routeRevenue.map((r) => r.revenue) || [1]));

  return (
    <AdminLayout
      title="Operations Overview"
      breadcrumb="Dashboard"
      actions={
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/buses/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus</span>
          </Link>
          <Link
            to="/admin/routes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F294A] hover:bg-[#163864] text-white text-xs font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Route</span>
          </Link>
        </div>
      }
    >
      {loading || !stats ? (
        <LoadingSpinner label="Loading fleet and reservation metrics..." />
      ) : (
        <div className="space-y-6">
          {/* 8 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Buses', value: stats.totalBuses, icon: Bus, color: 'text-[#0F294A]' },
              { label: 'Total Routes', value: stats.totalRoutes, icon: Map, color: 'text-[#0284C7]' },
              { label: 'Registered Passengers', value: stats.totalPassengers, icon: Users, color: 'text-[#0F294A]' },
              {
                label: 'Total Revenue',
                value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
                icon: IndianRupee,
                color: 'text-emerald-700',
              },
              { label: 'Total Bookings', value: stats.totalBookings, icon: Ticket, color: 'text-[#0F294A]' },
              { label: 'Confirmed Bookings', value: stats.confirmedBookings, icon: CheckCircle2, color: 'text-emerald-700' },
              { label: 'Completed Journeys', value: stats.completedBookings, icon: CheckCircle2, color: 'text-[#0284C7]' },
              { label: 'Cancelled Bookings', value: stats.cancelledBookings, icon: XCircle, color: 'text-rose-700' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{card.label}</span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className={`text-2xl font-bold mt-2 font-mono tabular-nums ${card.color}`}>
                    {card.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue by Corridor Chart & Booking Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-[#0F294A]">Revenue by Tamil Nadu Corridor</h2>
              {stats.routeRevenue.length === 0 ? (
                <p className="text-sm text-slate-500">No corridor booking data available yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {stats.routeRevenue.map((item) => {
                    const pct = Math.max(4, Math.round((item.revenue / maxRevenue) * 100));
                    return (
                      <div key={item.routeLabel} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.routeLabel}</span>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {item.bookingCount} bookings · ₹{item.revenue.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#0284C7] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-[#0F294A]">Booking Status Distribution</h2>
              <div className="space-y-3">
                {[
                  { label: 'Confirmed', count: stats.confirmedBookings, color: 'bg-emerald-600' },
                  { label: 'Completed', count: stats.completedBookings, color: 'bg-[#0284C7]' },
                  { label: 'Cancelled', count: stats.cancelledBookings, color: 'bg-rose-600' },
                ].map((row) => {
                  const pct =
                    stats.totalBookings > 0 ? Math.round((row.count / stats.totalBookings) * 100) : 0;
                  return (
                    <div key={row.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>{row.label}</span>
                        <span className="font-mono tabular-nums">
                          {row.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-slate-100">
                <Link to="/admin/reports" className="text-xs font-semibold text-[#0284C7] hover:underline">
                  Open Full Operational Reports →
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F294A]">Recent Reservations</h2>
              <Link to="/admin/bookings" className="text-xs font-semibold text-[#0284C7] hover:underline">
                Manage All Bookings →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Passenger</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Journey Date</th>
                    <th className="py-3 px-4 text-right">Fare</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No reservations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F294A]">{b.bookingReference}</td>
                        <td className="py-3 px-4">{b.userName}</td>
                        <td className="py-3 px-4">
                          {b.originDistrict} → {b.destinationDistrict}
                        </td>
                        <td className="py-3 px-4 tabular-nums">{b.journeyDate}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          ₹{b.totalFare.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
