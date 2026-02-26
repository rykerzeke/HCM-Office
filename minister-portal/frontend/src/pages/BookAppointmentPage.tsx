import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import {
  CalendarDays,
  User,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Shield,
  Search,
  Sun,
  Moon,
  Clock,
  ArrowRight,
  SendHorizonal,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';

export const BookAppointmentPage = () => {
  const { theme, toggleTheme } = useTheme();

  // Booking form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [address, setAddress] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Reference data
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  // Tracking
  const [activeView, setActiveView] = useState<'book' | 'track'>('book');
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState<any[]>([]);
  const [trackError, setTrackError] = useState('');
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    api.get('/public/states').then(res => setStates(res.data)).catch(console.error);
  }, []);

  const fetchDistricts = useCallback(async () => {
    if (!stateId) { setDistricts([]); return; }
    try {
      const res = await api.get(`/public/districts?stateId=${stateId}`);
      setDistricts(res.data);
    } catch (err) { console.error(err); }
  }, [stateId]);

  useEffect(() => { fetchDistricts(); }, [fetchDistricts]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !purpose) return;
    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/public/book', {
        name, phone, aadhaar: aadhaar || undefined,
        address, stateId: stateId || undefined,
        districtId: districtId || undefined,
        purpose, preferredDate: preferredDate || undefined,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery) return;
    try {
      setTracking(true);
      setTrackError('');
      const res = await api.get('/public/track', { params: { query: trackQuery } });
      setTrackResults(res.data);
      if (res.data.length === 0) setTrackError('No cases found. Check your Case ID or phone number.');
    } catch {
      setTrackError('Unable to search. Please try again.');
    } finally {
      setTracking(false);
    }
  };

  const resetForm = () => {
    setName(''); setPhone(''); setAadhaar(''); setAddress('');
    setStateId(''); setDistrictId(''); setPurpose('');
    setPreferredDate(''); setResult(null); setError('');
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent-cyan/6 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 glass" style={{ borderBottom: '1px solid var(--divider)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center glow-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">MINISTER'S OFFICE</h1>
              <p className="text-[10px] text-primary-400 tracking-[0.15em] uppercase font-medium">Appointment Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl glass-light transition-all hover:scale-105" title="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-primary-400" />}
            </button>
            <a href="/login" className="btn-ghost text-sm">Admin Login</a>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            Book an Appointment
          </h2>
          <p className="mt-3 text-surface-400 max-w-xl mx-auto">
            Submit your request or track an existing appointment with the Minister's Office.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-10">
          <div className="glass rounded-xl p-1 inline-flex gap-1">
            <button
              onClick={() => setActiveView('book')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeView === 'book' ? 'btn-primary' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <CalendarDays className="h-4 w-4 inline mr-2 -mt-0.5" />
              Book Appointment
            </button>
            <button
              onClick={() => setActiveView('track')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeView === 'track' ? 'btn-primary' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <Search className="h-4 w-4 inline mr-2 -mt-0.5" />
              Track Status
            </button>
          </div>
        </div>

        {/* ── BOOKING FORM ── */}
        {activeView === 'book' && !result && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="glass rounded-2xl p-8">
              <form onSubmit={handleBooking} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium text-center">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Full Name *
                    </label>
                    <input className="input-dark w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Phone Number *
                    </label>
                    <input className="input-dark w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Aadhaar (Optional)</label>
                    <input className="input-dark w-full" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="12-digit Aadhaar number" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Address
                    </label>
                    <input className="input-dark w-full" value={address} onChange={e => setAddress(e.target.value)} placeholder="Your full address" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">State</label>
                    <select className="select-dark w-full" value={stateId} onChange={e => setStateId(e.target.value)}>
                      <option value="">Select state...</option>
                      {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">District</label>
                    <select className="select-dark w-full" value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!stateId}>
                      <option value="">Select district...</option>
                      {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Purpose of Visit *
                  </label>
                  <textarea
                    className="input-dark w-full"
                    rows={4}
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    placeholder="Describe your request in detail (minimum 10 characters)..."
                    required
                  />
                </div>

                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" /> Preferred Date
                  </label>
                  <input
                    type="datetime-local"
                    className="input-dark w-full"
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !name || !phone || !purpose}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="h-5 w-5" />
                      Submit Appointment Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {activeView === 'book' && result && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <div className="glass rounded-2xl p-10 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 glow-emerald">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">Appointment Request Submitted!</h3>
              <p className="text-sm text-surface-400">{result.message}</p>
              <div className="glass-accent rounded-xl px-8 py-4 inline-block">
                <p className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-1">Your Case ID</p>
                <p className="text-3xl font-bold font-mono text-primary-400">{result.caseId}</p>
              </div>
              <p className="text-xs text-surface-500">
                ⚠️ Save this Case ID — you'll need it to track your appointment status.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={resetForm} className="btn-ghost">
                  Submit Another
                </button>
                <button onClick={() => { setActiveView('track'); setTrackQuery(result.caseId); }} className="btn-primary inline-flex items-center gap-2">
                  Track Status <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TRACKING ── */}
        {activeView === 'track' && (
          <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
            <div className="glass rounded-2xl p-6">
              <form onSubmit={handleTrack} className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                  <input
                    type="text"
                    className="input-dark w-full pl-11 py-3"
                    placeholder="Enter Case ID (e.g. MO-2026-00001) or Phone Number"
                    value={trackQuery}
                    onChange={e => setTrackQuery(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={tracking || !trackQuery} className="btn-primary px-8">
                  {tracking ? 'Searching...' : 'Track'}
                </button>
              </form>
              {trackError && <p className="mt-4 text-center text-rose-400 text-sm">{trackError}</p>}
            </div>

            {trackResults.length > 0 && (
              <div className="space-y-4">
                {trackResults.map((c: any) => (
                  <div key={c.id} className="glass rounded-2xl overflow-hidden animate-fade-in">
                    <div className="px-6 py-5 glass-accent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderBottom: '1px solid var(--divider)' }}>
                      <div>
                        <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold">Case ID</p>
                        <p className="text-lg font-bold font-mono text-primary-400 mt-0.5">{c.caseId}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-light rounded-xl p-4">
                          <p className="text-xs text-surface-500 font-medium flex items-center gap-1.5"><User className="h-3 w-3" /> Citizen</p>
                          <p className="text-sm font-semibold mt-1">{c.citizen?.name}</p>
                        </div>
                        <div className="glass-light rounded-xl p-4">
                          <p className="text-xs text-surface-500 font-medium flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone</p>
                          <p className="text-sm font-semibold mt-1">{c.citizen?.phone}</p>
                        </div>
                        <div className="glass-light rounded-xl p-4">
                          <p className="text-xs text-surface-500 font-medium flex items-center gap-1.5"><Clock className="h-3 w-3" /> Submitted</p>
                          <p className="text-sm font-semibold mt-1">{format(new Date(c.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="glass-light rounded-xl p-4">
                        <p className="text-xs text-surface-500 font-medium flex items-center gap-1.5 mb-2"><FileText className="h-3 w-3" /> Purpose</p>
                        <p className="text-sm leading-relaxed">{c.purpose}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-xs text-surface-600">
        © {new Date().getFullYear()} Minister's Office Portal. All rights reserved.
      </footer>
    </div>
  );
};
