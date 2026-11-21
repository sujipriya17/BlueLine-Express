import { Plus, Power, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { RouteItem } from '../../types';

export function AdminManageRoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<RouteItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const loadRoutes = () => {
    setLoading(true);
    api
      .get<RouteItem[]>('/admin/routes')
      .then((res) => setRoutes(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load routes.'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = async (route: RouteItem) => {
    try {
      await api.put(`/admin/routes/${route.id}`, { active: !route.active });
      showToast(`Route ${route.originDistrict} → ${route.destinationDistrict} updated.`, 'success');
      loadRoutes();
    } catch (err) {
      showToast(extractApiError(err, 'Unable to update route.'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/routes/${deleteTarget.id}`);
      showToast('Route deleted.', 'success');
      setDeleteTarget(null);
      loadRoutes();
    } catch (err) {
      showToast(extractApiError(err, 'Unable to delete route.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Manage Tamil Nadu Routes"
      breadcrumb="Manage Routes"
      actions={
        <Link
          to="/admin/routes/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Route</span>
        </Link>
      }
    >
      {loading ? (
        <LoadingSpinner label="Loading routes..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Origin District</th>
                  <th className="py-3 px-4">Destination District</th>
                  <th className="py-3 px-4 text-right">Distance (km)</th>
                  <th className="py-3 px-4">Est. Duration</th>
                  <th className="py-3 px-4 text-right">Base Fare</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {routes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-[#0F294A]">{r.originDistrict}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F294A]">{r.destinationDistrict}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{r.distanceKm} km</td>
                    <td className="py-3 px-4 tabular-nums">{r.estimatedDuration}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                      ₹{r.baseFare}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{r.active ? 'Deactivate' : 'Activate'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(r)}
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

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete Route"
        description={
          deleteTarget
            ? `Delete corridor ${deleteTarget.originDistrict} → ${deleteTarget.destinationDistrict}?`
            : ''
        }
        confirmLabel="Delete Route"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
