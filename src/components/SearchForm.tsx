import { ArrowLeftRight, Calendar, Search } from 'lucide-react';
import React, { useState } from 'react';
import { getTodayDateString } from '../constants/tamilNaduDistricts';
import type { AcType, SearchParamsState, SeatCategory } from '../types';
import { DistrictSelect } from './DistrictSelect';

interface SearchFormProps {
  initialValues: SearchParamsState;
  onSearch: (params: SearchParamsState) => void;
  compact?: boolean;
}

export function SearchForm({ initialValues, onSearch, compact = false }: SearchFormProps) {
  const [origin, setOrigin] = useState(initialValues.origin);
  const [destination, setDestination] = useState(initialValues.destination);
  const [date, setDate] = useState(initialValues.date || getTodayDateString());
  const [acType, setAcType] = useState<'ALL' | AcType>(initialValues.acType);
  const [seatCategory, setSeatCategory] = useState<'ALL' | SeatCategory>(initialValues.seatCategory);
  const [error, setError] = useState('');

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      setError('Please select both origin and destination districts.');
      return;
    }
    if (origin.toLowerCase() === destination.toLowerCase()) {
      setError('Origin and destination districts cannot be the same.');
      return;
    }
    if (!date) {
      setError('Please choose a journey date.');
      return;
    }
    setError('');
    onSearch({ origin, destination, date, acType, seatCategory });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
        <div className="md:col-span-3">
          <DistrictSelect
            id="search-origin"
            label="From District"
            value={origin}
            onChange={(val) => {
              setOrigin(val);
              setError('');
            }}
            placeholder="Origin district"
          />
        </div>

        <div className="md:col-span-1 flex justify-center pb-0.5">
          <button
            type="button"
            onClick={handleSwap}
            className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#E0F2FE] hover:border-[#0284C7] text-[#0F294A] flex items-center justify-center transition-colors cursor-pointer"
            title="Swap origin and destination"
            aria-label="Swap origin and destination"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        <div className="md:col-span-3">
          <DistrictSelect
            id="search-destination"
            label="To District"
            value={destination}
            onChange={(val) => {
              setDestination(val);
              setError('');
            }}
            placeholder="Destination district"
            excludeDistrict={origin}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="search-date" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Journey Date
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-[#0284C7] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-date"
              type="date"
              min={getTodayDateString()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError('');
              }}
              className="w-full h-11 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] tabular-nums"
            />
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="search-ac" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Coach Type
            </label>
            <select
              id="search-ac"
              value={acType}
              onChange={(e) => setAcType(e.target.value as 'ALL' | AcType)}
              className="w-full h-11 px-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
            >
              <option value="ALL">All AC/Non-AC</option>
              <option value="AC">AC Only</option>
              <option value="NON_AC">Non-AC</option>
            </select>
          </div>
          <div>
            <label htmlFor="search-category" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Seat Class
            </label>
            <select
              id="search-category"
              value={seatCategory}
              onChange={(e) => setSeatCategory(e.target.value as 'ALL' | SeatCategory)}
              className="w-full h-11 px-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
            >
              <option value="ALL">All Seats</option>
              <option value="SLEEPER">Sleeper</option>
              <option value="SEATER">Seater</option>
              <option value="SEATER_SLEEPER">Seater + Sleeper</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-rose-600 font-medium min-h-4">{error}</div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Search Buses</span>
        </button>
      </div>
    </form>
  );
}
