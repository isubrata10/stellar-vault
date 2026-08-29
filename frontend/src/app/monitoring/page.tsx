'use client';
import { useEffect, useState } from 'react';
import { logEvent } from '@/lib/logger';

export default function MonitoringDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    fetch('/api/monitoring')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleTestError = async () => {
    await logEvent('error', 'frontend', 'Simulated frontend exception for monitoring verification', { userAgent: navigator.userAgent });
    fetchLogs();
  };

  if (loading && !data) return <div className="p-10 text-white">Loading Monitoring...</div>;
  if (!data) return <div className="p-10 text-white">Failed to load monitoring data.</div>;

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">FlowPay Operations Center</h1>
        <button onClick={handleTestError} className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg hover:bg-red-500/30 transition">
          Trigger Test Error
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border bg-black/20 border-red-500/30 backdrop-blur-md">
          <h3 className="text-red-400 text-sm">System Errors</h3>
          <p className="text-3xl font-mono mt-2">{data.stats.errors}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-orange-500/30 backdrop-blur-md">
          <h3 className="text-orange-400 text-sm">Blockchain Failures</h3>
          <p className="text-3xl font-mono mt-2">{data.stats.blockchainFailures}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-red-900/50 backdrop-blur-md">
          <h3 className="text-red-600 text-sm">Fatal Crashes</h3>
          <p className="text-3xl font-mono mt-2">{data.stats.fatals}</p>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md mb-8 overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">Live System Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="py-2 px-4">Level</th>
                <th className="py-2 px-4">Context</th>
                <th className="py-2 px-4">Message</th>
                <th className="py-2 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log: any) => (
                <tr key={log.id} className="border-b border-white/5 text-sm hover:bg-white/5">
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${log.level === 'error' ? 'bg-red-500/20 text-red-400' : log.level === 'warn' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-4 font-mono text-gray-300">{log.context}</td>
                  <td className="py-2 px-4">{log.message}</td>
                  <td className="py-2 px-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {data.logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No logs found. System is healthy.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
