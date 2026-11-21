import { BusFront, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BusCard } from '../components/BusCard';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { SearchForm } from '../components/SearchForm';
import { getTodayDateString } from '../constants/tamilNaduDistricts';
import { useBooking } from '../context/BookingContext';
import { api, extractApiError } from '../services/api';
import type { AcType, Bus, SearchParamsState, SeatCategory } from '../types';

type TimeWindow = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
type SortOption = 'EARLIEST' | 'LOWEST_PRICE' | 'HIGHEST_PRICE';

function getHour(timeStr: string): number {
  const [h] = timeStr.split(':');
  return Number(h) || 0;
}

export function AvailableBusesPage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const { setSearchParams, setSelectedBus, setSelectedSeats, setPassengers, recordSearch } = useBooking();
  const navigate = useNavigate();

  const currentSearch: SearchParamsState = {
    origin: urlParams.get('origin') || 'Chennai',
    destination: urlParams.get('destination') || 'Madurai',
    date: urlParams.get('date') || getTodayDateString(),
    acType: (urlParams.get('acType') as 'ALL' | AcType) || 'ALL',
    seatCategory: (urlParams.get('seatCategory') as 'ALL' | SeatCategory) || 'ALL',
  };

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [acFilter, setAcFilter] = useState<'ALL' | AcType>(currentSearch.acType);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SeatCategory>(currentSearch.seatCategory);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('EARLIEST');

  useEffect(() => {
    setAcFilter(currentSearch.acType);
    setCategoryFilter(currentSearch.seatCategory);
    setSearchParams(currentSearch);

    const fetchBuses = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get<Bus[]>('/buses/search', {
          params: {
            origin: currentSearch.origin,
            destination: currentSearch.destination,
            date: currentSearch.date,
          },
        });
        setBuses(res.data);
      } catch (err) {
        setError(extractApiError(err, 'Unable to load bus schedules.'));
        setBuses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [currentSearch.origin, currentSearch.destination, currentSearch.date, currentSearch.acType, currentSearch.seatCategory, setSearchParams]);

  const filteredBuses = useMemo(() => {
    return buses
      .filter((b) => {
        if (acFilter !== 'ALL' && b.acType !== acFilter) return false;
        if (categoryFilter !== 'ALL' && b.seatCategory !== categoryFilter) return false;
        if (timeWindow !== 'ALL') {
          const hr = getHour(b.departureTime);
          if (timeWindow === 'MORNING' && !(hr >= 5 && hr < 12)) return false;
          if (timeWindow === 'AFTERNOON' && !(hr >= 12 && hr < 17)) return false;
          if (timeWindow === 'EVENING' && !(hr >= 17 && hr < 21)) return false;
          if (timeWindow === 'NIGHT' && !(hr >= 21 || hr < 5)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'LOWEST_PRICE') return a.fare - b.fare;
        if (sortBy === 'HIGHEST_PRICE') return b.fare - a.fare;
        return a.departureTime.localeCompare(b.departureTime);
      });
  }, [buses, acFilter, categoryFilter, timeWindow, sortBy]);

  const handleResearch = (next: SearchParamsState) => {
    recordSearch(next);
    setUrlParams({
      origin: next.origin,
      destination: next.destination,
      date: next.date,
      acType: next.acType,
      seatCategory: next.seatCategory,
    });
  };

  const handleSelectSeats = (bus: Bus) => {
    setSelectedBus(bus);
    setSelectedSeats([]);
    setPassengers([]);
    navigate(`/buses/${bus.id}/seats`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <SearchForm initialValues={currentSearch} onSearch={handleResearch} compact />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-[#0F294A] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0284C7]" />
                <span>Filter Results</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAcFilter('ALL');
                  setCategoryFilter('ALL');
                  setTimeWindow('ALL');
                  setSortBy('EARLIEST');
                }}
                className="text-xs font-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">Coach Cooling</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['ALL', 'AC', 'NON_AC'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAcFilter(val)}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold border cursor-pointer ${
                      acFilter === val
                        ? 'bg-[#0F294A] text-white border-[#0F294A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val === 'ALL' ? 'All' : val === 'AC' ? 'AC' : 'Non-AC'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">Seat Category</div>
              <div className="space-y-1.5">
                {[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'SLEEPER', label: 'Sleeper Only' },
                  { value: 'SEATER', label: 'Seater Only' },
                  { value: 'SEATER_SLEEPER', label: 'Seater + Sleeper' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategoryFilter(opt.value as 'ALL' | SeatCategory)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer ${
                      categoryFilter === opt.value
                        ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0F294A] font-semibold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">Departure Time</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'ALL', label: 'Any Time' },
                  { value: 'MORNING', label: 'Morning (5–12)' },
                  { value: 'AFTERNOON', label: 'Afternoon (12–17)' },
                  { value: 'EVENING', label: 'Evening (17–21)' },
                  { value: 'NIGHT', label: 'Night (21–5)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimeWindow(opt.value as TimeWindow)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer ${
                      timeWindow === opt.value
                        ? 'bg-[#0F294A] text-white border-[#0F294A]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Bus List */}
          <div className="lg:col-span-9 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-[#0F294A]">
                  {currentSearch.origin} → {currentSearch.destination}
                </h1>
                <p className="text-xs text-slate-500 tabular-nums">
                  Journey Date: {currentSearch.date} · {filteredBuses.length} coach(es) matching
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sort-buses" className="text-xs font-semibold text-slate-600">
                  Sort by:
                </label>
                <select
                  id="sort-buses"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                >
                  <option value="EARLIEST">Earliest Departure</option>
                  <option value="LOWEST_PRICE">Lowest Price</option>
                  <option value="HIGHEST_PRICE">Highest Price</option>
                </select>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner label="Searching scheduled coaches..." />
            ) : error ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-sm text-rose-700 font-medium">
                {error}
              </div>
            ) : filteredBuses.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
                <BusFront className="w-10 h-10 text-slate-300 mx-auto" />
                <h2 className="text-lg font-bold text-[#0F294A]">No Scheduled Buses Found</h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  No bus schedules match {currentSearch.origin} to {currentSearch.destination} on{' '}
                  <span className="font-mono">{currentSearch.date}</span> with the selected filters. Try another date or adjust your filters.
                </p>
                <div className="pt-2">
                  <Link
                    to="/search"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0F294A] text-white text-xs font-semibold"
                  >
                    Browse Active Corridors
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBuses.map((bus) => (
                  <BusCard key={bus.id} bus={bus} onSelectSeats={handleSelectSeats} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
