'use client';
import { useState } from 'react';

export default function CreateJobForm({ onJobCreated }: { onJobCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, instruction }),
        credentials: 'include',
      });
      if (res.ok) {
        setTitle('');
        setInstruction('');
        onJobCreated();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-white">Create New Task</h2>
      <div className="mb-4">
        <label className="block text-slate-300 mb-2 text-sm">Title</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
          placeholder="E.g., Analyze user feedback"
        />
      </div>
      <div className="mb-4">
        <label className="block text-slate-300 mb-2 text-sm">Instruction (Prompt)</label>
        <textarea 
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          required
          rows={4}
          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
          placeholder="Give Openclaw specific instructions..."
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Task'}
      </button>
    </form>
  );
}
