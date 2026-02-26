import { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, BarChart3, Users } from 'lucide-react';

export const ReportsPage = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports')
      .then(res => setReports(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-sm text-surface-400 mt-1">Insights on case resolution and workload</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost inline-flex items-center gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button className="btn-primary inline-flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cases by Status */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-4 w-4 text-primary-400" />
            <h3 className="text-base font-semibold text-white">Cases By Status</h3>
          </div>
          <div className="space-y-5">
            {reports?.districtWise?.map((item: any, i: number) => {
              const colors = ['bg-amber-500', 'bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-teal-500', 'bg-surface-500'];
              const bgColors = ['bg-amber-500/15', 'bg-blue-500/15', 'bg-rose-500/15', 'bg-emerald-500/15', 'bg-teal-500/15', 'bg-surface-500/15'];
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-surface-300">{item.status}</span>
                    <span className="text-sm font-bold text-white">{item._count.id}</span>
                  </div>
                  <div className={`w-full ${bgColors[i % bgColors.length]} rounded-full h-2`}>
                    <div className={`${colors[i % colors.length]} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, item._count.id * 10)}%` }} />
                  </div>
                </div>
              );
            })}
            {(!reports?.districtWise || reports?.districtWise.length === 0) && (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-8 w-8 text-surface-600 mb-2" />
                <p className="text-sm text-surface-500">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Workload */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-4 w-4 text-accent-cyan" />
            <h3 className="text-base font-semibold text-white">Officer Workload</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-dark">
              <thead>
                <tr>
                  <th className="text-left">User</th>
                  <th className="text-right">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {reports?.workload?.map((item: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <span className="text-sm font-mono text-surface-400">{item.userId.substring(0, 8)}...</span>
                    </td>
                    <td className="text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-xs font-bold">{item._count.id}</span>
                    </td>
                  </tr>
                ))}
                {(!reports?.workload || reports?.workload.length === 0) && (
                  <tr>
                    <td colSpan={2} className="text-center py-8">
                      <p className="text-sm text-surface-500">No assignments found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
