import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SeatLayout } from '../../components/SeatLayout';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { Bus, Seat } from '../../types';

export function AdminManageSeatsPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<number>(0);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    api
      .get<Bus[]>('/admin/buses')
      .then((res) => {
        setBuses(res.data);
        if (res.data.length > 0) {
          setSelectedBusId(res.data[0].id);
        }
      })
      .catch((err) => showToast(extractApiError(err, 'Unable to load buses.'), 'error'))
      .finally(() => setLoadingBuses(false));
  }, [showToast]);

  const loadSeats = (busId: number) => {
    if (!busId) return;
    setLoadingSeats(true);
    api
      .get<Seat[]>(`/admin/buses/${busId}/seats`)
      .then((res) => setSeats(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load seats.'), 'error'))
      .finally(() => setLoadingSeats(false));
  };

  useEffect(() => {
    if (selectedBusId) {
      loadSeats(selectedBusId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusId]);

  const handleToggleSeat = async (seat: Seat) => {
    if (seat.status === 'BOOKED') {
      showToast(`Seat ${seat.seatNumber} is booked by a passenger and cannot be modified.`, 'error');
      return;
    }
    try {
      const res = await api.put<{ id: number; status: 'AVAILABLE' | 'BLOCKED'; message: string }>(
        `/admin/seats/${seat.id}/toggle`
      );
      showToast(res.data.message, 'success');
      setSeats((prev) => prev.map((s) => (s.id === seat.id ? { ...s, status: res.data.status } : s)));
    } catch (err) {
      showToast(extractApiError(err, 'Unable to toggle seat state.'), 'error');
    }
  };

  const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;
  const bookedCount = seats.filter((s) => s.status === 'BOOKED').length;
  const blockedCount = seats.filter((s) => s.status === 'BLOCKED').length;

  return (
    <AdminLayout title="Manage Coach Seat Inventory" breadcrumb="Manage Seats">
      {loadingBuses ? (
        <LoadingSpinner label="Loading bus schedules..." />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-xl">
              <label htmlFor="seat-bus-select" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Select Bus Schedule
              </label>
              <select
                id="seat-bus-select"
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm bg-white font-medium"
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.busName} ({b.registrationNumber}) · {b.originDistrict} → {b.destinationDistrict} ·{' '}
                    {b.journeyDate}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-5 text-xs font-semibold tabular-nums">
              <span className="text-emerald-700">Available: {availableCount}</span>
              <span className="text-slate-600">Booked: {bookedCount}</span>
              <span className="text-rose-700">Blocked: {blockedCount}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Click any <span className="font-semibold text-emerald-700">Available</span> seat to block it, or click a{' '}
            <span className="font-semibold text-rose-700">Blocked</span> seat to unblock it. Booked seats remain protected.
          </p>

          {loadingSeats ? (
            <LoadingSpinner label="Loading seat layout..." />
          ) : (
            <SeatLayout seats={seats} selectedSeatIds={[]} onToggleSeat={handleToggleSeat} adminMode />
          )}
        </div>
      )}
    </AdminLayout>
  );
}
