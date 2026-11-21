import { ArrowLeft, ArrowRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import type { Gender, PassengerDetailInput } from '../types';

export function PassengerDetailsPage() {
  const { user } = useAuth();
  const { selectedBus, selectedSeats, passengers, setPassengers } = useBooking();
  const navigate = useNavigate();

  const [forms, setForms] = useState<PassengerDetailInput[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedSeats.length === 0) return;
    if (passengers.length === selectedSeats.length) {
      setForms(passengers);
      return;
    }
    setForms(
      selectedSeats.map((seat, idx) => ({
        seatId: seat.id,
        seatNumber: seat.seatNumber,
        passengerName: idx === 0 && user ? user.fullName : '',
        age: '',
        gender: 'MALE',
        contactPhone: idx === 0 && user ? user.phone : '',
      }))
    );
  }, [selectedSeats, passengers, user]);

  if (!selectedBus || selectedSeats.length === 0) {
    return <Navigate to="/search" replace />;
  }

  const totalFare = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  const updateField = (index: number, field: keyof PassengerDetailInput, value: string | number) => {
    setForms((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < forms.length; i++) {
      const p = forms[i];
      if (!p.passengerName || p.passengerName.trim().length < 2) {
        setError(`Passenger ${i + 1} (Seat ${p.seatNumber}): Please enter a valid full name.`);
        return;
      }
      const ageNum = Number(p.age);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        setError(`Passenger ${i + 1} (Seat ${p.seatNumber}): Age must be between 1 and 120.`);
        return;
      }
      if (!/^[6-9]\d{9}$/.test(p.contactPhone.trim())) {
        setError(`Passenger ${i + 1} (Seat ${p.seatNumber}): Enter a valid 10-digit Indian mobile number.`);
        return;
      }
    }

    setPassengers(forms);
    navigate('/booking/payment');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/buses/${selectedBus.id}/seats`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0284C7] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Modify Seat Selection</span>
          </Link>
          <span className="text-xs font-medium text-slate-500">Step 2 of 3 · Passenger Details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h1 className="text-xl font-bold text-[#0F294A]">Passenger Manifest</h1>
              <p className="text-sm text-slate-600 mt-1">
                Enter accurate details for each reserved seat. These appear on your e-ticket receipt.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            {forms.map((form, idx) => (
              <div key={form.seatId} className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#0F294A]">Passenger {idx + 1}</h2>
                  <span className="font-mono text-xs font-bold text-[#0284C7] bg-[#E0F2FE] px-2.5 py-1 rounded-md">
                    Assigned Seat: {form.seatNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Passenger Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.passengerName}
                      onChange={(e) => updateField(idx, 'passengerName', e.target.value)}
                      placeholder="Full name as per ID"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={form.age}
                      onChange={(e) => updateField(idx, 'age', e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Years"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => updateField(idx, 'gender', e.target.value as Gender)}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={form.contactPhone}
                      onChange={(e) => updateField(idx, 'contactPhone', e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 sticky top-24">
            <h2 className="text-lg font-bold text-[#0F294A] border-b border-slate-100 pb-3">Booking Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="font-bold text-slate-900">{selectedBus.busName}</div>
              <div className="text-slate-600">
                {selectedBus.originDistrict} → {selectedBus.destinationDistrict}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {selectedBus.journeyDate} · {selectedBus.departureTime} → {selectedBus.arrivalTime}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Passengers</span>
                <span className="font-semibold tabular-nums">{selectedSeats.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Seats</span>
                <span className="font-mono font-semibold">{selectedSeats.map((s) => s.seatNumber).join(', ')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold text-[#0F294A]">
                <span>Total Fare</span>
                <span className="font-mono tabular-nums">₹{totalFare.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
