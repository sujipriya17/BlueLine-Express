import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { Bus } from '../../types';

export function AdminManageBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Bus | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const loadBuses = () => {
    setLoading(true);
    api
      .get<Bus[]>('/admin/buses')
      .then((res) => setBuses(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load fleet schedules.'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buses;
    return buses.filter(
      (b) =>
        b.busName.toLowerCase().includes(q) ||
        b.registrationNumber.toLowerCase().includes(q) ||
        b.originDistrict.toLowerCase().includes(q) ||
        b.destinationDistrict.toLowerCase().includes(q)
    );
  }, [buses, query]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/buses/${deleteTarget.id}`);
      showToast('Bus schedule deleted.', 'success');
      setDeleteTarget(null);
      loadBuses();
    } catch (err) {
      showToast(extractApiError(err, 'Cannot delete bus schedule.'), 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Manage Bus Fleet & Schedules"
      breadcrumb="Manage Buses"
      actions={
        <Link
          to="/admin/buses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bus</span>
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by bus name, registration number, or district..."
            className="w-full text-sm focus:outline-none"
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading bus fleet..." />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Bus & Reg No</th>
                    <th className="py-3 px-4">Corridor</th>
                    <th className="py-3 px-4">Date & Timing</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Seats</th>
                    <th className="py-3 px-4 text-right">Fare</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((bus) => (
                    <tr key={bus.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F294A]">{bus.busName}</div>
                        <div className="font-mono text-xs text-slate-500">{bus.registrationNumber}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {bus.originDistrict} → {bus.destinationDistrict}
                      </td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                        <div>{bus.journeyDate}</div>
                        <div className="text-xs text-slate-500">
                          {bus.departureTime} – {bus.arrivalTime}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {bus.acType} · {bus.seatCategory}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {bus.availableSeats}/{bus.totalSeats}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                        ₹{bus.fare}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={bus.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <Link
                          to={`/admin/buses/${bus.id}/edit`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(bus)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete Bus Schedule"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.busName} (${deleteTarget.registrationNumber}) scheduled for ${deleteTarget.journeyDate}?`
            : ''
        }
        confirmLabel="Delete Bus"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
