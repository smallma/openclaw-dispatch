'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { MoreVertical, Calendar, Clock, TerminalSquare, Settings2, Trash2, Edit2, Info } from 'lucide-react';
import { Job } from './KanbanBoard';

export default function TaskCard({ job, onMoveTo, onEdit, onDelete, onViewDetails, isOverlay = false }: { job: Job, onMoveTo: (id: string, s: string) => void, onEdit?: () => void, onDelete?: () => void, onViewDetails?: () => void, isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, disabled: isOverlay });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const style: React.CSSProperties = isOverlay ? {} : {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (menuOpen ? 40 : 1),
    opacity: isDragging ? 0.3 : 1,
  };

  const statusColors: Record<string, string> = {
    PENDING: 'border-slate-700 bg-slate-800/80 hover:bg-slate-700/80',
    TODO: 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30',
    DOING: 'border-indigo-500/50 bg-indigo-900/20 hover:bg-indigo-900/30',
    DONE: 'border-emerald-500/50 bg-emerald-900/20 hover:bg-emerald-900/30',
    FAILED: 'border-rose-500/50 bg-rose-900/20 hover:bg-rose-900/30',
    ROUTINE: 'border-amber-500/50 bg-amber-900/20 hover:bg-amber-900/30'
  };

  const colorClass = statusColors[job.status?.toUpperCase() || 'PENDING'];

  const timeLabel = job.scheduledAt 
    ? format(new Date(job.scheduledAt), 'MM/dd HH:mm') 
    : 'Immediate';

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`group relative p-4 rounded-xl border ${colorClass} shadow-sm backdrop-blur-sm transition-colors cursor-grab active:cursor-grabbing`}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-100 truncate pr-6">{job.title}</h3>
      </div>
      
      {/* Non-draggable menu trigger */}
      <div className="absolute top-3 right-2 flex gap-1">
        {onEdit && (
          <button 
            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-700/50 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        <div 
          ref={menuRef}
          onPointerDown={(e) => {
            e.stopPropagation(); // prevent drag
          }}
        >
          <button 
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute top-8 right-0 bg-slate-900 border border-slate-700 shadow-xl rounded-md p-1 min-w-[140px] z-50">
               <div className="text-xs font-semibold text-slate-500 px-2 py-1">Move to...</div>
               {['PENDING', 'TODO', 'ROUTINE'].map(s => (
                 <button 
                   key={s}
                   className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md"
                   onClick={() => {
                     onMoveTo(job.id, s);
                     setMenuOpen(false);
                   }}
                 >
                   {s === 'TODO' ? 'Wait to do' : s}
                 </button>
               ))}
               {onDelete && (
                 <>
                   <div className="h-px bg-slate-800 my-1"></div>
                   <button 
                     className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md flex items-center gap-2"
                     onClick={(e) => {
                       e.stopPropagation();
                       onDelete();
                       setMenuOpen(false);
                     }}
                   >
                     <Trash2 className="w-3 h-3" />
                     Delete
                   </button>
                 </>
               )}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-3">
        {job.instruction}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto">
        <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-950/50 px-2 py-1 rounded-md border border-slate-800/50">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>{timeLabel}</span>
        </div>
        {job.cronExpression && (
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-950/50 px-2 py-1 rounded-md border border-slate-800/50">
            <Settings2 className="w-3 h-3 text-amber-400" />
            <span>{job.cronExpression}</span>
          </div>
        )}
      </div>

      {job.result && (
        <div className="mt-3 text-xs bg-slate-950/80 p-2 rounded-md border border-slate-800/80 truncate text-slate-300">
          <TerminalSquare className="w-3 h-3 inline mr-1 text-slate-500"/>
          {job.result}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-800/50 flex justify-between items-center">
        <span className="text-[10px] text-slate-500 uppercase font-semibold">
          Updated: {format(new Date(job.updatedAt), 'MM/dd HH:mm')}
        </span>
        {onViewDetails && (
          <button 
            className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}