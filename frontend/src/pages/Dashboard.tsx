import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  FolderClosed, CheckCircle2, Users2, Calendar, 
  ArrowUpRight, Plus, FolderPlus, Bell, Clock, 
  ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/');
      setData(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-card-dark rounded-2xl border border-border-dark max-w-md mx-auto mt-20">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <p className="text-gray-200 font-semibold mb-2">Failed to load metrics</p>
        <p className="text-xs text-text-gray mb-4">Please make sure the backend server is running and database is seeded.</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-primary hover:bg-indigo-600 rounded-lg text-xs font-bold transition-all">
          Retry Connection
        </button>
      </div>
    );
  }

  const isManagement = data.is_management;

  // Recharts Pie Chart Data
  const pieData = data.status_distribution ? [
    { name: 'Pending', value: data.status_distribution.pending || 0, color: '#f59e0b' },
    { name: 'In Progress', value: data.status_distribution.in_progress || 0, color: '#3b82f6' },
    { name: 'Review', value: data.status_distribution.review || 0, color: '#8b5cf6' },
    { name: 'Completed', value: data.status_distribution.completed || 0, color: '#10b981' },
  ].filter(item => item.value > 0) : [];

  // Recharts Bar Chart Data (Project Completion rates)
  const projectData = isManagement 
    ? (data.project_progress || [])
    : (data.my_projects || []).map((proj: any) => ({
        name: proj.name,
        completion: proj.completion_percentage || 0
      }));

  return (
    <div className="space-y-8 animate-fade-in dashboard-container">
      
      {/* Header and Welcome Message */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 dashboard-header border-b border-border-dark/45 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Workspace Dashboard</h1>
          <p className="text-sm text-text-gray mt-1">
            Welcome back, <span className="text-primary font-semibold">{user?.first_name || 'User'}</span>. Here is your operational view.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex gap-2 shrink-0">
          {isManagement ? (
            <>
              <button 
                onClick={() => navigate('/projects')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-border-dark text-white font-medium text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FolderPlus size={14} />
                <span>New Project</span>
              </button>
              <button 
                onClick={() => navigate('/tasks')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white font-medium text-xs hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Assign Task</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/projects')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-border-dark text-white font-medium text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FolderClosed size={14} />
                <span>My Projects</span>
              </button>
              <button 
                onClick={() => navigate('/tasks')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white font-medium text-xs hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Update Work Status</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* RENDER VIEW: Admin / Chief / Management */}
      {isManagement ? (
        <div className="space-y-8">
          
          {/* KPI Analytics Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            
            <div className="glass-card p-5 rounded-2xl relative overflow-hidden border border-border-dark project-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Active Projects</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FolderClosed size={16} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold">{data.metrics.active_projects}</p>
              <p className="mt-1 text-[10px] text-text-gray">Tracked deliverables</p>
            </div>

            <div className="glass-card p-5 rounded-2xl relative overflow-hidden border border-border-dark project-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Pending Tasks</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock size={16} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold">{data.metrics.pending_tasks}</p>
              <p className="mt-1 text-[10px] text-text-gray">Awaiting completion</p>
            </div>

            <div className="glass-card p-5 rounded-2xl relative overflow-hidden border border-border-dark project-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Completed Today</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold">{data.metrics.completed_today}</p>
              <p className="mt-1 text-[10px] text-text-gray">Sprint velocity</p>
            </div>

            <div className="glass-card p-5 rounded-2xl relative overflow-hidden border border-border-dark project-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Team Members</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Users2 size={16} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold">{data.metrics.team_members}</p>
              <p className="mt-1 text-[10px] text-text-gray">Active staff & fellows</p>
            </div>

          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Task Distribution (Pie Chart) */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-1 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Task Distribution</h3>
              <div className="h-64 flex justify-center items-center">
                {pieData.length === 0 ? (
                  <p className="text-xs text-text-gray italic">No tasks logged.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Project progress (Bar Chart) */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-2 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Active Projects Progress</h3>
              <div className="h-64">
                {projectData.length === 0 ? (
                  <p className="text-xs text-text-gray text-center py-24 italic">No active projects.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name="Completion rate (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Grid: Tasks & Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Tasks */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Recent Tasks</h3>
                <button onClick={() => navigate('/tasks')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5">
                  <span>Task Board</span>
                  <ArrowUpRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.recent_tasks.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-4">No tasks found.</p>
                ) : (
                  data.recent_tasks.map((task: any) => (
                    <div key={task.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between hover:border-border-dark transition-colors">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white truncate block">{task.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Status: {task.status.replace('_', ' ')}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                        task.priority === 'HIGH' ? 'bg-orange-950 text-orange-400' :
                        'bg-slate-800 text-text-gray'
                      }`}>{task.priority}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Recent Projects</h3>
                <button onClick={() => navigate('/projects')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5">
                  <span>Project Board</span>
                  <ArrowUpRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.recent_projects.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-4">No projects found.</p>
                ) : (
                  data.recent_projects.map((proj: any) => (
                    <div key={proj.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between hover:border-border-dark transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">{proj.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Client: {proj.client || 'Internal'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-primary">{proj.completion_percentage}%</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Progress</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Grid: Deadlines and Silent Backend Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Deadlines */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Upcoming Deadlines</h3>
              <div className="space-y-2">
                {data.upcoming_deadlines.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-4">No upcoming deadlines.</p>
                ) : (
                  data.upcoming_deadlines.map((task: any) => (
                    <div key={task.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white block">{task.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Due: {task.due_date}</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-red-950/20 text-red-400 font-bold border border-red-500/10">Urgent</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audit Log / Recent Activity */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Recent Operational Log</h3>
              <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
                {data.recent_activity.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-4">No logs recorded.</p>
                ) : (
                  data.recent_activity.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-2.5 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-white text-[11px]">{log.action}</span>
                        <p className="text-[9px] text-text-gray mt-0.5">
                          By {log.user_details?.email || 'System'} in {log.module} • {new Date(log.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* RENDER VIEW: Employees / Interns / Fellows (Personal Tasks Only) */
        <div className="space-y-8">
          
          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Task Distribution (Pie Chart) */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-1 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">My Task Distribution</h3>
              <div className="h-64 flex justify-center items-center">
                {pieData.length === 0 ? (
                  <p className="text-xs text-text-gray italic">No tasks assigned.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Project progress (Bar Chart) */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-2 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">My Project Progress</h3>
              <div className="h-64">
                {projectData.length === 0 ? (
                  <p className="text-xs text-text-gray text-center py-24 italic">No projects assigned.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name="Completion rate (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Grid: My Tasks, My Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* My Tasks */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">My Active Tasks</h3>
                <button onClick={() => navigate('/tasks')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5">
                  <span>Go to Kanban</span>
                  <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.my_tasks.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">You have no pending tasks assigned.</p>
                ) : (
                  data.my_tasks.map((task: any) => (
                    <div key={task.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between hover:border-border-dark transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">{task.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Status: {task.status.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">{task.completion_percentage}%</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Progress</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Projects */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">My Projects</h3>
                <button onClick={() => navigate('/projects')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5">
                  <span>View Projects</span>
                  <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.my_projects.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">You are not assigned to any projects.</p>
                ) : (
                  data.my_projects.map((proj: any) => (
                    <div key={proj.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between hover:border-border-dark transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">{proj.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Client: {proj.client || 'Internal'}</span>
                      </div>
                      <span className="text-xs font-bold text-primary">{proj.completion_percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Grid: Due Today, Recent Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Due Today */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Due Today</h3>
              <div className="space-y-2">
                {data.due_today.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">Nothing due today. Keep it up!</p>
                ) : (
                  data.due_today.map((task: any) => (
                    <div key={task.id} className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white block">{task.name}</span>
                        <span className="text-[9px] text-red-400 block mt-0.5">Action required today</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">Due</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Updates / Notification Center */}
            <div className="glass-card p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {data.recent_updates.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">No new updates.</p>
                ) : (
                  data.recent_updates.map((notif: any) => (
                    <div key={notif.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Bell size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">{notif.title}</span>
                        <p className="text-[10px] text-text-gray mt-0.5">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
