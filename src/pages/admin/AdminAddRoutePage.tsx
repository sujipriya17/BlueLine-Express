import { ArrowLeft, Save } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { DistrictSelect } from '../../components/DistrictSelect';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';

export function AdminAddRoutePage() {
  const [originDistrict, setOriginDistrict] = useState('Chennai');
  const [destinationDistrict, setDestinationDistrict] = useState('Erode');
  const [distanceKm, setDistanceKm] = useState(400);
  const [estimatedDuration, setEstimatedDuration] = useState('7h 00m');
  const [baseFare, setBaseFare] = useState(720);
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (originDistrict === destinationDistrict) {
      setError('Origin and destination districts cannot be the same.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/routes', {
        originDistrict,
        destinationDistrict,
        distanceKm: Number(distanceKm),
        estimatedDuration: estimatedDuration.trim(),
        baseFare: Number(baseFare),
        active,
      });
      showToast('Route added successfully.', 'success');
      navigate('/admin/routes');
    } catch (err) {
      setError(extractApiError(err, 'Failed to create route.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Add Tamil Nadu Route"
      breadcrumb="Add Route"
      actions={
        <Link
          to="/admin/routes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Routes</span>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl space-y-5">
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <DistrictSelect label="Origin District" value={originDistrict} onChange={setOriginDistrict} />
          <DistrictSelect
            label="Destination District"
            value={destinationDistrict}
            onChange={setDestinationDistrict}
            excludeDistrict={originDistrict}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Distance (km)</label>
            <input
              type="number"
              min={10}
              required
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estimated Duration</label>
            <input
              type="text"
              required
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="7h 00m"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Base Fare (INR)</label>
            <input
              type="number"
              min={50}
              required
              value={baseFare}
              onChange={(e) => setBaseFare(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono tabular-nums"
            />
          </div>

          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-slate-300 text-[#0284C7]"
              />
              <span>Route Active</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Link
            to="/admin/routes"
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Create Route'}</span>
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
