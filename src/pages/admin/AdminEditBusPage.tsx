import { ArrowLeft, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { DistrictSelect } from '../../components/DistrictSelect';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';
import type { AcType, Bus, BusStatus, SeatCategory } from '../../types';

export function AdminEditBusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [busName, setBusName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [originDistrict, setOriginDistrict] = useState('');
  const [destinationDistrict, setDestinationDistrict] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [duration, setDuration] = useState('');
  const [acType, setAcType] = useState<AcType>('AC');
  const [seatCategory, setSeatCategory] = useState<SeatCategory>('SLEEPER');
  const [totalSeats, setTotalSeats] = useState(30);
  const [fare, setFare] = useState(800);
  const [rating, setRating] = useState(4.5);
  const [status, setStatus] = useState<BusStatus>('ACTIVE');

  useEffect(() => {
    if (!id) return;
    api
      .get<Bus>(`/buses/${id}`)
      .then((res) => {
        const b = res.data;
        setBusName(b.busName);
        setRegistrationNumber(b.registrationNumber);
        setOriginDistrict(b.originDistrict);
        setDestinationDistrict(b.destinationDistrict);
        setJourneyDate(b.journeyDate);
        setDepartureTime(b.departureTime);
        setArrivalTime(b.arrivalTime);
        setDuration(b.duration);
        setAcType(b.acType);
        setSeatCategory(b.seatCategory);
        setTotalSeats(b.totalSeats);
        setFare(b.fare);
        setRating(b.rating);
        setStatus(b.status);
      })
      .catch((err) => setError(extractApiError(err, 'Unable to load bus schedule.')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (originDistrict === destinationDistrict) {
      setError('Origin and destination districts cannot be the same.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/admin/buses/${id}`, {
        busName: busName.trim(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        originDistrict,
        destinationDistrict,
        journeyDate,
        departureTime,
        arrivalTime,
        duration: duration.trim(),
        acType,
        seatCategory,
        totalSeats: Number(totalSeats),
        fare: Number(fare),
        rating: Number(rating),
        status,
      });
      showToast('Bus schedule updated successfully.', 'success');
      navigate('/admin/buses');
    } catch (err) {
      setError(extractApiError(err, 'Failed to update bus schedule.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Edit Bus Schedule"
      breadcrumb="Edit Bus"
      actions={
        <Link
          to="/admin/buses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet</span>
        </Link>
      }
    >
      {loading ? (
        <LoadingSpinner label="Loading bus details..." />
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-4xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bus Name</label>
              <input
                type="text"
                required
                value={busName}
                onChange={(e) => setBusName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registration Number</label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>

            <DistrictSelect label="Origin District" value={originDistrict} onChange={setOriginDistrict} />
            <DistrictSelect
              label="Destination District"
              value={destinationDistrict}
              onChange={setDestinationDistrict}
              excludeDistrict={originDistrict}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Journey Date</label>
              <input
                type="date"
                required
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Duration</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Departure Time</label>
              <input
                type="time"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Arrival Time</label>
              <input
                type="time"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">AC Type</label>
              <select
                value={acType}
                onChange={(e) => setAcType(e.target.value as AcType)}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="AC">AC</option>
                <option value="NON_AC">Non-AC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Seat Category</label>
              <select
                value={seatCategory}
                onChange={(e) => setSeatCategory(e.target.value as SeatCategory)}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="SLEEPER">Sleeper</option>
                <option value="SEATER">Seater</option>
                <option value="SEATER_SLEEPER">Seater + Sleeper</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Seats</label>
              <input
                type="number"
                min={12}
                max={60}
                required
                value={totalSeats}
                onChange={(e) => setTotalSeats(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ticket Fare (INR)</label>
              <input
                type="number"
                min={100}
                required
                value={fare}
                onChange={(e) => setFare(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={5}
                required
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bus Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BusStatus)}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              to="/admin/buses"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0F294A] hover:bg-[#163864] text-white text-sm font-semibold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
