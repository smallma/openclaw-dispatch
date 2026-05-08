'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Settings2 } from 'lucide-react';
import cronstrue from 'cronstrue';
import { Job } from './KanbanBoard';

export default function CreateJobForm({ 
  onJobCreated, 
  isOpen, 
  onClose,
  editingJob = null
}: { 
  onJobCreated: () => void, 
  isOpen: boolean, 
  onClose: () => void,
  editingJob?: Job | null
}) {
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Cron state
  const [repeatMode, setRepeatMode] = useState<'preset' | 'custom'>('preset');
  const [presetCron, setPresetCron] = useState('');
  const [customValue, setCustomValue] = useState(1);
  const [customUnit, setCustomUnit] = useState('days');
  const [customTime, setCustomTime] = useState('09:00');

  const getCronExpression = () => {
    if (repeatMode === 'preset') return presetCron;
    
    // Custom builder
    if (customUnit === 'minutes') return `*/${Math.max(1, customValue)} * * * *`;
    if (customUnit === 'hours') return `0 */${Math.max(1, customValue)} * * *`;
    if (customUnit === 'days') {
      const [h, m] = customTime.split(':');
      return `${parseInt(m || '0')} ${parseInt(h || '9')} */${Math.max(1, customValue)} * *`;
    }
    return '';
  };

  const cronExpression = getCronExpression();

  useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        setTitle(editingJob.title || '');
        setInstruction(editingJob.instruction || '');
        if (editingJob.scheduledAt) {
          const date = new Date(editingJob.scheduledAt);
          setScheduledAt(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        } else {
          setScheduledAt('');
        }
        
        // Simple logic to parse back preset vs custom
        const existingCron = editingJob.cronExpression || '';
        if (['', '0 * * * *', '0 9 * * *', '0 18 * * *', '0 9 * * 1', '0 9 * * 1-5'].includes(existingCron)) {
          setRepeatMode('preset');
          setPresetCron(existingCron);
        } else {
          setRepeatMode('custom');
          // Rough fallback for unknown crons (it won't perfectly reverse all custom crons, but functional enough)
          setCustomUnit('days');
          setCustomValue(1);
          setCustomTime('09:00');
        }
      } else {
        setTitle('');
        setInstruction('');
        setScheduledAt('');
        setRepeatMode('preset');
        setPresetCron('');
      }
    }
  }, [isOpen, editingJob]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { 
        title, 
        instruction,
        scheduledAt: scheduledAt || null,
        cronExpression: cronExpression || null,
        isTemplate: !!cronExpression
      };

      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const res = await fetch(url, {
        method: editingJob ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save job');

      onJobCreated();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error saving job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ✨ {editingJob ? 'Edit Task' : 'Create Task'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-300 mb-2">
                Task Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans"
                placeholder="e.g. Scrape latest tech news"
              />
            </div>

            <div>
              <label htmlFor="instruction" className="block text-sm font-semibold text-slate-300 mb-2">
                Instructions (Prompt)
              </label>
              <textarea
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                required
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none font-sans"
                placeholder="Tell Openclaw what to do..."
              />
            </div>

            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800/60 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Scheduling (Optional)
              </h3>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Execution Date & Time</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onClick={(e) => {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        (e.target as any).showPicker();
                      }
                    }}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="cursor-pointer w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none font-sans"
                  />
                  <Calendar className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Repeat Rule</label>
                
                {/* Preset vs Custom Select */}
                <select
                  value={repeatMode === 'preset' ? presetCron : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setRepeatMode('custom');
                    } else {
                      setRepeatMode('preset');
                      setPresetCron(val);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none font-sans cursor-pointer"
                >
                  <option value="">Run Once (No Repeat)</option>
                  <option value="0 * * * *">Every Hour</option>
                  <option value="0 9 * * *">Daily at 9 AM</option>
                  <option value="0 18 * * *">Daily at 6 PM</option>
                  <option value="0 9 * * 1">Every Monday at 9 AM</option>
                  <option value="0 9 * * 1-5">Every Weekday at 9 AM</option>
                  <option value="custom">⚙️ Custom...</option>
                </select>

                {/* Custom Panel */}
                {repeatMode === 'custom' && (
                  <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex gap-2 items-center flex-wrap">
                    <span className="text-sm text-slate-400">Every</span>
                    <input 
                      type="number" 
                      min="1" 
                      value={customValue} 
                      onChange={(e) => setCustomValue(parseInt(e.target.value) || 1)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-200 focus:outline-none"
                    />
                    <select 
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>

                    {customUnit === 'days' && (
                      <div className="flex items-center gap-2 ml-1">
                        <span className="text-sm text-slate-400">at</span>
                        <input 
                          type="time" 
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-200 focus:outline-none cursor-pointer" 
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Instant Preview */}
                {cronExpression && (
                  <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
                    <Settings2 className="w-3 h-3" />
                    Preview: {cronstrue.toString(cronExpression)}
                  </p>
                )}
              </div>

            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 mt-auto flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Saving...' : (editingJob ? 'Save Changes' : 'Create Task')}
          </button>
        </div>

      </div>
    </div>
  );
}