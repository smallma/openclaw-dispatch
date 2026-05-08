'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Job } from './KanbanBoard';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function KanbanColumn({ column, jobs, onMoveTo, onEditJob, onDeleteJob, onViewDetails }: { column: any, jobs: Job[], onMoveTo: (id: string, status: string) => void, onEditJob?: (job: Job) => void, onDeleteJob: (id: string) => void, onViewDetails?: (job: Job) => void }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const [expanded, setExpanded] = useState(true);

  return (
    <div 
      className={`min-w-full xl:min-w-[320px] xl:w-[320px] bg-slate-900/40 rounded-xl border border-slate-800/60 shadow-sm flex flex-col shrink-0 transition-all ${expanded ? 'flex-1' : ''}`}
    >
      <div 
        className="p-4 border-b border-slate-800 flex items-center justify-between cursor-pointer xl:cursor-default rounded-t-xl hover:bg-slate-800/30 xl:hover:bg-transparent"
        onClick={() => {
          // On mobile, tap header to collapse/expand
          const isMobile = window.innerWidth < 1280;
          if (isMobile) setExpanded(!expanded);
        }}
      >
        <div className="flex items-center gap-2">
          {React.cloneElement(column.icon, { className: 'w-5 h-5 text-slate-400' })}
          <h2 className="font-semibold text-slate-100">{column.title}</h2>
          <span className="ml-2 bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">
            {jobs.length}
          </span>
        </div>
        <div className="xl:hidden text-slate-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {expanded && (
        <div 
          ref={setNodeRef}
          className="p-3 flex flex-col gap-3 min-h-[150px] h-full bg-slate-900/20"
        >
          <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
            {jobs.map(job => (
              <TaskCard key={job.id} job={job} onMoveTo={onMoveTo} onEdit={() => onEditJob && onEditJob(job)} onDelete={() => onDeleteJob(job.id)} onViewDetails={() => onViewDetails && onViewDetails(job)} />
            ))}
          </SortableContext>
          {jobs.length === 0 && (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 py-10 border-2 border-dashed border-slate-800/50 rounded-lg">
              Drop tasks here
            </div>
          )}
        </div>
      )}
    </div>
  );
}