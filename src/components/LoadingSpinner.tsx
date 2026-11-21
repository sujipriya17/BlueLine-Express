import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-600">
      <Loader2 className="w-7 h-7 animate-spin text-[#0284C7]" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
