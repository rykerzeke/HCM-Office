import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, FolderSearch } from 'lucide-react';
import { format } from 'date-fns';

export const CaseListPage = () => {
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/cases', {
        params: { search, status, priority, category, page, limit: 10 }
      });
      setCases(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, category, page]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cases Directory</h1>
          <p className="text-sm text-surface-400 mt-1">Search, filter, and manage citizen requests</p>
        </div>
        <Link
          to="/cases/new"
          className="btn-primary inline-flex items-center gap-2 self-start icon-3d"
        >
          <Plus className="h-4 w-4" />
          Create New Case
        </Link>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500 icon-3d" />
            <input
              type="text"
              placeholder="Search by Case ID, Name, or Phone..."
              className="input-dark input-search w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="select-dark sm:w-44"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
            <option value="NO_SHOW">No Show</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="FOLLOW_UP_REQUIRED">Follow-up required</option>
            <option value="RESCHEDULE_REQUIRED">Reschedule required</option>
          </select>

          <select
            value={priority}
            onChange={e => { setPriority(e.target.value); setPage(1); }}
            className="select-dark sm:w-44"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="select-dark sm:w-44"
          >
            <option value="">All Categories</option>
            <option value="PUBLIC_GRIEVANCE">Public Grievance</option>
            <option value="POLICY_REQUEST">Policy Request</option>
            <option value="PERSONAL_ISSUE">Personal Issue</option>
            <option value="LAND_AND_REVENUE">Land & Revenue</option>
            <option value="CIVIC_ISSUE">Civic Issue</option>
            <option value="PENSION_AND_WELFARE">Pension & Welfare</option>
            <option value="OTHER">Other</option>
          </select>

          <button type="submit" className="btn-ghost inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Apply
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-dark">
            <thead>
              <tr>
                <th className="text-left">Case ID</th>
                <th className="text-left">Citizen</th>
                <th className="text-left">Purpose</th>
                <th className="text-left">Category</th>
                <th className="text-left">Status</th>
                <th className="text-left">Priority</th>
                <th className="text-left">Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-surface-500">
                      <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                      <span className="text-sm">Loading cases...</span>
                    </div>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <FolderSearch className="mx-auto h-10 w-10 text-surface-600 mb-3" />
                    <p className="text-surface-400 font-medium text-sm">No cases found</p>
                    <p className="text-surface-600 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono text-sm font-semibold text-primary-400">{c.caseId}</span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-white">{c.citizen?.name}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{c.citizen?.phone}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-surface-300 truncate max-w-xs" title={c.purpose}>{c.purpose}</p>
                    </td>
                    <td>
                      {c.category ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-surface-700 text-surface-300">
                          {c.category.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-surface-600">—</span>
                      )}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td>
                      <span className="text-sm text-surface-400">{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/cases/${c.id}`}
                        className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-surface-500">
              Showing <span className="text-surface-300 font-medium">{(meta.page - 1) * meta.limit + 1}</span>–<span className="text-surface-300 font-medium">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-surface-300 font-medium">{meta.total}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost px-3 py-2 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages || 1, p + 1))}
                disabled={page >= meta.totalPages}
                className="btn-ghost px-3 py-2 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
