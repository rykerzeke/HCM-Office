import { useState } from 'react';
import { Search, Calendar, CheckCircle, Clock, MapPin, User } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';
import api from '../services/api';

export const TrackCasePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [caseData, setCaseData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    try {
      setLoading(true);
      setError('');
      setCaseData(null);

      const res = await api.get('/cases', { params: { search: searchQuery } });
      if (res.data.data.length > 0) {
        setCaseData(res.data.data[0]);
      } else {
        setError('No case found with this Case ID or Phone Number.');
      }
    } catch {
      setError('Error retrieving case details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Background Orbs */}
      <div className="fixed top-1/3 left-1/3 w-96 h-96 bg-primary-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/3 w-80 h-80 bg-accent-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-8 animate-fade-in relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-primary-500/20 border border-accent-cyan/20 mb-5">
            <Search className="h-7 w-7 text-accent-cyan" />
          </div>
          <h2 className="text-3xl font-bold text-white">Track Your Request</h2>
          <p className="mt-2 text-sm text-surface-400">Enter your Case ID or Phone Number</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500 icon-3d" />
              <input
                type="text"
                className="input-dark input-search w-full py-3"
                placeholder="MO-2026-XXXXX or Phone Number"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading || !searchQuery} className="btn-primary px-8 icon-3d">
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
          {error && <p className="mt-4 text-center text-rose-400 text-sm">{error}</p>}
        </div>

        {caseData && (
          <div className="glass rounded-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center glass-accent">
              <div>
                <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Case ID</p>
                <h3 className="text-lg font-bold font-mono text-primary-400 mt-0.5">{caseData.caseId}</h3>
              </div>
              <StatusBadge status={caseData.status} />
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-light rounded-xl p-4">
                  <p className="text-xs text-surface-500 font-medium flex items-center gap-1.5"><User className="h-3 w-3" /> Citizen</p>
                  <p className="text-sm text-white font-semibold mt-1">{caseData.citizen?.name}</p>
                </div>
                <div className="glass-light rounded-xl p-4">
                  <p className="text-xs text-surface-500 font-medium flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Submitted</p>
                  <p className="text-sm text-white font-semibold mt-1">{format(new Date(caseData.createdAt), 'MMMM do, yyyy')}</p>
                </div>
              </div>

              <div className="glass-light rounded-xl p-4">
                <p className="text-xs text-surface-500 font-medium flex items-center gap-1.5 mb-2"><MapPin className="h-3 w-3" /> Request Purpose</p>
                <p className="text-sm text-surface-200 leading-relaxed">{caseData.purpose}</p>
              </div>

              {/* Status Timeline */}
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">Status</h4>
                <div className="relative pl-8">
                  <span className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface-900 ${
                    caseData.status === 'COMPLETED' ? 'bg-emerald-500/20' : 'bg-primary-500/20'
                  }`}>
                    {caseData.status === 'COMPLETED'
                      ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      : <Clock className="h-3.5 w-3.5 text-primary-400" />
                    }
                  </span>
                  <div>
                    <p className="text-sm text-surface-300">
                      Current status: <span className="font-semibold text-white">{caseData.status}</span>
                    </p>
                    <p className="text-xs text-surface-500 mt-1">Last updated {format(new Date(caseData.updatedAt), 'PP')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
