import { ArrowLeft, Building2, CreditCard, ShieldAlert, Smartphone } from 'lucide-react';
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';
import type { Booking, PaymentMethod } from '../types';

export function PaymentPage() {
  const { selectedBus, selectedSeats, passengers, clearBookingFlow } = useBooking();
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('passenger@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 8910 2234 5678');
  const [bankName, setBankName] = useState('State Bank of India');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!selectedBus || selectedSeats.length === 0 || passengers.length === 0) {
    return <Navigate to="/search" replace />;
  }

  const totalFare = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      const res = await api.post<{ booking: Booking; message: string }>('/bookings', {
        busId: selectedBus.id,
        seatIds: selectedSeats.map((s) => s.id),
        passengers: passengers.map((p) => ({
          seatId: p.seatId,
          seatNumber: p.seatNumber,
          passengerName: p.passengerName,
          age: Number(p.age),
          gender: p.gender,
          contactPhone: p.contactPhone,
        })),
        paymentMethod,
        simulateFailure,
      });

      await refreshProfile();
      clearBookingFlow();
      showToast('Demo payment processed and ticket confirmed!', 'success');
      navigate(`/booking/confirmation/${res.data.booking.id}`, {
        state: { booking: res.data.booking },
        replace: true,
      });
    } catch (err) {
      const msg = extractApiError(err, 'Payment processing failed.');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/booking/passengers"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0284C7] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Passenger Details</span>
          </Link>
          <span className="text-xs font-medium text-slate-500">Step 3 of 3 · Simulated Payment Gateway</span>
        </div>

        {/* Academic Simulated Payment Disclosure */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-sm text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Simulated Payment Gateway (Academic Demonstration): </span>
            No real financial transaction or money transfer takes place. A booking is marked CONFIRMED only after this demo gateway succeeds.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handlePay} className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h1 className="text-xl font-bold text-[#0F294A]">Select Payment Method</h1>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'UPI' as const, label: 'UPI', icon: Smartphone },
                { id: 'DEBIT_CARD' as const, label: 'Debit Card', icon: CreditCard },
                { id: 'CREDIT_CARD' as const, label: 'Credit Card', icon: CreditCard },
                { id: 'NET_BANKING' as const, label: 'Net Banking', icon: Building2 },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-[#0284C7] bg-[#E0F2FE]/60 text-[#0F294A]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2 text-[#0284C7]" />
                    <div className="text-xs font-bold">{m.label}</div>
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'UPI' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Demo UPI ID</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>
            )}

            {(paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Demo Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expiry</label>
                  <input
                    type="text"
                    defaultValue="08/29"
                    required
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Demo CVV</label>
                  <input
                    type="password"
                    defaultValue="123"
                    maxLength={4}
                    required
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'NET_BANKING' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option>State Bank of India</option>
                  <option>Indian Bank</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600"
                />
                <span>Test simulated payment failure handling</span>
              </label>

              <button
                type="submit"
                disabled={processing}
                className="px-6 py-3 rounded-lg bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
              >
                {processing ? 'Processing Demo Payment...' : `Complete Demo Payment · ₹${totalFare.toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>

          <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0F294A] border-b border-slate-100 pb-3">Fare & Passenger Summary</h2>
            <div className="text-sm space-y-1">
              <div className="font-bold text-slate-900">{selectedBus.busName}</div>
              <div className="text-slate-600">
                {selectedBus.originDistrict} → {selectedBus.destinationDistrict}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {selectedBus.journeyDate} · {selectedBus.departureTime}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              {passengers.map((p) => (
                <div key={p.seatId} className="flex justify-between text-xs text-slate-700">
                  <span>
                    {p.passengerName} ({p.age}, {p.gender})
                  </span>
                  <span className="font-mono font-semibold">{p.seatNumber}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-[#0F294A]">
              <span>Payable Total</span>
              <span className="font-mono tabular-nums">₹{totalFare.toLocaleString('en-IN')}</span>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
