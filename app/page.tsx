'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus } from 'lucide-react';
import CreateJobForm from './components/CreateJobForm';
import KanbanBoard, { Job } from './components/KanbanBoard';
import JobDetailDrawer from './components/JobDetailDrawer';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function Dashboard() {
  const { data: jobs, error, mutate } = useSWR<Job[]>('/api/jobs', fetcher, {
    refreshInterval: 5000, // Optimize polling with SWR
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [inspectingJobId, setInspectingJobId] = useState<string | null>(null);

  const loading = !jobs && !error;
  const currentJobs = jobs || [];

  const inspectingJob = currentJobs.find((j) => j.id === inspectingJobId) || null;

  const handleUpdateJob = async (id: string, data: any) => {
    // Optimistic fallback or just simple fetch
    try {
      await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      // revalidate
      mutate();
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await fetch(`/api/jobs/${id}`, {
        method: 'DELETE'
      });
      mutate();
    } catch(err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 py-4 md:py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Openclaw Dispatch
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 hidden md:block">
              Kanban control center for Openclaw tasks
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => mutate()} 
              className="text-xs md:text-sm bg-slate-800/80 hover:bg-slate-700 px-3 py-2 rounded-lg transition-all flex items-center gap-2 border border-slate-700 shadow-sm active:scale-95 text-slate-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden md:inline">Refresh</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-xs md:text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Board Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col">
        {loading ? (
          <div className="animate-pulse flex flex-col md:flex-row gap-6 h-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1 h-full min-h-[300px] bg-slate-800/20 rounded-xl border border-slate-800/50"></div>
            ))}
          </div>
        ) : (
          <KanbanBoard 
            jobs={currentJobs} 
            onUpdateJob={handleUpdateJob} 
            onEditJob={handleEditJob} 
            onDeleteJob={handleDeleteJob} 
            onViewDetails={(job) => setInspectingJobId(job.id)}
          />
        )}
      </div>

      <CreateJobForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onJobCreated={() => mutate()} 
        editingJob={editingJob}
      />

      <JobDetailDrawer 
        job={inspectingJob} 
        onClose={() => setInspectingJobId(null)} 
      />
      
      {/* Mobile Floating Action Button (Alternative) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 shadow-xl shadow-indigo-500/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </main>
  );
}