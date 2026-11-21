import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  if (normalized === 'CONFIRMED' || normalized === 'ACTIVE' || normalized === 'SUCCESS' || normalized === 'PROCESSED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{normalized}</span>
      </span>
    );
  }

  if (normalized === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] bg-[#E0F2FE] border border-sky-200 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>COMPLETED</span>
      </span>
    );
  }

  if (normalized === 'CANCELLED' || normalized === 'FAILED' || normalized === 'BLOCKED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{normalized}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{normalized}</span>
    </span>
  );
}
