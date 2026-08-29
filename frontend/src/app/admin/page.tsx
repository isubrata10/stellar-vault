'use client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/onboarding').then(r => r.json()),
      fetch('/api/feedback').then(r => r.json())
    ]).then(([uRes, fRes]) => {
      if (uRes.success) setUsers(uRes.data);
      if (fRes.success) setFeedback(fRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-white">Loading Admin...</div>;

  return (
    <div className="min-h-screen p-8 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin / Real-User Onboarding</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Total Onboarded Users</h3>
          <p className="text-4xl font-mono mt-2">{users.length}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Active Wallet Interactions</h3>
          <p className="text-4xl font-mono mt-2">{users.filter((u: any) => u.hasConnected).length}</p>
        </div>
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h3 className="text-gray-400 text-sm">Feedback Responses</h3>
          <p className="text-4xl font-mono mt-2">{feedback.length}</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">User Progress</h2>
        <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Connected</th>
                <th className="py-3 px-4">Created Pay</th>
                <th className="py-3 px-4">Accepted Pay</th>
                <th className="py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.address} className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-gray-300">{u.address.substring(0,6)}...{u.address.substring(u.address.length-4)}</td>
                  <td className="py-3 px-4">{u.hasConnected ? '✅' : '❌'}</td>
                  <td className="py-3 px-4">{u.hasCreated ? '✅' : '❌'}</td>
                  <td className="py-3 px-4">{u.hasAccepted ? '✅' : '❌'}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(u.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Feedback Submissions</h2>
        <div className="grid gap-4">
          {feedback.map((f: any) => (
            <div key={f.id} className="p-4 bg-black/20 border border-white/10 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Rating: {f.rating}/5</span>
                <span className="text-xs text-gray-500">{new Date(f.timestamp).toLocaleString()}</span>
              </div>
              {f.liked && <p className="text-sm mt-2"><strong className="text-green-400">Liked:</strong> {f.liked}</p>}
              {f.confused && <p className="text-sm mt-1"><strong className="text-orange-400">Confused:</strong> {f.confused}</p>}
              {f.bugs && <p className="text-sm mt-1"><strong className="text-red-400">Bugs:</strong> {f.bugs}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
