import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Calendar, User, Clock, FileText, CheckCircle, 
  MessageSquare, Edit3, X, Paperclip, Send, Loader2, Link as LinkIcon,
  List, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [filterType, setFilterType] = useState<'my' | 'all'>(user?.role === 'FELLOW' || user?.role === 'EMPLOYEE' || user?.role === 'INTERN' ? 'my' : 'all');
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formAssigned, setFormAssigned] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formStatus, setFormStatus] = useState('PENDING');
  const [formEstHours, setFormEstHours] = useState('0');
  const [formStart, setFormStart] = useState('');
  const [formDue, setFormDue] = useState('');
  const [formTags, setFormTags] = useState('');

  // Update progress state inside Modal
  const [modalStatus, setModalStatus] = useState('');
  const [modalPct, setModalPct] = useState(0);
  const [updatingTask, setUpdatingTask] = useState(false);

  const isManagement = user?.role && ['ADMIN', 'CHIEF', 'MANAGEMENT'].includes(user.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const taskRes = await api.get('/tasks/');
      setTasks(taskRes.data.results || taskRes.data || []);
      const projRes = await api.get('/projects/');
      setProjects(projRes.data.results || projRes.data || []);
      const teamRes = await api.get('/team/profiles/');
      setTeam(teamRes.data.results || teamRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('create') === 'true') {
      setIsCreateOpen(true);
    }
  }, []);

  const fetchComments = async (taskId: number) => {
    try {
      const res = await api.get(`/tasks/${taskId}/comments/`);
      setComments(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedTask) {
      fetchComments(selectedTask.id);
      setModalStatus(selectedTask.status);
      setModalPct(selectedTask.completion_percentage);
    }
  }, [selectedTask]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    setPostingComment(true);
    try {
      const res = await api.post(`/tasks/${selectedTask.id}/comments/`, {
        content: newComment,
      });
      setComments([...comments, res.data]);
      setNewComment('');
      // Refresh task detail to load modifications
      fetchData();
    } catch (err) {
      alert("Error posting comment: " + JSON.stringify(err));
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setUpdatingTask(true);
    try {
      const res = await api.patch(`/tasks/${selectedTask.id}/`, {
        status: modalStatus,
        completion_percentage: modalPct,
      });
      setSelectedTask(res.data);
      fetchData();
      alert("Task progress updated.");
    } catch (err) {
      alert("Update failed: " + JSON.stringify(err));
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks/', {
        name: formName,
        description: formDesc,
        project: formProject || null,
        assigned_to: formAssigned || null,
        priority: formPriority,
        status: formStatus,
        estimated_time: parseFloat(formEstHours) || 0.0,
        start_date: formStart || null,
        due_date: formDue || null,
        tags: formTags.split(',').map(t => t.trim()).filter(t => t)
      });

      setIsCreateOpen(false);
      // Reset
      setFormName('');
      setFormDesc('');
      setFormProject('');
      setFormAssigned('');
      setFormEstHours('0');
      setFormStart('');
      setFormDue('');
      setFormTags('');

      fetchData();
    } catch (err) {
      alert("Error creating task: " + JSON.stringify(err));
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDrop = async (e: React.DragEvent, statusVal: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    try {
      await api.patch(`/tasks/${taskId}/`, { status: statusVal });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: 'Pending', value: 'PENDING', color: 'border-slate-500/20 text-slate-400 bg-slate-950/10' },
    { title: 'In Progress', value: 'IN_PROGRESS', color: 'border-blue-500/20 text-blue-400 bg-blue-950/10' },
    { title: 'Review', value: 'REVIEW', color: 'border-amber-500/20 text-amber-400 bg-amber-950/10' },
    { title: 'Completed', value: 'COMPLETED', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-sm text-text-gray mt-1">
            Track actions, update percentages, review blockers, and mention collaborators.
          </p>
        </div>
        {isManagement && (
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Scope Segment Filter & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1.5 bg-slate-950/50 p-1 rounded-xl border border-border-dark w-fit text-xs">
          <button 
            onClick={() => setFilterType('my')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${filterType === 'my' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            My Tasks
          </button>
          <button 
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${filterType === 'all' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            All Tasks
          </button>
        </div>

        <div className="flex gap-1.5 bg-slate-950/50 p-1 rounded-xl border border-border-dark w-fit text-xs">
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${viewMode === 'table' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            <List size={14} />
            <span>Table View</span>
          </button>
          <button 
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${viewMode === 'board' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            <LayoutGrid size={14} />
            <span>Board View</span>
          </button>
        </div>
      </div>

      {/* Task Content List/Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto bg-card-dark border border-border-dark rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-dark/60 bg-slate-950/20 text-text-gray font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Task Title</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark/40">
              {tasks.filter(t => filterType === 'all' || t.assigned_to === user?.id).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-gray italic">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.filter(t => filterType === 'all' || t.assigned_to === user?.id).map((t) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-slate-800 text-slate-300 border-slate-700/55',
                    IN_PROGRESS: 'bg-blue-950/60 text-blue-400 border-blue-800/40',
                    REVIEW: 'bg-purple-950/60 text-purple-400 border-purple-800/40',
                    COMPLETED: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
                  };
                  
                  const priorityColors: Record<string, string> = {
                    HIGH: 'bg-red-950/40 text-red-400 border-red-900/30',
                    MEDIUM: 'bg-amber-950/40 text-amber-400 border-amber-900/30',
                    LOW: 'bg-blue-950/40 text-blue-400 border-blue-900/30',
                  };

                  return (
                    <tr 
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold text-white max-w-xs truncate">
                        {t.name}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">
                        {t.project_details?.name || 'Standalone'}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {t.assigned_to_details ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-slate-800 border border-primary flex items-center justify-center font-bold text-primary text-[9px]">
                              {t.assigned_to_details.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px]">{t.assigned_to_details.email}</span>
                          </div>
                        ) : (
                          <span className="italic text-text-gray">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityColors[t.priority] || 'bg-slate-800 text-slate-300'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[t.status] || 'bg-slate-800 text-slate-300'}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${t.completion_percentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-[10px] text-text-gray">{t.completion_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = tasks.filter(t => 
              t.status === col.value && 
              (filterType === 'all' || t.assigned_to === user?.id)
            );
            return (
              <div 
                key={col.value} 
                className="flex flex-col space-y-4 min-w-[220px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.value)}
              >
                {/* Column Header */}
                <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between font-bold text-xs ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="bg-slate-950/50 px-2 py-0.5 rounded-md text-[10px]">{colTasks.length}</span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-20 rounded-xl border border-dashed border-border-dark/60 flex items-center justify-center text-[10px] text-text-gray italic">
                      Empty column
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        className="glass-card p-4 rounded-xl cursor-pointer hover:border-primary/40 transition-all border border-border-dark bg-slate-950/30 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${
                              t.priority === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                              t.priority === 'HIGH' ? 'bg-orange-950 text-orange-400' :
                              'bg-slate-800 text-text-gray'
                            }`}>
                              {t.priority}
                            </span>
                            <span className="text-[9px] text-text-gray">{t.completion_percentage}%</span>
                          </div>
                          <h4 className="font-bold text-xs mt-2 text-white line-clamp-2">{t.name}</h4>
                          <p className="text-[9px] text-primary mt-1 truncate">
                            {t.project_details?.name || 'Standalone Task'}
                          </p>
                        </div>

                        <div className="border-t border-border-dark/40 pt-2 flex items-center justify-between text-[9px] text-text-gray">
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {t.assigned_to_details?.email.split('@')[0] || 'Unassigned'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {t.due_date || 'No due date'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
            <div className="fixed inset-0" onClick={() => setSelectedTask(null)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-5xl bg-card-dark border-l border-border-dark h-screen max-h-screen overflow-y-auto z-10 p-6 md:p-8 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-border-dark pb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedTask.name}</h2>
                  <p className="text-xs text-primary mt-1">Project: {selectedTask.project_details?.name || 'Standalone'}</p>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Task Details Grid */}
              <div className="space-y-4">
                {!isManagement && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 w-fit text-xs font-semibold">
                    <span>🔒 Manager Managed (Read-only)</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Information Column */}
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="text-[10px] font-bold text-text-gray uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-gray-300 leading-relaxed">{selectedTask.description || "No description provided."}</p>
                  </div>

                  {/* Task details fields */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/20 p-4 rounded-xl border border-border-dark/30">
                    <div>
                      <span className="block text-[9px] text-text-gray">Assigned To</span>
                      <span className="font-semibold text-white">{selectedTask.assigned_to_details?.first_name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-text-gray">Estimated Time</span>
                      <span className="font-semibold text-white">{selectedTask.estimated_time} hrs</span>
                    </div>
                    <div className="border-t border-border-dark/40 pt-2">
                      <span className="block text-[9px] text-text-gray">Start Date</span>
                      <span className="font-semibold text-white">{selectedTask.start_date || 'N/A'}</span>
                    </div>
                    <div className="border-t border-border-dark/40 pt-2">
                      <span className="block text-[9px] text-text-gray">Due Date</span>
                      <span className="font-semibold text-white">{selectedTask.due_date || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Writable progress update form */}
                  {(selectedTask.assigned_to === user?.id || isManagement) && (
                    <form onSubmit={handleUpdateProgress} className="p-4 rounded-xl bg-slate-900 border border-border-dark/50 space-y-3">
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Update Progress</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] text-text-gray mb-1">Status</label>
                          <select 
                            value={modalStatus} 
                            onChange={(e) => setModalStatus(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-border-dark rounded text-xs"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-text-gray mb-1">Percentage ({modalPct}%)</label>
                          <input 
                            type="range" min="0" max="100" 
                            value={modalPct} 
                            onChange={(e) => setModalPct(parseInt(e.target.value))}
                            className="w-full mt-2 accent-primary"
                          />
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={updatingTask}
                        className="w-full py-1.5 bg-primary hover:bg-indigo-600 text-white font-bold rounded text-xs transition-colors"
                      >
                        {updatingTask ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Comments Thread Column */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-border-dark pt-4 md:pt-0 md:pl-6 flex flex-col h-full">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Comments Thread</h3>
                  
                  {/* Comments list scroll area */}
                  <div className="flex-1 max-h-48 overflow-y-auto space-y-3.5 pr-2">
                    {comments.length === 0 ? (
                      <p className="text-xs text-text-gray italic text-center py-6">No comments posted yet.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-200">{c.user_details?.first_name || c.user_details?.email.split('@')[0]}</span>
                            <span className="text-[9px] text-text-gray">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-gray-400 bg-slate-950/20 p-2.5 rounded-lg border border-border-dark/30 leading-relaxed">
                            {c.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment submit bar */}
                  <form onSubmit={handlePostComment} className="flex gap-2 pt-2 border-t border-border-dark/40">
                    <input 
                      type="text" 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add comment... Use @email to mention"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-border-dark rounded-xl text-xs outline-none"
                    />
                    <button 
                      type="submit" 
                      disabled={postingComment || !newComment.trim()}
                      className="p-2 bg-primary hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl shrink-0 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
            <div className="fixed inset-0" onClick={() => setIsCreateOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-xl bg-card-dark border-l border-border-dark h-screen max-h-screen overflow-y-auto z-10 p-6 md:p-8 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-3">
                <h2 className="text-lg font-bold">New Task Ticket</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Task Name</label>
                  <input 
                    type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    placeholder="e.g. Code Review Middleware"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Description</label>
                  <textarea 
                    value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none h-16 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Link (Optional)</label>
                    <select 
                      value={formProject} onChange={(e) => setFormProject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="">Standalone (No Project)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Assigned Person</label>
                    <select 
                      value={formAssigned} onChange={(e) => setFormAssigned(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="">Select Assignee</option>
                      {team.map(t => (
                        <option key={t.user} value={t.user}>{t.name} ({t.user_details?.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Priority</label>
                    <select 
                      value={formPriority} onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Status</label>
                    <select 
                      value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Est. Hours</label>
                    <input 
                      type="number" value={formEstHours} onChange={(e) => setFormEstHours(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Start Date</label>
                    <input 
                      type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Due Date</label>
                    <input 
                      type="date" value={formDue} onChange={(e) => setFormDue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Tags (Comma separated)</label>
                  <input 
                    type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    placeholder="e.g. backend, security, api"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20"
                >
                  Create Task Ticket
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
