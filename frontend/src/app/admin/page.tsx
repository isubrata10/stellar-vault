'use client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/onboarding').then(r => r.json()),
      fetch('/api/validation-feedback').then(r => r.json())
    ]).then(([uRes, fRes]) => {
      if (uRes.success) setUsers(uRes.data);
      if (fRes.success) setFeedback(fRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-white">Loading Validation Dashboard...</div>;

  return (
    <div className="min-h-screen p-8 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">User Validation Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Total Testers</h3>
          <p className="text-4xl font-mono mt-2">{users.length}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Completed Script (Released)</h3>
          <p className="text-4xl font-mono mt-2">{users.filter((u: any) => u.hasReleased).length}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Validation Responses</h3>
          <p className="text-4xl font-mono mt-2">{feedback.length}</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Feedback Forms</h2>
        <div className="grid gap-4">
          {feedback.map((f: any) => (
            <div key={f.id} className="p-4 bg-black/20 border border-white/10 rounded-xl space-y-2">
              <div className="flex justify-between mb-2 pb-2 border-b border-white/10">
                <span className="font-bold">Recommendation: {f.recommend ? 'Yes ✅' : 'No ❌'} | Use Again: {f.useAgain ? 'Yes ✅' : 'No ❌'}</span>
                <span className="text-xs text-gray-500">{new Date(f.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm"><strong className="text-orange-400">Confusing:</strong> {f.confusing}</p>
              <p className="text-sm"><strong className="text-blue-400">Expected:</strong> {f.expected}</p>
              <p className="text-sm"><strong className="text-green-400">Liked:</strong> {f.liked}</p>
              <p className="text-sm"><strong className="text-yellow-400">Would Change:</strong> {f.wouldChange}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
