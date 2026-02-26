import { useState } from 'react';
import { Search, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';
import api from '../services/api';

export const TrackCasePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [caseData, setCaseData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // We temporarily use an authorized instance but in reality this would be 
  // a public unauthenticated endpoint. For demonstration we use the existing ones.
  // The system's rules state we should implement the front-end logic completely.
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    try {
      setLoading(true);
      setError('');
      setCaseData(null);
      
      const res = await api.get(`/cases`, { params: { search: searchQuery } });
      if (res.data.data.length > 0) {
        setCaseData(res.data.data[0]);
      } else {
        setError('No case found with this Case ID or Phone Number.');
      }
    } catch (err) {
      setError('Error retrieving case details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <ActivityIcon className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Track Your Request</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your generated Case ID (e.g. MO-2026-X) or registered Phone Number</p>
        </div>

        <div className="bg-white shadow rounded-lg px-6 py-8 border border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Case ID or Phone Number"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && <p className="mt-4 text-center text-red-600 text-sm">{error}</p>}
        </div>

        {caseData && (
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Case details for {caseData.caseId}</h3>
                <StatusBadge status={caseData.status} />
              </div>
            </div>
            <div className="px-6 py-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><UserIcon className="h-4 w-4 mr-2" /> Citizen Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{caseData.citizen?.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><Calendar className="h-4 w-4 mr-2" /> Submitted On</dt>
                  <dd className="mt-1 text-sm text-gray-900">{format(new Date(caseData.createdAt), 'MMMM do, yyyy')}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Request Purpose</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md line-clamp-3">{caseData.purpose}</dd>
                </div>
              </dl>
              
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Latest Status Tracking</h4>
                
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${caseData.status === 'COMPLETED' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {caseData.status === 'COMPLETED' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-blue-600" />}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Current status is <span className="font-medium text-gray-900">{caseData.status}</span>
                        </p>
                      </div>
                      <div className="text-right text-xs whitespace-nowrap text-gray-500">
                        <time dateTime={caseData.updatedAt}>{format(new Date(caseData.updatedAt), 'PP')}</time>
                      </div>
                    </div>
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

// Extracted icons
const ActivityIcon = (props:any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const UserIcon = (props:any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
