import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  FolderClosed, CheckCircle2, Users2, Calendar, 
  ArrowUpRight, Plus, FolderPlus, Bell, Clock, 
  ChevronRight, AlertCircle, Loader2, UserPlus, Megaphone
} from 'lucide-react';
import { 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, XAxis, YAxis
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-card-dark rounded-2xl border border-border-dark max-w-md mx-auto mt-20">
        <AlertCircle className="mx-auto h-12 w-12 text-danger mb-4" />
        <p className="text-text-white font-semibold mb-2">Failed to load metrics</p>
        <p className="text-xs text-text-gray mb-4">Please make sure the backend server is running and database is seeded.</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg text-xs font-bold text-white transition-all cursor-pointer">
          Retry Connection
        </button>
      </div>
    );
  }

  const isManagement = data.is_management;

  // Recharts Pie Chart Data (Mapped to Premium Colors)
  const pieData = data.status_distribution ? [
    { name: 'Pending', value: data.status_distribution.pending || 0, color: '#9CA3AF' },
    { name: 'In Progress', value: data.status_distribution.in_progress || 0, color: '#3461F4' },
    { name: 'Review', value: data.status_distribution.review || 0, color: '#58A9F8' },
    { name: 'Completed', value: data.status_distribution.completed || 0, color: '#5BBF34' },
  ].filter(item => item.value > 0) : [];

  // Recharts Bar Chart Data (Project Completion rates)
  const projectData = isManagement 
    ? (data.project_progress || [])
    : (data.my_projects || []).map((proj: any) => ({
        name: proj.name,
        completion: proj.completion_percentage || 0
      }));

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header and Welcome Message */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-white">
            Welcome Back, {user?.first_name || 'User'} 👋
          </h1>
          <p className="text-sm text-text-gray mt-1">
            Here's today's focus and operational view for MaAngo Tech Labs.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex gap-2 shrink-0">
          {isManagement ? (
            <>
              <button 
                onClick={() => navigate('/projects')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card-dark border border-border-dark text-text-white font-medium text-xs hover:bg-bg-dark transition-colors cursor-pointer"
              >
                <FolderPlus size={14} />
                <span>New Project</span>
              </button>
              <button 
                onClick={() => navigate('/tasks')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white font-medium text-xs hover:opacity-90 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Assign Task</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/projects')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card-dark border border-border-dark text-text-white font-medium text-xs hover:bg-bg-dark transition-colors cursor-pointer"
              >
                <FolderClosed size={14} />
                <span>My Projects</span>
              </button>
              <button 
                onClick={() => navigate('/tasks')} 
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white font-medium text-xs hover:opacity-90 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Update Status</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* RENDER VIEW: Admin / Chief / Management */}
      {isManagement ? (
        <div className="space-y-8">
          
          {/* KPI Analytics Grid (Floating White Cards, Soft Shadows) */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            
            <div 
              onClick={() => navigate('/projects')}
              className="kpi-card flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Active Projects</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FolderClosed size={16} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-text-white">{data.metrics.active_projects}</p>
              <p className="mt-1 text-[9px] text-text-gray">Tracked scopes</p>
            </div>

            <div 
              onClick={() => navigate('/projects')}
              className="kpi-card flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Completed Projects</span>
                <div className="p-2 rounded-xl bg-success/10 text-success">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-text-white">{data.metrics.completed_projects}</p>
              <p className="mt-1 text-[9px] text-text-gray">Delivered scopes</p>
            </div>

            <div 
              onClick={() => navigate('/tasks')}
              className="kpi-card flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Pending Tasks</span>
                <div className="p-2 rounded-xl bg-info/10 text-info">
                  <Clock size={16} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-text-white">{data.metrics.pending_tasks}</p>
              <p className="mt-1 text-[9px] text-text-gray">Tickets in backlog</p>
            </div>

            <div 
              onClick={() => navigate('/tasks')}
              className="kpi-card flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Overdue Tasks</span>
                <div className="p-2 rounded-xl bg-danger/10 text-danger">
                  <AlertCircle size={16} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-danger">{data.metrics.overdue_tasks}</p>
              <p className="mt-1 text-[9px] text-text-gray">Action required</p>
            </div>

            <div 
              onClick={() => navigate('/team')}
              className="kpi-card flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Team Members</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Users2 size={16} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-text-white">{data.metrics.team_members}</p>
              <p className="mt-1 text-[9px] text-text-gray">Active staff members</p>
            </div>

            <div 
              onClick={() => navigate('/projects')}
              className="kpi-card flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-gray">Fellowship Projects</span>
                <div className="p-2 rounded-xl bg-warning/10 text-warning">
                  <Calendar size={16} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-text-white">{data.metrics.fellowship_projects}</p>
              <p className="mt-1 text-[9px] text-text-gray">Fellows scopes</p>
            </div>

          </div>

          {/* Today's Focus / Priority Section */}
          <div className="glass-card p-6 border border-border-dark space-y-4">
            <div className="flex items-center gap-2 border-b border-border-dark pb-3">
              <AlertCircle className="text-warning" size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-white">Today's Focus</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              
              {/* Overdue Tasks */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-danger uppercase tracking-wider">Overdue Tasks ({data.todays_priority.overdue_tasks.length})</h4>
                <div className="space-y-2">
                  {data.todays_priority.overdue_tasks.length === 0 ? (
                    <p className="text-text-gray italic text-[10px]">No overdue tasks.</p>
                  ) : (
                    data.todays_priority.overdue_tasks.map((task: any) => (
                      <div 
                        key={task.id} 
                        onClick={() => navigate('/tasks')}
                        className="p-3 bg-bg-dark border border-border-dark hover:border-danger/30 rounded-xl cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-text-white truncate block">{task.name}</span>
                        <span className="text-[9px] text-danger block mt-0.5">Due: {task.due_date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Projects Ending Today */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-warning uppercase tracking-wider">Ending Today ({data.todays_priority.projects_ending_today.length})</h4>
                <div className="space-y-2">
                  {data.todays_priority.projects_ending_today.length === 0 ? (
                    <p className="text-text-gray italic text-[10px]">No ending projects today.</p>
                  ) : (
                    data.todays_priority.projects_ending_today.map((proj: any) => (
                      <div 
                        key={proj.id} 
                        onClick={() => navigate('/projects')}
                        className="p-3 bg-bg-dark border border-border-dark hover:border-warning/30 rounded-xl cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-text-white truncate block">{proj.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Client: {proj.client || 'Internal'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tasks awaiting Review */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Review Requests ({data.todays_priority.review_requests.length})</h4>
                <div className="space-y-2">
                  {data.todays_priority.review_requests.length === 0 ? (
                    <p className="text-text-gray italic text-[10px]">No pending reviews.</p>
                  ) : (
                    data.todays_priority.review_requests.map((task: any) => (
                      <div 
                        key={task.id} 
                        onClick={() => navigate('/tasks')}
                        className="p-3 bg-bg-dark border border-border-dark hover:border-primary/30 rounded-xl cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-text-white truncate block">{task.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">By: {task.assigned_to_details?.email.split('@')[0] || 'Unassigned'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fellows Pending ID Approval */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-info uppercase tracking-wider">Fellow Approvals ({data.todays_priority.fellows_waiting_approval.length})</h4>
                <div className="space-y-2">
                  {data.todays_priority.fellows_waiting_approval.length === 0 ? (
                    <p className="text-text-gray italic text-[10px]">No fellows pending validation.</p>
                  ) : (
                    data.todays_priority.fellows_waiting_approval.map((fellow: any) => (
                      <div 
                        key={fellow.id} 
                        onClick={() => navigate('/team')}
                        className="p-3 bg-bg-dark border border-border-dark hover:border-info/30 rounded-xl cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-text-white truncate block">{fellow.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">ID: {fellow.document_type.replace('_', ' ')} pending</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="glass-card p-5 border border-border-dark">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <button 
                onClick={() => navigate('/projects?create=true')} 
                className="flex items-center justify-center gap-2 p-3 bg-bg-dark border border-border-dark hover:border-primary/30 rounded-xl text-[11px] font-bold text-text-white transition-all hover:scale-[1.01] cursor-pointer"
              >
                <FolderPlus size={14} className="text-primary" />
                <span>+ New Project</span>
              </button>
              <button 
                onClick={() => navigate('/tasks?create=true')} 
                className="flex items-center justify-center gap-2 p-3 bg-bg-dark border border-border-dark hover:border-primary/30 rounded-xl text-[11px] font-bold text-text-white transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Plus size={14} className="text-primary" />
                <span>+ New Task</span>
              </button>
              <button 
                onClick={() => navigate('/team?create=true')} 
                className="flex items-center justify-center gap-2 p-3 bg-bg-dark border border-border-dark hover:border-primary/30 rounded-xl text-[11px] font-bold text-text-white transition-all hover:scale-[1.01] cursor-pointer"
              >
                <UserPlus size={14} className="text-primary" />
                <span>+ Add Member</span>
              </button>
              <button 
                onClick={() => navigate('/announcements?create=true')} 
                className="flex items-center justify-center gap-2 p-3 bg-bg-dark border border-border-dark hover:border-primary/30 rounded-xl text-[11px] font-bold text-text-white transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Megaphone size={14} className="text-primary" />
                <span>+ Announcement</span>
              </button>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Task Distribution (Pie Chart) */}
            <div className="glass-card p-6 lg:col-span-1 border border-border-dark">
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
                        contentStyle={{ backgroundColor: 'var(--color-card-dark)', borderColor: 'var(--color-border-dark)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--color-text-white)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-gray)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Project progress (Line Chart) */}
            <div className="glass-card p-6 lg:col-span-2 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Active Projects Progress</h3>
              <div className="h-64">
                {projectData.length === 0 ? (
                  <p className="text-xs text-text-gray text-center py-24 italic">No active projects.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-dark)" />
                      <XAxis dataKey="name" stroke="var(--color-text-gray)" fontSize={10} />
                      <YAxis stroke="var(--color-text-gray)" fontSize={11} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-dark)', borderColor: 'var(--color-border-dark)', borderRadius: '8px' }} itemStyle={{ color: 'var(--color-text-white)' }} />
                      <Line type="monotone" dataKey="completion" stroke="var(--color-primary)" strokeWidth={2} activeDot={{ r: 8 }} name="Completion rate (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Grid: Tasks & Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Tasks */}
            <div className="glass-card p-6 border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Recent Tasks</h3>
                <button onClick={() => navigate('/tasks')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span>Task Board</span>
                  <ArrowUpRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.recent_tasks.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-4">No tasks found.</p>
                ) : (
                  data.recent_tasks.map((task: any) => (
                    <div key={task.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between hover:border-text-gray/25 transition-colors">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-text-white truncate block">{task.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Status: {task.status.replace('_', ' ')}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'CRITICAL' ? 'bg-danger/10 text-danger' :
                        task.priority === 'HIGH' ? 'bg-warning/10 text-warning' :
                        'bg-bg-dark text-text-gray border border-border-dark'
                      }`}>{task.priority}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="glass-card p-6 border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Recent Projects</h3>
                <button onClick={() => navigate('/projects')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span>Project Board</span>
                  <ArrowUpRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.recent_projects.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-4">No projects found.</p>
                ) : (
                  data.recent_projects.map((proj: any) => (
                    <div key={proj.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between hover:border-text-gray/25 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-text-white block">{proj.name}</span>
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

          {/* Grid: Deadlines */}
          <div className="w-full">
            
            {/* Upcoming Deadlines */}
            <div className="glass-card p-6 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Upcoming Deadlines</h3>
              <div className="space-y-2">
                {data.upcoming_deadlines.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-4">No upcoming deadlines.</p>
                ) : (
                  data.upcoming_deadlines.map((task: any) => (
                    <div key={task.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-text-white block">{task.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Due: {task.due_date}</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-danger/10 text-danger font-bold border border-danger/10">Urgent</span>
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
            <div className="glass-card p-6 lg:col-span-1 border border-border-dark">
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
                        contentStyle={{ backgroundColor: 'var(--color-card-dark)', borderColor: 'var(--color-border-dark)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--color-text-white)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-gray)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Project progress (Line Chart) */}
            <div className="glass-card p-6 lg:col-span-2 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">My Project Progress</h3>
              <div className="h-64">
                {projectData.length === 0 ? (
                  <p className="text-xs text-text-gray text-center py-24 italic">No projects assigned.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-dark)" />
                      <XAxis dataKey="name" stroke="var(--color-text-gray)" fontSize={10} />
                      <YAxis stroke="var(--color-text-gray)" fontSize={11} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-dark)', borderColor: 'var(--color-border-dark)', borderRadius: '8px' }} itemStyle={{ color: 'var(--color-text-white)' }} />
                      <Line type="monotone" dataKey="completion" stroke="var(--color-primary)" strokeWidth={2} activeDot={{ r: 8 }} name="Completion rate (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Grid: My Tasks, My Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* My Tasks */}
            <div className="glass-card p-6 border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">My Active Tasks</h3>
                <button onClick={() => navigate('/tasks')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span>Go to Tasks</span>
                  <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.my_tasks.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">You have no pending tasks assigned.</p>
                ) : (
                  data.my_tasks.map((task: any) => (
                    <div key={task.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between hover:border-text-gray/25 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-text-white block">{task.name}</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Status: {task.status.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-text-white">{task.completion_percentage}%</span>
                        <span className="text-[9px] text-text-gray block mt-0.5">Progress</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Projects */}
            <div className="glass-card p-6 border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">My Projects</h3>
                <button onClick={() => navigate('/projects')} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span>View Projects</span>
                  <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {data.my_projects.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">You are not assigned to any projects.</p>
                ) : (
                  data.my_projects.map((proj: any) => (
                    <div key={proj.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between hover:border-text-gray/25 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-text-white block">{proj.name}</span>
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
            <div className="glass-card p-6 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Due Today</h3>
              <div className="space-y-2">
                {data.due_today.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">Nothing due today. Keep it up!</p>
                ) : (
                  data.due_today.map((task: any) => (
                    <div key={task.id} className="p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-text-white block">{task.name}</span>
                        <span className="text-[9px] text-danger block mt-0.5">Action required today</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-danger text-white font-bold">Due</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Updates / Notification Center */}
            <div className="glass-card p-6 border border-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {data.recent_updates.length === 0 ? (
                  <p className="text-xs text-text-gray italic text-center py-6">No new updates.</p>
                ) : (
                  data.recent_updates.map((notif: any) => (
                    <div key={notif.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Bell size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-text-white block">{notif.title}</span>
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
