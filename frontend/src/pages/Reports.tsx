import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  Loader2, AlertCircle, FileText, CheckCircle2, 
  TrendingUp, Users, Download, Calendar, Briefcase, Award, ArrowRight
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const isManagement = user?.role && ['ADMIN', 'CHIEF', 'MANAGEMENT'].includes(user.role);

  // Core stats states
  const [execData, setExecData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'executive' | 'periodic' | 'individual'>(
    isManagement ? 'executive' : 'individual'
  );

  // Periodic states
  const [periodicType, setPeriodicType] = useState<'weekly' | 'monthly'>('weekly');
  const [periodicData, setPeriodicData] = useState<any>(null);
  const [periodicLoading, setPeriodicLoading] = useState(false);

  // Individual states
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    isManagement ? '' : user?.id?.toString() || ''
  );
  const [memberData, setMemberData] = useState<any>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  // Fetch initial executive data & profiles
  const fetchInitialData = async () => {
    try {
      if (isManagement) {
        const [execRes, profilesRes] = await Promise.all([
          api.get('/reports/'),
          api.get('/team/profiles/')
        ]);
        setExecData(execRes.data);
        setProfiles(profilesRes.data);
      } else {
        // Fetch own report directly
        setMemberLoading(true);
        const res = await api.get('/reports/?type=individual');
        setMemberData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [isManagement]);

  // Fetch periodic reports (weekly/monthly)
  const fetchPeriodicReport = async (type: 'weekly' | 'monthly') => {
    setPeriodicLoading(true);
    try {
      const res = await api.get(`/reports/?type=${type}`);
      setPeriodicData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setPeriodicLoading(false);
    }
  };

  useEffect(() => {
    if (isManagement && activeTab === 'periodic') {
      fetchPeriodicReport(periodicType);
    }
  }, [activeTab, periodicType]);

  // Fetch individual report
  const fetchIndividualReport = async (userId: string) => {
    if (!userId) {
      setMemberData(null);
      return;
    }
    setMemberLoading(true);
    try {
      const res = await api.get(`/reports/?type=individual&user_id=${userId}`);
      setMemberData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    if (isManagement && activeTab === 'individual' && selectedMemberId) {
      fetchIndividualReport(selectedMemberId);
    }
  }, [activeTab, selectedMemberId]);

  // Printable layout PDF compiler
  const handleDownloadPDF = (title: string, elementId: string) => {
    const content = document.getElementById(elementId);
    if (!content) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    
    doc.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 22px;
              font-weight: bold;
              color: #1e3a8a;
            }
            .subtitle {
              font-size: 11px;
              color: #64748b;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 25px;
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              font-size: 12px;
            }
            .meta-item label {
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
              color: #64748b;
              display: block;
            }
            .meta-item span {
              font-size: 13px;
              font-weight: 500;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 25px;
            }
            .stat-card {
              border: 1px solid #e2e8f0;
              padding: 12px;
              border-radius: 8px;
              text-align: center;
              background: #fff;
            }
            .stat-val {
              font-size: 18px;
              font-weight: bold;
              color: #1e3a8a;
            }
            .stat-lbl {
              font-size: 10px;
              color: #64748b;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              color: #1e3a8a;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              margin-top: 25px;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            th {
              background: #f1f5f9;
              font-weight: bold;
              text-align: left;
              padding: 8px;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            .badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .badge-completed { background: #dcfce7; color: #15803d; }
            .badge-pending { background: #fef9c3; color: #a16207; }
            .badge-progress { background: #dbeafe; color: #1d4ed8; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">MaAngo Tech Labs ERP</div>
              <div class="subtitle">${title}</div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 10px; color: #64748b">Report Generated On</div>
              <div style="font-size: 12px; font-weight: bold">${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          ${content.innerHTML}
        </body>
      </html>
    `);
    
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Pie chart data helper
  const getPieData = () => {
    if (!execData) return [];
    return [
      { name: 'Pending', value: execData.task_completion.pending || 0, color: '#f59e0b' },
      { name: 'In Progress', value: execData.task_completion.in_progress || 0, color: '#3b82f6' },
      { name: 'Review', value: execData.task_completion.review || 0, color: '#8b5cf6' },
      { name: 'Completed', value: execData.task_completion.completed || 0, color: '#10b981' },
    ].filter(item => item.value > 0);
  };

  const pieData = getPieData();

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-border-dark/45 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ERP Work Reports</h1>
          <p className="text-sm text-text-gray mt-1">
            {isManagement 
              ? "Access periodic summaries, employee performance, and export detailed printable reports." 
              : "Review your personal milestones, task progression logs, and generate PDF copies."}
          </p>
        </div>
      </div>

      {/* Tabs list (Managers only) */}
      {isManagement && (
        <div className="flex gap-2 border-b border-border-dark pb-1 text-xs">
          <button
            onClick={() => setActiveTab('executive')}
            className={`pb-2 px-3 border-b-2 font-medium transition-all cursor-pointer ${
              activeTab === 'executive' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('periodic')}
            className={`pb-2 px-3 border-b-2 font-medium transition-all cursor-pointer ${
              activeTab === 'periodic' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Weekly / Monthly Reports
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`pb-2 px-3 border-b-2 font-medium transition-all cursor-pointer ${
              activeTab === 'individual' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Team Member Reports
          </button>
        </div>
      )}

      {/* Tab Content: Executive Summary (Managers only) */}
      {isManagement && activeTab === 'executive' && execData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress Chart */}
          <div className="glass-card p-6 rounded-2xl border border-border-dark">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Project Completion Rates</h3>
            </div>
            <div className="h-64">
              {execData.project_progress.length === 0 ? (
                <p className="text-xs text-text-gray text-center py-24 italic">No projects found.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={execData.project_progress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Line type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} name="Completion rate (%)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Task status pie chart */}
          <div className="glass-card p-6 rounded-2xl border border-border-dark">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Overall Task Completion Status</h3>
            </div>
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
                      innerRadius={50}
                      outerRadius={75}
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

          {/* Employee Productivity Bar Chart */}
          <div className="glass-card p-6 rounded-2xl border border-border-dark lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Team Member Task Productivity</h3>
            </div>
            <div className="h-64">
              {execData.employee_productivity.length === 0 ? (
                <p className="text-xs text-text-gray text-center py-24 italic">No tasks assigned to staff.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={execData.employee_productivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Tasks" />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Fellowship Progress Grid */}
          <div className="glass-card p-6 rounded-2xl border border-border-dark lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Fellowship Milestone Tracker</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-dark/60 bg-slate-950/20 text-text-gray font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Fellow Name</th>
                    <th className="px-6 py-4">Assigned Project</th>
                    <th className="px-6 py-4">Mentor / PM</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Milestone Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark/40">
                  {execData.fellowship_progress.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-text-gray italic">
                        No fellows active in the workspace.
                      </td>
                    </tr>
                  ) : (
                    execData.fellowship_progress.map((f: any) => (
                      <tr key={f.name} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4.5 font-semibold text-white">{f.name}</td>
                        <td className="px-6 py-4.5 text-gray-400 font-medium">{f.project}</td>
                        <td className="px-6 py-4.5 text-gray-400">{f.mentor}</td>
                        <td className="px-6 py-4.5 text-gray-400">{f.deadline ? new Date(f.deadline).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            f.status === 'ACTIVE' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' :
                            'bg-amber-950/40 text-amber-400 border-amber-900/30'
                          }`}>{f.status}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${f.progress}%` }}
                              />
                            </div>
                            <span className="font-bold text-[10px] text-text-gray">{f.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Weekly / Monthly Periodic Reports */}
      {isManagement && activeTab === 'periodic' && (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="flex items-center justify-between bg-slate-950/40 p-4 border border-border-dark rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPeriodicType('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  periodicType === 'weekly' ? 'bg-primary text-white' : 'bg-slate-900 text-gray-400 hover:text-white border border-border-dark'
                }`}
              >
                Weekly Report
              </button>
              <button
                onClick={() => setPeriodicType('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  periodicType === 'monthly' ? 'bg-primary text-white' : 'bg-slate-900 text-gray-400 hover:text-white border border-border-dark'
                }`}
              >
                Monthly Report
              </button>
            </div>
            {periodicData && (
              <button
                onClick={() => handleDownloadPDF(`${periodicType === 'weekly' ? 'Weekly' : 'Monthly'} ERP Work Report`, 'periodic-report-print')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Export PDF</span>
              </button>
            )}
          </div>

          {periodicLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : periodicData ? (
            <div id="periodic-report-print" className="space-y-6 bg-card-dark/60 p-6 rounded-2xl border border-border-dark">
              
              {/* Stats overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-border-dark/60 text-center">
                  <span className="text-[10px] text-text-gray font-bold uppercase tracking-wider block">Duration Period</span>
                  <span className="text-base font-bold text-white mt-1 block">Last {periodicData.period_days} Days</span>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-border-dark/60 text-center">
                  <span className="text-[10px] text-text-gray font-bold uppercase tracking-wider block">Total Tasks Created</span>
                  <span className="text-lg font-bold text-primary mt-1 block">{periodicData.total_created}</span>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-border-dark/60 text-center">
                  <span className="text-[10px] text-text-gray font-bold uppercase tracking-wider block">Total Tasks Completed</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">{periodicData.total_completed}</span>
                </div>
              </div>

              {/* Projects impact table */}
              <div className="space-y-3">
                <div className="section-title text-xs font-bold text-primary uppercase tracking-wider">Project Activity Breakdowns</div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-dark bg-slate-950/20 text-text-gray font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Project Name</th>
                        <th className="p-3 text-center">Tasks Created</th>
                        <th className="p-3 text-center">Tasks Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark/40">
                      {periodicData.project_stats.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-3 font-semibold text-white">{p.name}</td>
                          <td className="p-3 text-center text-primary font-bold">{p.created_count}</td>
                          <td className="p-3 text-center text-emerald-400 font-bold">{p.completed_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Created Tasks details list */}
              <div className="space-y-3">
                <div className="section-title text-xs font-bold text-primary uppercase tracking-wider">Tasks Created Within Period</div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-dark bg-slate-950/20 text-text-gray font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Task Name</th>
                        <th className="p-3">Project</th>
                        <th className="p-3">Assigned To</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark/40">
                      {periodicData.tasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-text-gray italic">No tasks logged during this period.</td>
                        </tr>
                      ) : (
                        periodicData.tasks.map((t: any) => (
                          <tr key={t.id}>
                            <td className="p-3 font-semibold text-white">{t.name}</td>
                            <td className="p-3 text-gray-400">{t.project}</td>
                            <td className="p-3 text-gray-400">{t.assigned_to}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                t.priority === 'HIGH' ? 'bg-red-950/40 text-red-400 border border-red-900/30' :
                                t.priority === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                                'bg-slate-950/40 text-gray-400 border border-slate-900'
                              }`}>{t.priority}</span>
                            </td>
                            <td className="p-3">
                              <span className={`badge ${
                                t.status === 'COMPLETED' ? 'badge-completed' :
                                t.status === 'IN_PROGRESS' ? 'badge-progress' :
                                'badge-pending'
                              }`}>{t.status.replace('_', ' ')}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      )}

      {/* Tab Content: Team Member / Personal Reports */}
      {(activeTab === 'individual') && (
        <div className="space-y-6">
          
          {/* Select bar for managers */}
          {isManagement && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/40 p-4 border border-border-dark rounded-xl gap-4">
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Users size={16} className="text-gray-400" />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-border-dark rounded-xl text-xs focus:border-primary outline-none text-white cursor-pointer"
                >
                  <option value="">Select Team Member...</option>
                  {(Array.isArray(profiles) ? profiles : (profiles as any)?.results || []).map((p: any) => (
                    <option key={p.id} value={p.user}>
                      {p.name} ({p.user_details?.role})
                    </option>
                  ))}
                </select>
              </div>
              {memberData && (
                <button
                  onClick={() => handleDownloadPDF(`${memberData.employee.name} Work Progress Report`, 'individual-report-print')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Download size={13} />
                  <span>Export PDF</span>
                </button>
              )}
            </div>
          )}

          {/* PDF Download option for normal employees */}
          {!isManagement && memberData && (
            <div className="flex justify-end">
              <button
                onClick={() => handleDownloadPDF(`${memberData.employee.name} Personal Work Report`, 'individual-report-print')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Export PDF Report</span>
              </button>
            </div>
          )}

          {memberLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : memberData ? (
            <div id="individual-report-print" className="space-y-6 bg-card-dark/60 p-6 rounded-2xl border border-border-dark">
              
              {/* Member details card banner */}
              <div className="flex flex-col sm:flex-row justify-between bg-slate-900/60 p-5 rounded-xl border border-border-dark/60 gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">{memberData.employee.name}</h2>
                  <p className="text-xs text-text-gray">{memberData.employee.email}</p>
                  <p className="text-[10px] text-text-gray font-semibold uppercase tracking-wider">{memberData.employee.role} • {memberData.employee.department}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[9px] text-text-gray font-bold uppercase tracking-wider block">Performance Score</span>
                    <span className="text-2xl font-bold text-primary">{memberData.stats.completion_pct}%</span>
                  </div>
                  <div className="h-10 w-[2px] bg-border-dark/60 hidden sm:block" />
                  <div className="text-right">
                    <span className="text-[9px] text-text-gray font-bold uppercase tracking-wider block">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block mt-0.5 ${
                      memberData.employee.status === 'ACTIVE' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' :
                      'bg-amber-950/40 text-amber-400 border-amber-900/30'
                    }`}>{memberData.employee.status}</span>
                  </div>
                </div>
              </div>

              {/* Fellowship progress tracker if member is a fellow */}
              {memberData.fellowship && memberData.fellowship.project_name && (
                <div className="p-4 bg-slate-950/20 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Award size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Fellowship Milestone Status</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-text-gray text-[9px] uppercase font-bold block">Assigned Project</span>
                      <span className="text-white font-medium">{memberData.fellowship.project_name}</span>
                    </div>
                    <div>
                      <span className="text-text-gray text-[9px] uppercase font-bold block">Mentor / PM</span>
                      <span className="text-white font-medium">{memberData.fellowship.mentor_name}</span>
                    </div>
                    <div>
                      <span className="text-text-gray text-[9px] uppercase font-bold block">Project Deadline</span>
                      <span className="text-white font-medium">{memberData.fellowship.deadline ? new Date(memberData.fellowship.deadline).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-text-gray font-bold">Milestone Completion</span>
                      <span className="text-primary font-bold">{memberData.fellowship.progress_pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${memberData.fellowship.progress_pct}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Core numbers */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-border-dark/40">
                  <span className="text-[9px] text-text-gray font-bold uppercase block">Total Work Tasks</span>
                  <span className="text-base font-bold text-white mt-1 block">{memberData.stats.total}</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-border-dark/40">
                  <span className="text-[9px] text-text-gray font-bold uppercase block">Completed Work Tasks</span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block">{memberData.stats.completed}</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-border-dark/40">
                  <span className="text-[9px] text-text-gray font-bold uppercase block">Pending Work Tasks</span>
                  <span className="text-base font-bold text-amber-400 mt-1 block">{memberData.stats.pending}</span>
                </div>
              </div>

              {/* Pending Checklist */}
              <div className="space-y-3">
                <div className="section-title text-xs font-bold text-primary uppercase tracking-wider">Pending Work Tasks Checklist</div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-dark bg-slate-950/20 text-text-gray font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Task Title</th>
                        <th className="p-3">Assigned Project</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark/40">
                      {memberData.pending_tasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-text-gray italic">No pending tasks. All caught up!</td>
                        </tr>
                      ) : (
                        memberData.pending_tasks.map((t: any) => (
                          <tr key={t.id}>
                            <td className="p-3 font-semibold text-white">{t.name}</td>
                            <td className="p-3 text-gray-400">{t.project}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                t.priority === 'HIGH' ? 'bg-red-950/40 text-red-400 border border-red-900/30' :
                                t.priority === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                                'bg-slate-950/40 text-gray-400 border border-slate-900'
                              }`}>{t.priority}</span>
                            </td>
                            <td className="p-3">
                              <span className="badge badge-progress">{t.status.replace('_', ' ')}</span>
                            </td>
                            <td className="p-3 text-gray-400">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Completed checklist */}
              <div className="space-y-3">
                <div className="section-title text-xs font-bold text-primary uppercase tracking-wider">Completed Work History</div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-dark bg-slate-950/20 text-text-gray font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Task Title</th>
                        <th className="p-3">Assigned Project</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Completed Date / Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark/40">
                      {memberData.completed_tasks.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-text-gray italic">No tasks completed yet.</td>
                        </tr>
                      ) : (
                        memberData.completed_tasks.map((t: any) => (
                          <tr key={t.id}>
                            <td className="p-3 font-semibold text-white">{t.name}</td>
                            <td className="p-3 text-gray-400">{t.project}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                t.priority === 'HIGH' ? 'bg-red-950/40 text-red-400 border border-red-900/30' :
                                t.priority === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                                'bg-slate-950/40 text-gray-400 border border-slate-900'
                              }`}>{t.priority}</span>
                            </td>
                            <td className="p-3 text-gray-400">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 border border-border-dark rounded-xl text-text-gray">
              Select a team member to view their individual performance report.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
