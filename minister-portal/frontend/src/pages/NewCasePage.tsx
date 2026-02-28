import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/icons';
import { SearchableStateSelect } from '../components/SearchableStateSelect';

// Fallback options when API is unavailable (must match backend enums)
const DEFAULT_REFERRING_OFFICERS: { id: string; name: string }[] = [
  { id: 'VISHAL_GUPTA', name: 'Vishal Gupta' },
  { id: 'MAHENDRA_PRATAP_SINGH', name: 'Mahendra Pratap Singh' },
  { id: 'CHIRAG_PANCHAL', name: 'Chirag Panchal' },
];
const DEFAULT_REFERENCE_MODES: { id: string; name: string }[] = [
  { id: 'CALL', name: 'Call' },
  { id: 'EMAIL', name: 'Email' },
  { id: 'WRITTEN', name: 'Written' },
  { id: 'IN_PERSON', name: 'In-person' },
];

export const NewCasePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [citizen, setCitizen] = useState<any>(null);

  // Citizen form
  const [phoneSearch, setPhoneSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [address, setAddress] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Reference data
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [formError, setFormError] = useState('');

  // Case
  const [purpose, setPurpose] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [referringOfficer, setReferringOfficer] = useState('');
  const [referenceMode, setReferenceMode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  // Minister Meeting Workflow: referring officers & reference modes
  const [referringOfficers, setReferringOfficers] = useState<{ id: string; name: string }[]>(DEFAULT_REFERRING_OFFICERS);
  const [referenceModes, setReferenceModes] = useState<{ id: string; name: string }[]>(DEFAULT_REFERENCE_MODES);

  useEffect(() => {
    api.get('/states').then(res => setStates(res.data)).catch(console.error);
    api.get('/referring-officers')
      .then(res => setReferringOfficers(Array.isArray(res.data) ? res.data : DEFAULT_REFERRING_OFFICERS))
      .catch(() => setReferringOfficers(DEFAULT_REFERRING_OFFICERS));
    api.get('/reference-modes')
      .then(res => setReferenceModes(Array.isArray(res.data) ? res.data : DEFAULT_REFERENCE_MODES))
      .catch(() => setReferenceModes(DEFAULT_REFERENCE_MODES));
  }, []);

  const fetchDistricts = useCallback(async () => {
    if (!stateId) return;
    try {
      const res = await api.get(`/districts?stateId=${stateId}`);
      setDistricts(res.data);
    } catch (err) { console.error(err); }
  }, [stateId]);

  useEffect(() => { fetchDistricts(); }, [fetchDistricts]);

  const handlePhoneSearch = async () => {
    if (!phoneSearch) return;
    try {
      const res = await api.get('/citizens', { params: { search: phoneSearch } });
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const selectCitizen = (c: any) => {
    setCitizen(c);
    setStep(2);
  };

  const createCitizen = async () => {
    setFormError('');
    if (!name.trim() || !phone.trim()) {
      setFormError('Name and phone are required.');
      return;
    }
    if (phone.length < 10) {
      setFormError('Phone must be at least 10 digits.');
      return;
    }
    try {
      const res = await api.post('/citizens', {
        name: name.trim(), phone: phone.trim(), aadhaar: aadhaar || undefined, address: address || undefined, stateId: stateId || undefined, districtId: districtId || undefined
      });
      setCitizen(res.data);
      setStep(2);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to register citizen. Please try again.');
    }
  };

  const createCase = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setFormError('');
    if (!citizen?.id) {
      setFormError('Please select or register a citizen first.');
      return;
    }
    if (!purpose.trim()) {
      setFormError('Purpose of visit is required.');
      return;
    }
    if (purpose.trim().length < 10) {
      setFormError('Purpose must be at least 10 characters.');
      return;
    }
    if (!referringOfficer) {
      setFormError('Referring officer is required.');
      return;
    }
    if (!referenceMode) {
      setFormError('Mode of reference is required.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/cases', {
        citizenId: citizen.id,
        purpose: purpose.trim(),
        meetingDate: meetingDate || undefined,
        category: category || undefined,
        priority: priority || undefined,
        referringOfficer,
        referenceMode,
      });
      setCreatedCaseId(res.data.caseId);
      setStep(3);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.details || 'Failed to submit case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">New Case Intake</h1>
        <p className="text-sm text-surface-400 mt-1">Register a new citizen request in {step === 3 ? '3' : step} of 3 steps</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
              s <= step ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white glow-primary' : 'glass-light text-surface-500'
            }`}>
              {s < step ? <Icons.CheckCircle className="h-4 w-4" /> : s}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${s <= step ? 'text-white' : 'text-surface-600'}`}>
              {s === 1 ? 'Citizen' : s === 2 ? 'Details' : 'Done'}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 rounded-full ${s < step ? 'bg-primary-500' : 'bg-surface-800'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Citizen */}
      {step === 1 && (
        <div className="glass rounded-2xl p-8 space-y-8">
          {/* Search existing */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Search className="h-4 w-4 text-primary-400" /> Search Existing Citizen
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500 icon-3d" />
                <input
                  type="text"
                  className="input-dark input-search w-full"
                  placeholder="Enter phone number..."
                  value={phoneSearch}
                  onChange={e => setPhoneSearch(e.target.value)}
                />
              </div>
              <button type="button" onClick={handlePhoneSearch} className="btn-ghost icon-3d">Search</button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => selectCitizen(c)}
                    className="w-full text-left glass-light rounded-xl p-4 hover:border-primary-500/30 transition-colors"
                  >
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-surface-400">{c.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-surface-800" />
            <span className="text-xs text-surface-600 font-medium">OR REGISTER NEW</span>
            <div className="flex-1 h-px bg-surface-800" />
          </div>

          {/* New Citizen Form */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Icons.UserPlus className="h-4 w-4 text-primary-400" /> Register New Citizen
            </h3>
            {formError && step === 1 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Full Name *</label>
                <input className="input-dark w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Phone *</label>
                <input className="input-dark w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Aadhaar (Optional)</label>
                <input className="input-dark w-full" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="12-digit Aadhaar" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Address</label>
                <input className="input-dark w-full" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">State</label>
                <SearchableStateSelect
                  value={stateId}
                  onChange={setStateId}
                  options={states.map((s: any) => ({ id: s.id, name: s.name }))}
                  placeholder="Select state..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">District</label>
                <select className="select-dark w-full" value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!stateId}>
                  <option value="">Select district...</option>
                  {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={createCitizen}
              disabled={!name || !phone}
              className="btn-primary inline-flex items-center gap-2"
            >
              Register & Continue <Icons.ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Case Details */}
      {step === 2 && (
        <div className="glass rounded-2xl p-8 space-y-6">
          <div className="glass-accent rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-bold">
              {citizen?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{citizen?.name}</p>
              <p className="text-xs text-surface-400">{citizen?.phone}</p>
            </div>
          </div>

          {formError && step === 2 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Category (Optional)</label>
              <select className="select-dark w-full" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select category...</option>
                <option value="PUBLIC_GRIEVANCE">Public Grievance</option>
                <option value="POLICY_REQUEST">Policy Request</option>
                <option value="PERSONAL_ISSUE">Personal Issue</option>
                <option value="LAND_AND_REVENUE">Land & Revenue</option>
                <option value="CIVIC_ISSUE">Civic Issue</option>
                <option value="PENSION_AND_WELFARE">Pension & Welfare</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Priority</label>
              <select className="select-dark w-full" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Referring Officer *</label>
              <select
                className="select-dark w-full"
                value={referringOfficer}
                onChange={e => setReferringOfficer(e.target.value)}
              >
                <option value="">Select referring officer...</option>
                {referringOfficers.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Mode of Reference *</label>
              <select
                className="select-dark w-full"
                value={referenceMode}
                onChange={e => setReferenceMode(e.target.value)}
              >
                <option value="">Select mode...</option>
                {referenceModes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Purpose of Visit *</label>
            <textarea
              className="input-dark w-full"
              rows={4}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Describe the citizen's request in detail (min 10 characters)..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Meeting Date (Optional)</label>
            <input
              type="datetime-local"
              className="input-dark w-full"
              value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setStep(1)} className="btn-ghost inline-flex items-center gap-2">
              <Icons.ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={(e) => createCase(e)}
              disabled={!purpose.trim() || purpose.trim().length < 10 || !referringOfficer || !referenceMode || submitting}
              className="btn-primary inline-flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Case'}
              <Icons.FilePlus2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="glass rounded-2xl p-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 glow-emerald">
            <Icons.CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Case Created Successfully</h2>
            <p className="text-sm text-surface-400 mt-2">The case has been registered and assigned an ID</p>
          </div>
          <div className="inline-block glass-accent rounded-xl px-8 py-4">
            <p className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-1">Case ID</p>
            <p className="text-2xl font-bold font-mono text-primary-400">{createdCaseId}</p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button onClick={() => { setStep(1); setCitizen(null); setPurpose(''); setMeetingDate(''); setCategory(''); setPriority('MEDIUM'); setReferringOfficer(''); setReferenceMode(''); setCreatedCaseId(null); setName(''); setPhone(''); }} className="btn-ghost">
              Create Another
            </button>
            <button onClick={() => navigate('/cases')} className="btn-primary">
              View All Cases
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
