import { ArrowRight, Star } from 'lucide-react';
import type { Bus } from '../types';

interface BusCardProps {
  bus: Bus;
  onSelectSeats: (bus: Bus) => void;
}

export function BusCard({ bus, onSelectSeats }: BusCardProps) {
  const categoryLabel =
    bus.seatCategory === 'SEATER_SLEEPER'
      ? 'Seater + Sleeper'
      : bus.seatCategory === 'SLEEPER'
      ? 'Sleeper'
      : 'Seater';

  const acLabel = bus.acType === 'AC' ? 'AC' : 'Non-AC';

  return (
    <article className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 hover:border-[#0284C7] transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold text-[#0F294A] truncate">{bus.busName}</h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 tabular-nums shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{bus.rating.toFixed(1)}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="font-mono text-slate-700">{bus.registrationNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{acLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{bus.journeyDate}</span>
          </div>

          <div className="pt-2 grid grid-cols-3 gap-4 max-w-lg items-center">
            <div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">{bus.departureTime}</div>
              <div className="text-xs text-slate-500 truncate">{bus.originDistrict}</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-xs font-medium text-slate-500 tabular-nums">{bus.duration}</span>
              <div className="w-full flex items-center gap-1 my-1">
                <span className="h-px flex-1 bg-slate-300" />
                <ArrowRight className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
              </div>
              <span className="text-[11px] text-slate-400">Direct Coach</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900 tabular-nums">{bus.arrivalTime}</div>
              <div className="text-xs text-slate-500 truncate">{bus.destinationDistrict}</div>
            </div>
          </div>
        </div>

        <div className="lg:border-l lg:border-slate-200 lg:pl-6 flex sm:flex-row lg:flex-col items-center sm:justify-between lg:items-end gap-4 shrink-0">
          <div className="text-left lg:text-right">
            <div className="text-xs text-slate-500">Ticket Fare</div>
            <div className="text-2xl font-bold text-[#0F294A] tabular-nums font-mono">
              ₹{bus.fare.toLocaleString('en-IN')}
            </div>
            <div
              className={`text-xs font-semibold tabular-nums mt-0.5 ${
                bus.availableSeats > 5 ? 'text-emerald-700' : bus.availableSeats > 0 ? 'text-amber-700' : 'text-rose-700'
              }`}
            >
              {bus.availableSeats} / {bus.totalSeats} seats available
            </div>
          </div>

          <button
            type="button"
            disabled={bus.availableSeats === 0}
            onClick={() => onSelectSeats(bus)}
            className="px-5 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {bus.availableSeats === 0 ? 'Sold Out' : 'View Seats'}
          </button>
        </div>
      </div>
    </article>
  );
}
