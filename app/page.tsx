'use client';

import useSWR from 'swr';
import CreateJobForm from './components/CreateJobForm';
import JobList, { Job } from './components/JobList';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function Dashboard() {
  const { data: jobs, error, mutate } = useSWR<Job[]>('/api/jobs', fetcher, {
    refreshInterval: 5000, // Optimize polling with SWR
  });

  const loading = !jobs && !error;
  const currentJobs = jobs || [];

  const handleJobCreated = () => {
    mutate();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 pb-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Openclaw Dashboard
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Monitor worker progress and schedule new tasks dynamically.</p>
          </div>
          <button 
            onClick={() => mutate()} 
            className="self-start md:self-auto text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-slate-700 shadow-md active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-8">
              <CreateJobForm onJobCreated={handleJobCreated} />
              <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Worker Endpoints</h3>
                <code className="text-xs text-slate-500 block break-all mb-1">GET /api/worker/next</code>
                <code className="text-xs text-slate-500 block break-all">PATCH /api/worker/[id]</code>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-slate-800/20 rounded-xl p-6 border border-slate-800 shadow-inner">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                Task Queue
                <span className="bg-indigo-600/20 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  {currentJobs.length} total
                </span>
              </h2>
              {loading ? (
                <div className="animate-pulse flex flex-col space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-800/80 rounded-lg border border-slate-700/50"></div>
                  ))}
                </div>
              ) : (
                <JobList jobs={currentJobs} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
