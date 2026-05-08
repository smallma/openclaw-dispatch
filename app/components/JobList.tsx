'use client';
import { useState } from 'react';

export type Job = {
  id: string;
  title: string;
  instruction: string;
  status: string;
  logs: string | null;
  result: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  Failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function JobList({ jobs }: { jobs: Job[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {jobs.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No tasks found.</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden transition-all">
            <div 
              className="p-4 cursor-pointer hover:bg-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
            >
              <div>
                <h3 className="text-lg font-medium text-white">{job.title}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="font-mono text-xs">{job.id.substring(0, 8)}</span> • {new Date(job.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`self-start sm:self-auto px-3 py-1 border rounded-full text-xs font-semibold uppercase tracking-wider ${statusColors[job.status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                {job.status}
              </span>
            </div>
            
            {expandedId === job.id && (
              <div className="p-4 border-t border-slate-700 bg-slate-900/30">
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Instruction</h4>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-950 p-3 rounded-md border border-slate-800">{job.instruction}</pre>
                </div>
                
                {job.logs && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Logs</h4>
                    <pre className="text-sm bg-gray-900 text-green-400 whitespace-pre-wrap font-mono p-4 rounded-md border border-gray-800 max-h-60 overflow-y-auto">
                      <code>{job.logs}</code>
                    </pre>
                  </div>
                )}

                {job.result && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Result</h4>
                    <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono bg-[#022c1b] p-3 rounded-md border border-[#045d39]">{job.result}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
