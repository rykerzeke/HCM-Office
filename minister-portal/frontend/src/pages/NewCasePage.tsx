import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, UserPlus, CheckCircle } from 'lucide-react';

const citizenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  aadhaar: z.string().optional(),
  address: z.string().optional(),
  districtId: z.string().optional(),
  stateId: z.string().optional(),
});

const caseSchema = z.object({
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  meetingDate: z.string().optional(),
});

export const NewCasePage = () => {
  const [step, setStep] = useState(1);
  const [searchPhone, setSearchPhone] = useState('');
  const [citizen, setCitizen] = useState<any>(null);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const citizenForm = useForm({ resolver: zodResolver(citizenSchema) });
  const caseForm = useForm({ resolver: zodResolver(caseSchema) });

  useEffect(() => {
    api.get('/states').then(res => setStates(res.data)).catch(console.error);
  }, []);

  const searchCitizen = async () => {
    if (!searchPhone) return;
    try {
      setLoading(true);
      const res = await api.get(`/citizens?search=${searchPhone}`);
      if (res.data.length > 0) {
        setCitizen(res.data[0]);
        setStep(2);
      } else {
        alert('Citizen not found. Please register new citizen.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onCitizenSubmit = async (data: any) => {
    try {
      setLoading(true);
      const res = await api.post('/citizens', data);
      setCitizen(res.data);
      setStep(2);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create citizen');
    } finally {
      setLoading(false);
    }
  };

  const onCaseSubmit = async (data: any) => {
    if (!citizen) return;
    try {
      setLoading(true);
      const payload = {
        citizenId: citizen.id,
        purpose: data.purpose,
        meetingDate: data.meetingDate || undefined
      };
      const res = await api.post('/cases', payload);
      navigate(`/cases/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Request / Case Intake</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100'}`}>1. Citizen Intro</span>
          <span className="text-gray-300">-</span>
          <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100'}`}>2. Case Details</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Search Existing */}
            <div className="space-y-4 border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
              <h3 className="text-lg font-medium flex items-center">
                <Search className="h-5 w-5 mr-2 text-gray-400" />
                Search Existing Citizen
              </h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Phone number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={searchPhone}
                  onChange={e => setSearchPhone(e.target.value)}
                />
                <button
                  onClick={searchCitizen}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Create New */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-gray-400" />
                Register New Citizen
              </h3>
              <form onSubmit={citizenForm.handleSubmit(onCitizenSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input {...citizenForm.register('name')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input {...citizenForm.register('phone')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aadhaar (Optional)</label>
                    <input {...citizenForm.register('aadhaar')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <select 
                      {...citizenForm.register('stateId')} 
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      onChange={async e => {
                        const val = e.target.value;
                        if(val) {
                          const res = await api.get(`/districts?stateId=${val}`);
                          setDistricts(res.data);
                        }
                      }}
                    >
                      <option value="">Select State...</option>
                      {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">District</label>
                    <select {...citizenForm.register('districtId')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                      <option value="">Select District...</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea {...citizenForm.register('address')} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Register & Continue
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 2 && citizen && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Citizen Selected</h4>
                <p className="text-sm text-green-700 mt-1">{citizen.name} ({citizen.phone})</p>
                <button onClick={() => setStep(1)} className="text-sm text-green-600 underline mt-2">Change Citizen</button>
              </div>
            </div>

            <form onSubmit={caseForm.handleSubmit(onCaseSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose of Visit / Request Description *</label>
                <textarea 
                  {...caseForm.register('purpose')} 
                  rows={4} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Detailed description of the citizen's request..."
                ></textarea>
                {caseForm.formState.errors.purpose && <p className="mt-1 text-sm text-red-600">{caseForm.formState.errors.purpose.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meeting Date (if applicable)</label>
                <input 
                  type="datetime-local" 
                  {...caseForm.register('meetingDate')} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" 
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {loading ? 'Creating...' : 'Create Case Record'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
