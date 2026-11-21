import { ChevronDown, MapPin, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TAMIL_NADU_DISTRICTS } from '../constants/tamilNaduDistricts';

interface DistrictSelectProps {
  id?: string;
  label: string;
  value: string;
  onChange: (district: string) => void;
  placeholder?: string;
  excludeDistrict?: string;
}

export function DistrictSelect({
  id,
  label,
  value,
  onChange,
  placeholder = 'Select district',
  excludeDistrict,
}: DistrictSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = TAMIL_NADU_DISTRICTS.filter((d) => {
    if (excludeDistrict && d.toLowerCase() === excludeDistrict.toLowerCase()) {
      return false;
    }
    return d.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery('');
        }}
        className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-left text-sm flex items-center justify-between gap-2 hover:border-[#0284C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-[#0284C7] shrink-0" />
          <span className={value ? 'text-slate-900 font-medium truncate' : 'text-slate-400 truncate'}>
            {value || placeholder}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Tamil Nadu district..."
              className="w-full text-sm bg-transparent focus:outline-none text-slate-900"
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-slate-500">No matching district</li>
            ) : (
              filtered.map((district) => (
                <li key={district}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(district);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors cursor-pointer ${
                      district === value
                        ? 'bg-[#E0F2FE] text-[#0F294A] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {district}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
