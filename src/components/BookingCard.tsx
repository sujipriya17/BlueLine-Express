import { Download, Eye, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Booking } from '../types';
import { StatusBadge } from './StatusBadge';

interface BookingCardProps {
  booking: Booking;
  onDownloadTicket: (booking: Booking) => void;
  onCancelClick?: (booking: Booking) => void;
}

export function BookingCard({ booking, onDownloadTicket, onCancelClick }: BookingCardProps) {
  const seatNumbers = booking.passengers.map((p) => p.seatNumber).join(', ');
  const isEligibleToCancel = booking.status === 'CONFIRMED';

  return (
    <article className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-[#0F294A]">{booking.bookingReference}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 tabular-nums">
              Booked {booking.bookingDate.slice(0, 10)}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">{booking.busName}</h3>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-xs text-slate-500">Route</div>
          <div className="font-semibold text-slate-900">
            {booking.originDistrict} → {booking.destinationDistrict}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Journey Date & Time</div>
          <div className="font-semibold text-slate-900 tabular-nums">
            {booking.journeyDate} · {booking.departureTime}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Seats ({booking.passengerCount})</div>
          <div className="font-mono font-semibold text-slate-900">{seatNumbers || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Total Fare</div>
          <div className="font-mono font-bold text-[#0F294A] tabular-nums">
            ₹{booking.totalFare.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
        <Link
          to={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Details</span>
        </Link>
        <button
          type="button"
          onClick={() => onDownloadTicket(booking)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#0284C7] hover:bg-sky-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Ticket</span>
        </button>
        {isEligibleToCancel && onCancelClick && (
          <button
            type="button"
            onClick={() => onCancelClick(booking)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Booking</span>
          </button>
        )}
      </div>
    </article>
  );
}
