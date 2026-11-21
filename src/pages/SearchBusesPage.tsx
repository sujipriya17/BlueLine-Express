import { Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { SearchForm } from '../components/SearchForm';
import { getTodayDateString } from '../constants/tamilNaduDistricts';
import { useBooking } from '../context/BookingContext';
import { api } from '../services/api';
import type { RouteItem, SearchParamsState } from '../types';

export function SearchBusesPage() {
  const { searchParams, setSearchParams, recentSearches, recordSearch } = useBooking();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<RouteItem[]>('/buses/popular-routes')
      .then((res) => setRoutes(res.data))
      .catch(() => setRoutes([]));
  }, []);

  const handleSearch = (params: SearchParamsState) => {
    setSearchParams(params);
    recordSearch(params);
    const qs = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      date: params.date,
      acType: params.acType,
      seatCategory: params.seatCategory,
    });
    navigate(`/buses?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F294A]">Search Tamil Nadu Intercity Buses</h1>
          <p className="text-sm text-slate-600 mt-1">
            Select any origin and destination district across Tamil Nadu to inspect scheduled coaches and real-time seat availability.
          </p>
        </div>

        <SearchForm initialValues={searchParams} onSearch={handleSearch} />

        {recentSearches.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#0F294A]">Recent Searches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentSearches.map((item, idx) => (
                <button
                  key={`${item.origin}-${item.destination}-${item.date}-${idx}`}
                  type="button"
                  onClick={() => handleSearch(item)}
                  className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0284C7] transition-colors cursor-pointer"
                >
                  <div className="text-sm font-bold text-[#0F294A]">
                    {item.origin} → {item.destination}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>{item.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#0F294A]">Configured Active Corridors</h2>
          <p className="text-xs text-slate-500">
            Only routes with scheduled buses in the database return coach results. Unconfigured district pairs will show an empty schedule notice.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#0F294A] truncate">
                    <MapPin className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span className="truncate">
                      {r.originDistrict} → {r.destinationDistrict}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 tabular-nums">
                    {r.distanceKm} km · {r.estimatedDuration} · From ₹{r.baseFare}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSearch({
                      origin: r.originDistrict,
                      destination: r.destinationDistrict,
                      date: getTodayDateString(),
                      acType: 'ALL',
                      seatCategory: 'ALL',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#E0F2FE] hover:bg-[#0284C7] text-[#0F294A] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Search Today
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
