import { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Activity, Clock, Users, CheckCircle } from 'lucide-react';

export const DashboardPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Activity className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.stats?.totalRequests || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.stats?.pendingTasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.stats?.completedTasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Escalations</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.stats?.escalations || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {stats?.recentUpdates?.length === 0 && (
            <li className="px-6 py-4 text-gray-500 text-sm">No recent activity found.</li>
          )}
          {stats?.recentUpdates?.map((log: any) => (
            <li key={log.id} className="px-6 py-4">
              <div className="flex space-x-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {log.user?.name || 'System'}
                      <span className="font-normal text-gray-500 mx-2">performed</span>
                      <span className="font-mono text-xs bg-gray-100 px-1 rounded">{log.action}</span>
                    </h3>
                    <p className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Case ID: <span className="font-medium text-gray-900">{log.case?.caseId || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
