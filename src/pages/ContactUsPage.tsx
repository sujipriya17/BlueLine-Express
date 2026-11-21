import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { useToast } from '../context/ToastContext';
import { api, extractApiError } from '../services/api';

export function ContactUsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmittedMsg('');

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please describe your inquiry in at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/contact', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubmittedMsg(res.data.message);
      showToast('Support inquiry submitted successfully.', 'success');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(extractApiError(err, 'Unable to send your message.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0F294A]">Contact & Customer Support</h1>
          <p className="text-sm text-slate-600 mt-1">
            Reach our 24/7 Tamil Nadu operations desk for booking assistance, lost-and-found queries, or feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <h2 className="text-lg font-bold text-[#0F294A]">Operations Headquarters</h2>
              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">Chennai Central Dispatch</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Bay 14, Koyambedu Omni Bus Terminus, Chennai, Tamil Nadu 600107
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900 tabular-nums">+91 44 2479 5500</div>
                    <div className="text-xs text-slate-500 mt-0.5">24/7 Passenger Helpline</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">support@bluelineexpress.in</div>
                    <div className="text-xs text-slate-500 mt-0.5">Average response time under 2 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#0F294A] mb-4">Send a Message</h2>

            {submittedMsg && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{submittedMsg}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Name
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
                <div>
                  <label htmlFor="c-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
                <div>
                  <label htmlFor="c-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject
                  </label>
                  <input
                    id="c-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Refund query or route feedback"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="c-message" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="c-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our support team help you?"
                  className="w-full p-3.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
