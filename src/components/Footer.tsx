import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlueLineLogo } from './BlueLineLogo';

export function Footer() {
  return (
    <footer className="bg-[#0F294A] text-slate-300 border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <BlueLineLogo variant="light" />
          <p className="text-sm text-slate-300 leading-relaxed">
            Your Journey, Our Priority. Intercity AC Sleeper and Executive Seater coach reservations connecting all 38 districts of Tamil Nadu.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Passenger Services</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/search" className="hover:text-white transition-colors">
                Search Buses
              </Link>
            </li>
            <li>
              <Link to="/my-bookings" className="hover:text-white transition-colors">
                My Bookings
              </Link>
            </li>
            <li>
              <Link to="/cancellations/new" className="hover:text-white transition-colors">
                Cancel Booking
              </Link>
            </li>
            <li>
              <Link to="/cancellations/history" className="hover:text-white transition-colors">
                Cancellation History
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Company & Portals</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact & Support
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-white transition-colors">
                Passenger Registration
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="hover:text-sky-300 transition-colors">
                Administrator Portal
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">24/7 Operations Desk</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>Koyambedu Omni Bus Terminus Bay 14, Chennai 600107</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="tabular-nums">+91 44 2479 5500</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <span>support@bluelineexpress.in</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} BlueLine Express Coach Services. All rights reserved.</p>
          <p>Tamil Nadu Intercity Reservation Platform · Academic Project Build</p>
        </div>
      </div>
    </footer>
  );
}
