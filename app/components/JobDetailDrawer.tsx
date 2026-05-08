import React from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { X, Clock, TerminalSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Job } from './KanbanBoard';

type JobDetailDrawerProps = {
  job: Job | null;
  onClose: () => void;
};

export default function JobDetailDrawer({ job, onClose }: JobDetailDrawerProps) {
  if (!job) return null;

  const durationSecs = differenceInSeconds(new Date(job.updatedAt), new Date(job.createdAt));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full md:w-[600px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 truncate pr-4">{job.title || 'Untitled Job'}</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-700 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Status & ID */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-md border tracking-wider
              ${job.status === 'FAILED' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 
                job.status === 'DONE' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 
                'text-indigo-400 border-indigo-500/30 bg-indigo-500/10'}`
            }>
              {job.status}
            </span>
            <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded-md border border-slate-800/50">
              ID: {job.id}
            </span>
          </div>

          {/* Timeline */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-800/50 grid grid-cols-3 gap-4 text-sm text-slate-300 shadow-inner">
            <div className="flex flex-col gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Created
              </span>
              <span className="text-xs">{format(new Date(job.createdAt), 'MM/dd HH:mm:ss')}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated
              </span>
              <span className="text-xs">{format(new Date(job.updatedAt), 'MM/dd HH:mm:ss')}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Duration
              </span>
              <span className="text-xs">{durationSecs} sec</span>
            </div>
          </div>

          {/* Error Box */}
          {job.status === 'FAILED' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm shadow-lg shadow-red-500/5">
              <div className="flex items-center gap-2 mb-2 font-bold tracking-wide">
                <AlertCircle className="w-4 h-4" />
                Error Message
              </div>
              <div className="font-mono text-xs whitespace-pre-wrap break-words bg-red-950/50 p-3 rounded-md border border-red-500/20">
                {job.result || 'No exact error message recorded.'}
              </div>
            </div>
          )}

          {/* Result Box */}
          {job.status === 'DONE' && job.result && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-400 text-sm shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-2 mb-2 font-bold tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                Final Result
              </div>
              <div className="font-mono text-[11px] whitespace-pre-wrap break-words bg-emerald-950/50 p-3 rounded-md border border-emerald-500/20">
                {job.result}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Instructions</h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-4 rounded-lg border border-slate-800/50 shadow-inner">
              {job.instruction}
            </p>
          </div>

          {/* Logs Section */}
          <div className="flex flex-col h-[400px]">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <TerminalSquare className="w-4 h-4" />
              Live Execution Logs
            </h3>
            <div className="flex-1 bg-[#09090b] border border-slate-800 rounded-lg p-4 overflow-auto font-mono text-[11px] text-slate-300 antialiased leading-relaxed shadow-inner">
              {job.logs ? (
                <pre className="whitespace-pre-wrap break-words">{job.logs}</pre>
              ) : (
                <span className="text-slate-600 italic">No logs available at the moment...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}