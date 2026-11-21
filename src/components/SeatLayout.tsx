import { CircleDot } from 'lucide-react';
import type { Seat } from '../types';

interface SeatLayoutProps {
  seats: Seat[];
  selectedSeatIds: number[];
  onToggleSeat: (seat: Seat) => void;
  adminMode?: boolean;
}

export function SeatLayout({
  seats,
  selectedSeatIds,
  onToggleSeat,
  adminMode = false,
}: SeatLayoutProps) {
  const lowerSeats = seats.filter((s) => s.deck === 'LOWER');
  const upperSeats = seats.filter((s) => s.deck === 'UPPER');
  const selectedSet = new Set(selectedSeatIds);

  const renderSeatButton = (seat: Seat) => {
    const isSelected = selectedSet.has(seat.id);
    const isBooked = seat.status === 'BOOKED';
    const isBlocked = seat.status === 'BLOCKED';
    const isAvailable = seat.status === 'AVAILABLE';

    let colorClasses =
      'bg-emerald-50 border-emerald-500 text-emerald-900 hover:bg-emerald-100';
    if (isSelected) {
      colorClasses =
        'bg-[#F97316] border-[#EA580C] text-white shadow-sm';
    } else if (isBooked) {
      colorClasses =
        'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed';
    } else if (isBlocked) {
      colorClasses =
        'bg-rose-100 border-rose-500 text-rose-800 ' +
        (adminMode ? 'hover:bg-rose-200 cursor-pointer' : 'cursor-not-allowed');
    }

    const isSleeper = seat.seatType === 'SLEEPER';
    const disabled = adminMode ? isBooked : !isAvailable && !isSelected;

    return (
      <button
        key={seat.id}
        type="button"
        disabled={disabled}
        onClick={() => onToggleSeat(seat)}
        title={`Seat ${seat.seatNumber} (${seat.seatType}) · ₹${seat.price} · ${seat.status}`}
        className={`relative border-2 rounded-lg font-mono text-xs font-semibold transition-all flex flex-col items-center justify-center tabular-nums ${
          isSleeper ? 'h-16 w-full' : 'h-12 w-full'
        } ${colorClasses} ${!disabled ? 'cursor-pointer active:scale-95' : ''}`}
      >
        <span>{seat.seatNumber}</span>
        <span className={`text-[10px] font-sans ${isSelected ? 'text-orange-100' : 'opacity-75'}`}>
          ₹{seat.price}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seat Legend */}
      <div className="flex flex-wrap items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-50 inline-block" />
          <span>Available</span>
        </div>
        {!adminMode && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border-2 border-[#EA580C] bg-[#F97316] inline-block" />
            <span>Selected</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 border-slate-300 bg-slate-200 inline-block" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 border-rose-500 bg-rose-100 inline-block" />
          <span>Blocked</span>
        </div>
      </div>

      <div className={`grid gap-6 ${upperSeats.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
        {/* Lower Deck */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0F294A]">Lower Deck</h3>
              <p className="text-xs text-slate-500">{lowerSeats.length} seats configured</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CircleDot className="w-4 h-4 text-slate-400" />
              <span>Driver Cabin</span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {lowerSeats.map(renderSeatButton)}
          </div>
        </div>

        {/* Upper Deck */}
        {upperSeats.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#0F294A]">Upper Deck</h3>
                <p className="text-xs text-slate-500">{upperSeats.length} sleeper berths</p>
              </div>
              <span className="text-xs text-slate-500">Elevated Berths</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {upperSeats.map(renderSeatButton)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
