import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { SeatLayout } from '../components/SeatLayout';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { Bus, Seat } from '../types';

export function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>();
  const busId = Number(id);
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();
  const { selectedBus, setSelectedBus, selectedSeats, setSelectedSeats } = useBooking();
  const { showToast } = useToast();

  const [bus, setBus] = useState<Bus | null>(selectedBus && selectedBus.id === busId ? selectedBus : null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBusAndSeats = async () => {
      setLoading(true);
      setError('');
      try {
        const [busRes, seatsRes] = await Promise.all([
          api.get<Bus>(`/buses/${busId}`),
          api.get<Seat[]>(`/buses/${busId}/seats`),
        ]);
        setBus(busRes.data);
        setSelectedBus(busRes.data);
        setSeats(seatsRes.data);
      } catch (err) {
        setError(extractApiError(err, 'Unable to load bus seat layout.'));
      } finally {
        setLoading(false);
      }
    };

    if (busId > 0) {
      loadBusAndSeats();
    }
  }, [busId, setSelectedBus]);

  const handleToggleSeat = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') {
      showToast(`Seat ${seat.seatNumber} is ${seat.status.toLowerCase()}.`, 'error');
      return;
    }

    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length >= 6) {
        showToast('You can select up to 6 seats per booking.', 'info');
        return prev;
      }
      return [...prev, seat];
    });
  };

  const totalFare = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      showToast('Please select at least one available seat to continue.', 'error');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please sign in to enter passenger details and reserve seats.', 'info');
      navigate('/login', { state: { from: `/buses/${busId}/seats` } });
      return;
    }
    navigate('/booking/passengers');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/buses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0284C7] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Available Buses</span>
          </Link>
          <span className="text-xs font-medium text-slate-500">Step 1 of 3 · Seat Selection</span>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading live seat layout..." />
        ) : error || !bus ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-sm text-rose-700 font-medium">
            {error || 'Bus not found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h1 className="text-xl font-bold text-[#0F294A]">{bus.busName}</h1>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {bus.originDistrict} → {bus.destinationDistrict} · {bus.journeyDate} · {bus.departureTime} – {bus.arrivalTime} ·{' '}
                  {bus.acType === 'AC' ? 'AC' : 'Non-AC'} · {bus.registrationNumber}
                </p>
              </div>

              <SeatLayout
                seats={seats}
                selectedSeatIds={selectedSeats.map((s) => s.id)}
                onToggleSeat={handleToggleSeat}
              />
            </div>

            <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5 sticky top-24">
              <h2 className="text-lg font-bold text-[#0F294A] border-b border-slate-100 pb-3">
                Selected Seats Summary
              </h2>

              {selectedSeats.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  Click any green available seat on the coach layout to reserve it.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#0F294A]">Seat {seat.seatNumber}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          ({seat.deck} · {seat.seatType})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">₹{seat.price}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSeat(seat)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          aria-label={`Remove seat ${seat.seatNumber}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Selected Count</span>
                  <span className="font-semibold tabular-nums">{selectedSeats.length} seat(s)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0F294A]">
                  <span>Total Fare</span>
                  <span className="font-mono tabular-nums">₹{totalFare.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={handleContinue}
                className="w-full py-3 px-4 rounded-lg bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Continue to Passenger Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
