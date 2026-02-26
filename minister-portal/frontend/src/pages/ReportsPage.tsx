import { useState, useEffect } from 'react';
import api from '../services/api';
import { Download } from 'lucide-react';

export const ReportsPage = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports')
      .then(res => setReports(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = () => {
    // In a real app we'd trigger the download from the backend
    alert('PDF Export functional feature point');
  };

  const downloadExcel = () => {
    // In a real app we'd trigger the Excel export endpoint
    alert('Excel Download functional feature point');
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button onClick={downloadPDF} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </button>
          <button onClick={downloadExcel} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none">
            <Download className="h-4 w-4 mr-2" /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* District Wise Issues Simulation */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cases By Status</h3>
          <div className="space-y-4">
            {reports?.districtWise?.map((item: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                  <span className="text-sm font-medium text-gray-900">{item._count.id}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${Math.min(100, item._count.id * 10)}%` }}></div>
                </div>
              </div>
            ))}
            {(!reports?.districtWise || reports?.districtWise.length === 0) && (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </div>
        </div>

        {/* Officer Workload Simulation */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Officer Workload (Assignments)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports?.workload?.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono text-xs">{item.userId.substring(0, 8)}...</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{item._count.id}</td>
                  </tr>
                ))}
                {(!reports?.workload || reports?.workload.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-sm text-gray-500 text-center">No assignments found.</td>
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
