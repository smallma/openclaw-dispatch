'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { MoreVertical, Calendar, RotateCcw, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

export type Job = {
  id: string;
  title: string;
  instruction: string;
  status: string;
  scheduledAt?: string | null;
  cronExpression?: string | null;
  isTemplate: boolean;
  order: number;
  logs?: string | null;
  result?: string | null;
  createdAt: string;
  updatedAt: string;
};

type KanbanBoardProps = {
  jobs: Job[];
  onUpdateJob: (id: string, data: any) => Promise<void>;
  onEditJob: (job: Job) => void;
  onDeleteJob: (id: string) => Promise<void>;
};

const COLUMNS = [
  { id: 'PENDING', title: 'Pending', icon: <Clock className="w-4 h-4" /> },
  { id: 'TODO', title: 'Wait to do', icon: <Play className="w-4 h-4 opacity-50" /> },
  { id: 'DOING', title: 'Doing', icon: <Play className="w-4 h-4" /> },
  { id: 'DONE', title: 'Done', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'FAILED', title: 'Failed', icon: <XCircle className="w-4 h-4" /> },
  { id: 'ROUTINE', title: 'Routine (Template)', icon: <RotateCcw className="w-4 h-4" /> }
];

export default function KanbanBoard({ 
  jobs, 
  onUpdateJob,
  onEditJob,
  onDeleteJob
}: KanbanBoardProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = jobs.find(j => j.id === active.id);
    if (job) setActiveJob(job);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveJob(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeJob = jobs.find(j => j.id === activeId);

    if (!activeJob) return;

    // Check if dragging over a column container or another item
    const isOverColumn = COLUMNS.some(c => c.id === overId);
    let newStatus = activeJob.status;

    if (isOverColumn) {
      newStatus = String(overId);
    } else {
      const overJob = jobs.find(j => j.id === overId);
      if (overJob) {
        newStatus = overJob.status;
      }
    }

    // Only allow dropping into PENDING, TODO, or ROUTINE
    const allowedStatuses = ['PENDING', 'TODO', 'ROUTINE'];
    if (!allowedStatuses.includes(newStatus)) {
      return; // Do nothing if dropped into restricted columns
    }

    if (activeJob.status !== newStatus) {
      // optimistic UI or just trigger callback depending on your pattern
      // Because SWR revalidates, we can directly fire off the update:
      await onUpdateJob(String(activeId), { status: newStatus });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Desktop view (horizontal scroll) & Mobile view (vertical stack) handled by flex */}
      <div className="flex flex-col xl:flex-row gap-6 pb-4 overflow-x-auto w-full items-start min-h-[70vh]">
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => (j.status || 'PENDING').toUpperCase() === col.id).sort((a, b) => a.order - b.order);
          return (
            <KanbanColumn 
              key={col.id} 
              column={col} 
              jobs={colJobs} 
              onMoveTo={(id, status) => onUpdateJob(id, { status })}
              onEditJob={onEditJob}
              onDeleteJob={onDeleteJob}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: 'ease-out' }}>
        {activeJob ? (
          <div className="opacity-80 rotate-2 scale-105">
             <TaskCard job={activeJob} onMoveTo={() => {}} isOverlay={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}