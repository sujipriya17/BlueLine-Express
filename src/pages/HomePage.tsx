import {
  ArrowRight,
  Clock,
  HeadphonesIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  TicketCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Navbar } from '../components/Navbar';
import { SearchForm } from '../components/SearchForm';
import { BRAND_IMAGES, getTodayDateString } from '../constants/tamilNaduDistricts';
import { useBooking } from '../context/BookingContext';
import { api } from '../services/api';
import type { RouteItem, SearchParamsState } from '../types';

export function HomePage() {
  const { searchParams, setSearchParams, recordSearch } = useBooking();
  const [popularRoutes, setPopularRoutes] = useState<RouteItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<RouteItem[]>('/buses/popular-routes')
      .then((res) => setPopularRoutes(res.data.slice(0, 6)))
      .catch(() => setPopularRoutes([]));
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

  const handleQuickRoute = (origin: string, destination: string) => {
    const params: SearchParamsState = {
      origin,
      destination,
      date: getTodayDateString(),
      acType: 'ALL',
      seatCategory: 'ALL',
    };
    handleSearch(params);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-[#0F294A] text-white overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={BRAND_IMAGES.heroBus}
            alt="BlueLine Express luxury intercity coach cruising along Tamil Nadu highway"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F294A]/95 via-[#0F294A]/80 to-[#0F294A]/65" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-24 lg:pt-20 lg:pb-28">
          <div className="max-w-3xl space-y-5">
            <p className="text-sm font-semibold text-sky-300 tracking-wide">
              BlueLine Express · Your Journey, Our Priority.
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
              Travel Across Tamil Nadu with Comfort
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
              Book Your Journey. Travel with Confidence. Direct AC Sleeper and Executive Seater coaches connecting all 38 districts of Tamil Nadu with instant e-tickets and transparent cancellation policies.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Search Buses</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#popular-routes"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-sky-300/40 text-white hover:bg-white/10 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Routes</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Overlapping Search Widget */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 -mt-12">
        <SearchForm initialValues={searchParams} onSearch={handleSearch} />
      </section>

      {/* Popular Routes */}
      <section id="popular-routes" className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F294A]">Popular Tamil Nadu Routes</h2>
            <p className="text-sm text-slate-600 mt-1">
              Live scheduled corridors across major commercial and heritage hubs.
            </p>
          </div>
          <Link to="/search" className="text-sm font-semibold text-[#0284C7] hover:underline whitespace-nowrap">
            View all 38 district connections →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularRoutes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4 hover:border-[#0284C7] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                  <span className="tabular-nums">{route.distanceKm} km</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{route.estimatedDuration}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{route.scheduleCount ?? 0} active coaches</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F294A] mt-2">
                  {route.originDistrict} → {route.destinationDistrict}
                </h3>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Starting from</span>
                  <span className="font-mono text-lg font-bold text-[#0F294A] tabular-nums">
                    ₹{route.baseFare.toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickRoute(route.originDistrict, route.destinationDistrict)}
                  className="px-4 py-2 rounded-lg bg-[#E0F2FE] hover:bg-[#0284C7] text-[#0F294A] hover:text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Check Schedules
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bus Categories Showcase */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F294A]">Coach Categories Built for Highway Comfort</h2>
            <p className="text-sm text-slate-600 mt-2">
              Choose between multi-axle AC sleepers for overnight journeys or ergonomic executive seaters for daytime intercity travel.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
              <div className="h-52 overflow-hidden">
                <ImageWithFallback
                  src={BRAND_IMAGES.sleeperInterior}
                  alt="BlueLine Express AC Sleeper cabin interior"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">Overnight Coaches · Lower & Upper Decks</div>
                  <h3 className="text-lg font-bold text-[#0F294A] mt-1">AC Luxury Sleeper</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Private cushioned berths with reading lamps, charging ports, fresh linens, and climate-controlled cabins for overnight routes like Chennai–Madurai and Chennai–Tirunelveli.
                  </p>
                </div>
                <Link to="/search" className="text-sm font-semibold text-[#0284C7] hover:underline">
                  Book Sleeper Coach →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
              <div className="h-52 overflow-hidden">
                <ImageWithFallback
                  src={BRAND_IMAGES.seaterInterior}
                  alt="BlueLine Express Executive Seater interior"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">Daytime Shuttles · Pushback Recliners</div>
                  <h3 className="text-lg font-bold text-[#0F294A] mt-1">Executive AC Seater</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Wide calf-rest pushback seats with generous legroom and panoramic tinted glass, ideal for daytime corridors such as Chennai–Trichy and Coimbatore–Madurai.
                  </p>
                </div>
                <Link to="/search" className="text-sm font-semibold text-[#0284C7] hover:underline">
                  Book Seater Coach →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
              <div className="h-52 overflow-hidden">
                <ImageWithFallback
                  src={BRAND_IMAGES.tamilNaduDestination}
                  alt="Tamil Nadu coastal and heritage destinations"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">38 Districts · Heritage & Coastal Hubs</div>
                  <h3 className="text-lg font-bold text-[#0F294A] mt-1">Popular Destinations</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Seamless connections to Madurai, Coimbatore, Kanniyakumari, Thanjavur, Salem, Nilgiris, and Ramanathapuram with verified boarding points.
                  </p>
                </div>
                <Link to="/about" className="text-sm font-semibold text-[#0284C7] hover:underline">
                  Explore Network →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose & Travel Benefits */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F294A]">Why Choose BlueLine Express?</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every reservation is backed by real-time seat inventory locking, transparent refund tiers, and 24/7 highway dispatch supervision.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="font-mono text-2xl font-bold text-[#0F294A] tabular-nums">38</div>
                <div className="text-xs text-slate-600 mt-1">Tamil Nadu Districts Supported</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="font-mono text-2xl font-bold text-[#0284C7] tabular-nums">85%</div>
                <div className="text-xs text-slate-600 mt-1">Refund on Advance Cancellation</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <ShieldCheck className="w-5 h-5 text-[#0284C7]" />
              <h3 className="text-base font-bold text-[#0F294A]">01. Verified Safety & Sanitization</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Speed-governed multi-axle coaches inspected before every departure with verified driver rosters.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <TicketCheck className="w-5 h-5 text-[#0284C7]" />
              <h3 className="text-base font-bold text-[#0F294A]">02. Live Concurrency-Safe Seats</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Atomic database seat locking prevents double bookings on high-demand weekend routes.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <Clock className="w-5 h-5 text-[#0284C7]" />
              <h3 className="text-base font-bold text-[#0F294A]">03. Punctual Departures</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Scheduled highway departure windows with clear arrival estimates and boarding bay details.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <Sparkles className="w-5 h-5 text-[#0284C7]" />
              <h3 className="text-base font-bold text-[#0F294A]">04. Loyalty Rewards & Refunds</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Earn loyalty points on every confirmed ticket and track cancellations cleanly in Cancellation History.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="bg-[#E0F2FE]/50 border-t border-sky-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[#0F294A] mb-8">Trusted by Daily Commuters & Families</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Booked two lower sleeper berths from Chennai to Madurai for a family wedding. Seat selection was instant and the coach departed right at 21:15.',
                name: 'Karthik Rajendran',
                role: 'Software Engineer, Chennai',
              },
              {
                quote:
                  'Had to reschedule my Coimbatore trip last month. The dedicated cancellation page showed the exact 85% refund calculation and freed my seat immediately.',
                name: 'Priyadharshini Sundaram',
                role: 'Textile Merchandiser, Tiruppur',
              },
              {
                quote:
                  'The executive seater between Chennai and Trichy is spotless and comfortable. Downloading the e-ticket receipt took a single click.',
                name: 'Muthukumar Velusamy',
                role: 'Assistant Professor, Tiruchirappalli',
              },
            ].map((t) => (
              <blockquote key={t.name} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between gap-4">
                <p className="text-sm text-slate-700 leading-relaxed">“{t.quote}”</p>
                <footer className="pt-3 border-t border-slate-100">
                  <div className="text-sm font-bold text-[#0F294A]">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Support Strip */}
      <section className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HeadphonesIcon className="w-6 h-6 text-[#0284C7] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-[#0F294A]">Need help with a reservation or group charter?</h3>
              <p className="text-sm text-slate-600">
                Our Tamil Nadu travel support desk assists passengers 24/7 across all 38 districts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="px-5 py-2.5 rounded-lg bg-[#0F294A] hover:bg-[#163864] text-white text-sm font-semibold whitespace-nowrap"
            >
              Contact Support
            </Link>
            <Link
              to="/cancellations/new"
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold whitespace-nowrap"
            >
              Cancel a Ticket
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
