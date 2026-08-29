'use client';
import { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-white">Loading Analytics...</div>;
  if (!data) return <div className="p-10 text-white">Failed to load analytics.</div>;

  return (
    <div className="min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">FlowPay Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Unique Users</h3>
          <p className="text-3xl font-mono mt-2">{data.uniqueUsers}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Active Sessions</h3>
          <p className="text-3xl font-mono mt-2">{data.uniqueSessions}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Total Events</h3>
          <p className="text-3xl font-mono mt-2">{Object.values(data.totals).reduce((a: any,b: any) => a+b, 0) as number}</p>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Event Breakdown (Funnel)</h2>
        <div className="space-y-4">
          {Object.entries(data.totals)
            .sort((a: any, b: any) => b[1] - a[1])
            .map(([event, count]: any) => (
            <div key={event} className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-mono text-sm">{event}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
        <h2 className="text-xl font-semibold mb-4">Privacy & Data Policy</h2>
        <p className="text-sm text-gray-300">
          FlowPay analytics are completely privacy-preserving. We do NOT collect private keys, precise financial data, or sensitive PII. 
          Wallet addresses are optionally hashed. This dashboard tracks product usage conversions to ensure platform health.
        </p>
      </div>
    </div>
  );
}
