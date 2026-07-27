import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FolderClosed, Search, Plus, Trash2, X, Calendar, 
  Clock, AlertCircle, ChevronRight, User, Users,
  CheckCircle, ListTodo, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected project details modal
  const [filterType, setFilterType] = useState<'my' | 'all'>(user?.role === 'FELLOW' || user?.role === 'EMPLOYEE' || user?.role === 'INTERN' ? 'my' : 'all');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'tasks' | 'notes' | 'activity'>('overview');
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [projectLogs, setProjectLogs] = useState<any[]>([]);

  // Modal open states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formDue, setFormDue] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formStatus, setFormStatus] = useState('PLANNING');
  const [formManager, setFormManager] = useState('');
  const [formDevs, setFormDevs] = useState<string[]>([]);
  const [formMembers, setFormMembers] = useState<string[]>([]);

  const isManagement = user?.role && ['ADMIN', 'CHIEF', 'MANAGEMENT'].includes(user.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/projects/');
      const projectsList = pRes.data.results || pRes.data || [];
      setProjects(projectsList);

      const uRes = await api.get('/auth/users/');
      setUsers(uRes.data.results || uRes.data || []);

      const profRes = await api.get('/team/profiles/');
      setProfiles(profRes.data.results || profRes.data || []);

      const queryParams = new URLSearchParams(window.location.search);
      const projId = queryParams.get('id');
      const createParam = queryParams.get('create');

      if (createParam === 'true') {
        setIsCreateOpen(true);
      } else if (projId) {
        const found = projectsList.find((p: any) => p.id === parseInt(projId));
        if (found) {
          setSelectedProject(found);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchProjectTasks = async (projectId: number) => {
    try {
      const res = await api.get(`/tasks/?project_id=${projectId}`);
      setProjectTasks(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjectLogs = async (projectId: number) => {
    try {
      const res = await api.get(`/auth/logs/?project_id=${projectId}`);
      setProjectLogs(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTasks(selectedProject.id);
      fetchProjectLogs(selectedProject.id);
      setActiveTab('overview');
    }
  }, [selectedProject]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects/', {
        name: formName,
        description: formDesc,
        client: formClient,
        start_date: formStart || null,
        end_date: formDue || null,
        priority: formPriority,
        status: formStatus,
        project_manager: formManager ? parseInt(formManager) : null,
        developers: formDevs.map(id => parseInt(id)),
        members: formMembers.map(id => parseInt(id))
      });

      setIsCreateOpen(false);
      setFormName('');
      setFormDesc('');
      setFormClient('');
      setFormStart('');
      setFormDue('');
      setFormManager('');
      setFormDevs([]);
      setFormMembers([]);

      fetchData();
      alert("Project scoped successfully.");
    } catch (err) {
      alert("Error creating project: " + JSON.stringify(err));
    }
  };

  const handleDeleteProject = async (projId: number) => {
    if (!window.confirm("Delete this project? This will delete all linked tasks.")) return;
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${projId}/`);
      setSelectedProject(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDevsSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setFormDevs(values);
  };

  const handleMembersSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setFormMembers(values);
  };

  // Filter Projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    
    const matchesScope = filterType === 'all' || 
      p.project_manager === user?.id || 
      p.developers.some((d: any) => d.id === user?.id) || 
      p.members.some((m: any) => m.id === user?.id);

    return matchesSearch && matchesPriority && matchesStatus && matchesScope;
  });

  const columns = [
    { title: 'Planning', value: 'PLANNING', color: 'border-slate-500/20 text-slate-400 bg-slate-950/10' },
    { title: 'In Progress', value: 'IN_PROGRESS', color: 'border-blue-500/20 text-blue-400 bg-blue-950/10' },
    { title: 'On Hold', value: 'ON_HOLD', color: 'border-amber-500/20 text-amber-400 bg-amber-950/10' },
    { title: 'Completed', value: 'COMPLETED', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/10' },
    { title: 'Cancelled', value: 'CANCELLED', color: 'border-red-500/20 text-red-400 bg-red-950/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Folders</h1>
          <p className="text-sm text-text-gray mt-1">
            Browse active project scopes, deliverables, timelines, and milestones.
          </p>
        </div>
        {isManagement && (
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Scope Segment Filter */}
      <div className="flex gap-1.5 bg-slate-950/50 p-1 rounded-xl border border-border-dark w-fit text-xs">
        <button 
          onClick={() => setFilterType('my')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${filterType === 'my' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white'}`}
        >
          My Projects
        </button>
        <button 
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${filterType === 'all' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white'}`}
        >
          All Projects
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card-dark p-4 rounded-2xl border border-border-dark">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or client..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-gray-400"
          >
            <option value="">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-gray-400"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Projects Folder Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-card-dark rounded-2xl border border-border-dark">
          <FolderClosed className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="font-semibold text-lg">No projects found</h3>
          <p className="text-xs text-text-gray mt-1">Try creating a project scope.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div 
              key={p.id}
              className="glass-card p-6 rounded-2xl border border-border-dark relative overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all shadow-md group"
            >
              {/* Folder accent line */}
              <div className="absolute top-0 left-0 w-20 h-1 bg-primary group-hover:w-full transition-all duration-300" />
              
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <FolderClosed size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      p.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' :
                      p.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-400' :
                      'bg-slate-800 text-text-gray'
                    }`}>{p.status.replace('_', ' ')}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      p.health_status === 'DELAYED' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                      p.health_status === 'AT_RISK' ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' :
                      'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                    }`}>
                      {p.health_status ? p.health_status.replace('_', ' ') : 'ON TRACK'}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-base mt-4 text-white line-clamp-1">{p.name}</h3>
                <p className="text-[10px] text-text-gray mt-0.5">PM: {p.project_manager_details?.first_name || p.project_manager_details?.email.split('@')[0] || 'Unassigned'}</p>
                <p className="text-xs text-text-gray mt-1 line-clamp-2">{p.description || "No description."}</p>

                {/* Progress bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-medium">
                    <span className="text-text-gray">Progress</span>
                    <span className="text-white">{p.completion_percentage || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-border-dark/40">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${p.completion_percentage || 0}%` }} />
                  </div>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border-dark/50 text-[11px] text-text-gray">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-text-gray">Members</span>
                    <span className="text-white font-medium">{p.members_count || 0}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-text-gray">Tasks</span>
                    <span className="text-white font-medium">{p.tasks_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-dark/50 flex items-center justify-between">
                <span className="text-[10px] text-text-gray">Due: {p.end_date || 'No deadline'}</span>
                <button 
                  onClick={() => { setSelectedProject(p); setActiveTab('overview'); }}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Open Folder</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
            <div className="fixed inset-0" onClick={() => setSelectedProject(null)} />
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                    <span className="bg-slate-800 text-text-gray text-[10px] px-2 py-0.5 rounded font-medium">{selectedProject.status}</span>
                  </div>
                  <p className="text-xs text-text-gray mt-1">Client: {selectedProject.client || 'Internal'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isManagement && (
                    <button 
                      onClick={() => handleDeleteProject(selectedProject.id)}
                      disabled={isDeleting}
                      className="p-2 text-red-400 hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-border-dark pb-1 text-xs">
                {(['overview', 'members', 'tasks', 'notes', 'activity'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-3 border-b-2 font-medium capitalize transition-all cursor-pointer ${
                      activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {!isManagement && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 w-fit font-semibold">
                      <span>🔒 Manager Managed (Read-only)</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-text-gray uppercase tracking-wider block">Description</span>
                      <p className="text-white mt-1 leading-relaxed">{selectedProject.description || 'No description provided.'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-gray uppercase tracking-wider block">Project Manager</span>
                      <p className="text-white mt-1">{selectedProject.project_manager_details?.email || 'No manager assigned'}</p>
                    </div>
                  </div>
                  <div className="space-y-4 border-l border-border-dark/60 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] font-bold text-text-gray uppercase">Start Date</span>
                        <span className="text-white font-medium block mt-1">{selectedProject.start_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-text-gray uppercase">End Date</span>
                        <span className="text-white font-medium block mt-1">{selectedProject.end_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-text-gray uppercase">Priority</span>
                        <span className="text-white font-medium block mt-1">{selectedProject.priority}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-text-gray uppercase">Status</span>
                        <span className="text-white font-medium block mt-1">{selectedProject.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* Tab Content: Members */}
              {activeTab === 'members' && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div>
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Developers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProject.developers_details?.length === 0 ? (
                        <p className="text-text-gray italic">No developers assigned.</p>
                      ) : (
                        selectedProject.developers_details?.map((dev: any) => {
                          const prof = profiles.find(p => p.user === dev.id);
                          return (
                            <div key={dev.id} className="p-3 bg-slate-900/40 border border-border-dark rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-primary text-[11px] shrink-0">{dev.email.charAt(0).toUpperCase()}</div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-white block truncate">{prof?.name || dev.first_name || dev.email.split('@')[0]}</span>
                                  <span className="text-[9px] text-text-gray block truncate">{prof?.user_details?.role || dev.role} • {prof?.active_tasks_count || 0} active tasks</span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                                prof?.workload_indicator === 'High' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                                prof?.workload_indicator === 'Normal' ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' :
                                'bg-slate-800 text-text-gray border-border-dark/65'
                              }`}>
                                {prof?.workload_indicator || 'Low'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="border-t border-border-dark/45 pt-4">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Observers & Members</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProject.members_details?.length === 0 ? (
                        <p className="text-text-gray italic">No observers assigned.</p>
                      ) : (
                        selectedProject.members_details?.map((mem: any) => {
                          const prof = profiles.find(p => p.user === mem.id);
                          return (
                            <div key={mem.id} className="p-3 bg-slate-900/40 border border-border-dark rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-primary text-[11px] shrink-0">{mem.email.charAt(0).toUpperCase()}</div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-white block truncate">{prof?.name || mem.first_name || mem.email.split('@')[0]}</span>
                                  <span className="text-[9px] text-text-gray block truncate">{prof?.user_details?.role || mem.role} • {prof?.active_tasks_count || 0} active tasks</span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                                prof?.workload_indicator === 'High' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                                prof?.workload_indicator === 'Normal' ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' :
                                'bg-slate-800 text-text-gray border-border-dark/65'
                              }`}>
                                {prof?.workload_indicator || 'Low'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Tasks */}
              {activeTab === 'tasks' && (
                <div className="space-y-2 text-xs animate-fade-in max-h-64 overflow-y-auto pr-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-2">Linked Project Tasks</h3>
                  {projectTasks.length === 0 ? (
                    <p className="text-text-gray italic py-4">No tasks found for this project scope.</p>
                  ) : (
                    projectTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{t.name}</span>
                          <span className="text-[9px] text-text-gray block mt-0.5">Assigned to: {t.assigned_to_details?.email} • Status: {t.status}</span>
                        </div>
                        <span className="font-bold text-primary">{t.completion_percentage}%</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content: Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-2 text-xs animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Project Notes & Specifications</h3>
                  <textarea 
                    readOnly
                    value={selectedProject.notes || 'No project notes logged.'} 
                    className="w-full h-40 bg-slate-950/40 border border-border-dark rounded-xl outline-none p-3 resize-none text-white italic"
                  />
                </div>
              )}

              {/* Tab Content: Activity Timeline */}
              {activeTab === 'activity' && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Audit Timeline & History</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {projectLogs.length === 0 ? (
                      <p className="text-xs text-text-gray italic py-4">No activity logged for this project.</p>
                    ) : (
                      projectLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 relative pb-4">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                            <div className="w-0.5 bg-border-dark flex-1 mt-1" />
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-200">
                              <span className="font-semibold text-white capitalize mr-1">
                                {log.user_details ? (log.user_details.first_name || log.user_details.email.split('@')[0]) : 'System'}
                              </span>
                              {log.action}
                            </p>
                            <span className="text-[9px] text-text-gray block mt-0.5">
                              {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Project Modal (Management only) */}
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
                <h2 className="text-lg font-bold">New Project Scope</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Name</label>
                  <input 
                    type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    placeholder="e.g. ERP Automation V2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Client / Target</label>
                  <input 
                    type="text" required value={formClient} onChange={(e) => setFormClient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    placeholder="e.g. Internal Products"
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
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Start Date</label>
                    <input 
                      type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">End Date</label>
                    <input 
                      type="date" value={formDue} onChange={(e) => setFormDue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Status</label>
                    <select 
                      value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Manager</label>
                  <select 
                    value={formManager} onChange={(e) => setFormManager(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Developers (Hold Command to Select Multiple)</label>
                  <select 
                    multiple value={formDevs} onChange={handleDevsSelect}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray h-20"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Observers & Members (Hold Command to Select Multiple)</label>
                  <select 
                    multiple value={formMembers} onChange={handleMembersSelect}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray h-20"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                >
                  Create Project Scope
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
