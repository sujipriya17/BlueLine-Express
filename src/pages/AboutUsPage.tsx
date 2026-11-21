import { Award, CheckCircle2, HeadphonesIcon, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Navbar } from '../components/Navbar';
import { BRAND_IMAGES } from '../constants/tamilNaduDistricts';

export function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <section className="bg-[#0F294A] text-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-sm font-semibold text-sky-300">About BlueLine Express</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
                Connecting All 38 Districts of Tamil Nadu with Dependable Intercity Travel
              </h1>
              <p className="text-slate-200 leading-relaxed text-sm sm:text-base max-w-2xl">
                BlueLine Express is a dedicated Tamil Nadu passenger coach reservation platform built to bring punctual departures, transparent fares, verified safety protocols, and instant digital ticketing to every highway corridor.
              </p>
            </div>
            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-700 h-64">
              <ImageWithFallback
                src={BRAND_IMAGES.heroBus}
                alt="BlueLine Express intercity coach fleet"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-[#0F294A]">Our Mission</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To make intercity bus reservations across Tamil Nadu effortless, transparent, and trustworthy by pairing real-time seat inventory with disciplined fleet operations and straightforward cancellation rules.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-[#0F294A]">Our Vision</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To set the benchmark for regional highway mobility across South India through climate-controlled sleeper coaches, executive daytime shuttles, and seamless passenger-first digital service.
            </p>
          </div>
        </section>

        <section className="bg-white border-y border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 h-72">
              <ImageWithFallback
                src={BRAND_IMAGES.sleeperInterior}
                alt="BlueLine Express luxury sleeper interior"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl font-bold text-[#0F294A]">Passenger Safety & Travel Comfort</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'Pre-Trip Fleet Checks',
                    desc: 'Every coach undergoes brake, tire, and emergency exit inspection prior to boarding.',
                  },
                  {
                    icon: Award,
                    title: 'Sanitized Cabins',
                    desc: 'Fresh linens on sleeper berths and sanitized reclining seaters after each trip.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Zero Overbooking',
                    desc: 'Database-level seat locking prevents concurrent duplicate reservations.',
                  },
                  {
                    icon: HeadphonesIcon,
                    title: '24/7 Passenger Desk',
                    desc: 'Dedicated Chennai & Madurai control rooms supporting every active route.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                      <Icon className="w-5 h-5 text-[#0284C7]" />
                      <h3 className="font-bold text-[#0F294A]">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/search"
                  className="px-5 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold"
                >
                  Search Available Buses
                </Link>
                <Link
                  to="/contact"
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
