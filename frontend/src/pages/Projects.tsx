import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FolderClosed, Search, Plus, Trash2, X, Calendar, 
  Clock, AlertCircle, ChevronRight, User, Users,
  CheckCircle, ListTodo, FileText, Loader2, ArrowRight,
  ArrowLeft, ExternalLink, Globe, GitBranch, Play,
  Settings2, Activity, FileUp, Check, Square, CheckSquare,
  Lock, AlertTriangle, FileSpreadsheet, LockOpen, Info, Edit, List, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode Preferences (Grid vs List/Table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('projects_view_mode') as 'grid' | 'table') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('projects_view_mode', viewMode);
  }, [viewMode]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterType, setFilterType] = useState<'my' | 'all'>(
    user?.role === 'FELLOW' || user?.role === 'EMPLOYEE' || user?.role === 'INTERN' ? 'my' : 'all'
  );

  // Selected project details (Workspace view)
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'workflow' | 'overview' | 'tasks' | 'team' | 'activity' | 'files' | 'settings'>('workflow');
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [projectLogs, setProjectLogs] = useState<any[]>([]);

  // Workflow Page Specifics
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  
  // Deliverable Submission Form State
  const [submittingDelId, setSubmittingDelId] = useState<number | null>(null);
  const [delTextVal, setDelTextVal] = useState<string>('');
  const [delFileVal, setDelFileVal] = useState<File | null>(null);
  const [checklistItems, setChecklistItems] = useState<{ text: string; done: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState<string>('');

  // Deliverable Approval Form State
  const [approvingDelId, setApprovingDelId] = useState<number | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState<string>('');

  // Validation Modal State for Stage Completion
  const [validationModalStage, setValidationModalStage] = useState<any>(null);
  const [overrideAllowed, setOverrideAllowed] = useState(false);
  const [confirmStageId, setConfirmStageId] = useState<number | null>(null);

  // Modal open states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Project States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editStatus, setEditStatus] = useState('PLANNING');
  const [editManager, setEditManager] = useState('');

  // New Project Form states
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formDue, setFormDue] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formWorkflow, setFormWorkflow] = useState('');
  const [formManager, setFormManager] = useState('');

  // Task creation inside Tasks tab
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssigned, setNewTaskAssigned] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

  // Role Checks
  const isAdmin = user?.role === 'ADMIN';
  const isManagement = !!(user?.role && ['ADMIN', 'CHIEF', 'MANAGEMENT'].includes(user.role));

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/projects/');
      const projectsList = pRes.data.results || pRes.data || [];
      setProjects(projectsList);

      const uRes = await api.get('/auth/users/');
      setUsers(uRes.data.results || uRes.data || []);

      const wfRes = await api.get('/projects/workflows/');
      const wfList = wfRes.data.results || wfRes.data || [];
      setWorkflows(wfList);
      if (wfList.length > 0) {
        setFormWorkflow(wfList[0].id.toString());
      }

      // Check URL parameters for redirection
      const queryParams = new URLSearchParams(window.location.search);
      const projId = queryParams.get('id');
      const createParam = queryParams.get('create');

      if (createParam === 'true') {
        setIsCreateOpen(true);
      } else if (projId) {
        const found = projectsList.find((p: any) => p.id === parseInt(projId));
        if (found) {
          handleOpenProject(found);
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

  const fetchProjectDetails = async (projectId: number) => {
    try {
      const pRes = await api.get(`/projects/${projectId}/`);
      const updatedProj = pRes.data;
      setSelectedProject(updatedProj);
      
      // Select the active stage or default to first stage
      if (updatedProj.stages && updatedProj.stages.length > 0) {
        const activeStage = updatedProj.stages.find((s: any) => s.status === 'ACTIVE');
        if (activeStage) {
          setSelectedStageId(activeStage.id);
        } else {
          setSelectedStageId(updatedProj.stages[0].id);
        }
      }

      // Sync project list
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProj : p));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjectTasks = async (projectId: number) => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks/`);
      setProjectTasks(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjectLogs = async (projectId: number) => {
    try {
      const res = await api.get(`/projects/${projectId}/activity/`);
      setProjectLogs(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenProject = (project: any) => {
    setSelectedProject(project);
    setWorkspaceTab('workflow');
    fetchProjectTasks(project.id);
    fetchProjectLogs(project.id);
    
    if (project.stages && project.stages.length > 0) {
      const activeStage = project.stages.find((s: any) => s.status === 'ACTIVE');
      if (activeStage) {
        setSelectedStageId(activeStage.id);
      } else {
        setSelectedStageId(project.stages[0].id);
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/projects/', {
        name: formName,
        description: formDesc,
        client: formClient,
        start_date: formStart || null,
        end_date: formDue || null,
        priority: formPriority,
        workflow: formWorkflow ? parseInt(formWorkflow) : null,
        project_manager: formManager ? parseInt(formManager) : null,
      });

      setIsCreateOpen(false);
      setFormName('');
      setFormDesc('');
      setFormClient('');
      setFormStart('');
      setFormDue('');
      setFormManager('');

      fetchData();
      
      const newProj = res.data;
      if (newProj && newProj.id) {
        handleOpenProject(newProj);
      }
    } catch (err) {
      alert("Error creating project: " + JSON.stringify(err));
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      await api.patch(`/projects/${editingProject.id}/`, {
        name: editName,
        description: editDesc,
        client: editClient,
        start_date: editStart || null,
        end_date: editDue || null,
        priority: editPriority,
        status: editStatus,
        project_manager: editManager ? parseInt(editManager) : null
      });

      setIsEditOpen(false);
      setEditingProject(null);
      fetchData();
      
      if (selectedProject?.id === editingProject.id) {
        fetchProjectDetails(editingProject.id);
      }
    } catch (err) {
      alert("Error updating project: " + JSON.stringify(err));
    }
  };

  const handleDeleteProject = async (projId: number) => {
    if (!window.confirm("Delete this project? This will permanently delete all stages, deliverables, and linked tasks.")) return;
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

  // Deliverable Actions
  const handleOpenSubmission = (deliverable: any) => {
    setSubmittingDelId(deliverable.id);
    setDelTextVal(deliverable.value_text || '');
    setDelFileVal(null);
    if (deliverable.deliverable_type === 'CHECKLIST') {
      try {
        const parsed = JSON.parse(deliverable.value_text);
        setChecklistItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setChecklistItems([]);
      }
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklistItems(prev => [...prev, { text: newChecklistItem.trim(), done: false }]);
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.map((item, idx) => idx === index ? { ...item, done: !item.done } : item));
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitDeliverable = async (deliverableId: number) => {
    if (!selectedProject) return;
    const formData = new FormData();
    formData.append('deliverable_id', deliverableId.toString());

    if (checklistItems.length > 0) {
      formData.append('value_text', JSON.stringify(checklistItems));
    } else {
      formData.append('value_text', delTextVal);
    }

    if (delFileVal) {
      formData.append('value_file', delFileVal);
    }

    try {
      await api.post(`/projects/${selectedProject.id}/submit-deliverable/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmittingDelId(null);
      setDelTextVal('');
      setDelFileVal(null);
      setChecklistItems([]);
      fetchProjectDetails(selectedProject.id);
      fetchProjectLogs(selectedProject.id);
    } catch (e) {
      console.error(e);
      alert("Failed to submit deliverable.");
    }
  };

  const handleApproveDeliverable = async (deliverableId: number, statusVal: 'APPROVED' | 'REJECTED') => {
    if (!selectedProject) return;
    try {
      await api.post(`/projects/${selectedProject.id}/approve-deliverable/`, {
        deliverable_id: deliverableId,
        status: statusVal,
        remarks: approvalRemarks
      });
      setApprovingDelId(null);
      setApprovalRemarks('');
      fetchProjectDetails(selectedProject.id);
      fetchProjectLogs(selectedProject.id);
    } catch (e) {
      console.error(e);
      alert("Failed to review deliverable.");
    }
  };

  // Stage Completion Actions
  const handleRequestCompleteStage = (stage: any) => {
    const missing = stage.deliverables.filter((d: any) => d.is_required && d.status !== 'APPROVED');
    // Admin user bypasses gates directly without block
    if (missing.length > 0 && !isAdmin) {
      setValidationModalStage(stage);
      setOverrideAllowed(isManagement);
    } else {
      handleCompleteStage(stage.id, false);
    }
  };

  const handleCompleteStage = async (stageId: number, override: boolean) => {
    if (!selectedProject) return;
    try {
      await api.post(`/projects/${selectedProject.id}/complete-stage/`, {
        stage_id: stageId,
        override: override
      });
      setValidationModalStage(null);
      fetchProjectDetails(selectedProject.id);
      fetchProjectTasks(selectedProject.id);
      fetchProjectLogs(selectedProject.id);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to complete stage.");
    }
  };

  const handleSetStage = async (stageId: number) => {
    if (!selectedProject) return;
    try {
      await api.post(`/projects/${selectedProject.id}/set-stage/`, {
        stage_id: stageId
      });
      fetchProjectDetails(selectedProject.id);
      fetchProjectTasks(selectedProject.id);
      fetchProjectLogs(selectedProject.id);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to set active stage.");
    }
  };

  const handleToggleDeveloper = async (userId: number) => {
    if (!selectedProject) return;
    const currentDevs = selectedProject.developers || [];
    const newDevs = currentDevs.includes(userId)
      ? currentDevs.filter((id: number) => id !== userId)
      : [...currentDevs, userId];
      
    try {
      await api.patch(`/projects/${selectedProject.id}/`, {
        developers: newDevs
      });
      fetchProjectDetails(selectedProject.id);
    } catch (e) {
      console.error(e);
      alert("Failed to update project developers.");
    }
  };

  const handleToggleMember = async (userId: number) => {
    if (!selectedProject) return;
    const currentMembers = selectedProject.members || [];
    const newMembers = currentMembers.includes(userId)
      ? currentMembers.filter((id: number) => id !== userId)
      : [...currentMembers, userId];
      
    try {
      await api.patch(`/projects/${selectedProject.id}/`, {
        members: newMembers
      });
      fetchProjectDetails(selectedProject.id);
    } catch (e) {
      console.error(e);
      alert("Failed to update project observers.");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}/`);
      if (selectedProject) {
        fetchProjectTasks(selectedProject.id);
        fetchProjectDetails(selectedProject.id);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete task.");
    }
  };

  // Task Creation inside Tasks tab
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskName.trim()) return;
    try {
      await api.post('/tasks/', {
        name: newTaskName,
        description: newTaskDesc,
        project: selectedProject.id,
        assigned_to: newTaskAssigned ? parseInt(newTaskAssigned) : null,
        priority: newTaskPriority,
        status: 'PENDING',
        completion_percentage: 0
      });
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskAssigned('');
      setIsAddTaskOpen(false);
      fetchProjectTasks(selectedProject.id);
    } catch (e) {
      console.error(e);
      alert("Failed to create task.");
    }
  };

  // Filter projects list
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.client && p.client.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    
    const matchesScope = filterType === 'all' || 
      p.project_manager === user?.id || 
      (p.developers && p.developers.some((d: any) => d === user?.id)) || 
      (p.members && p.members.some((m: any) => m === user?.id));

    return matchesSearch && matchesPriority && matchesStatus && matchesScope;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-danger/10 text-danger border-danger/20';
      case 'HIGH': return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-text-gray/10 text-text-gray border-border-dark';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-success/15 text-success border-success/20';
      case 'IN_PROGRESS': return 'bg-primary/15 text-primary border-primary/20';
      case 'ON_HOLD': return 'bg-warning/15 text-warning border-warning/20';
      case 'CANCELLED': return 'bg-danger/15 text-danger border-danger/20';
      default: return 'bg-text-gray/15 text-text-gray border-border-dark';
    }
  };

  const getDeliverableStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-success/10 text-success border-success/20';
      case 'SUBMITTED': return 'bg-warning/10 text-warning border-warning/20';
      case 'REJECTED': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-text-gray/10 text-text-gray border-border-dark';
    }
  };

  // Calculated Project Readiness
  const calculateReadiness = (project: any) => {
    if (!project || !project.stages) return { percentage: 0, items: [] };
    const items = [
      { label: 'Basic Details Configured', done: !!project.description && !!project.client },
      { label: 'Project Team Assigned', done: (project.developers && project.developers.length > 0) || !!project.project_manager },
      { label: 'Initial Workflow Created', done: project.stages.length > 0 }
    ];
    
    project.stages.forEach((stage: any) => {
      items.push({
        label: `Stage completed: ${stage.name}`,
        done: stage.status === 'COMPLETED'
      });
    });

    const doneCount = items.filter(i => i.done).length;
    const percentage = Math.round((doneCount / items.length) * 100);
    return { percentage, items };
  };

  const readiness = calculateReadiness(selectedProject);

  // Dynamic checks for the active workspace
  const isPM = selectedProject?.project_manager === user?.id;
  const canApprove = isPM || isManagement;
  const canComplete = isPM || isManagement;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedProject ? (
          // PROJECT LIST VIEW
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-white font-sans">Workspace Operating System</h1>
                <p className="text-sm text-text-gray mt-1">
                  Manage stage-gated client lifecycle, design blueprints, repositories, and deliverables.
                </p>
              </div>
              {isManagement && (
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="btn-primary"
                >
                  <Plus size={16} />
                  <span>Create Project</span>
                </button>
              )}
            </div>

            {/* Scope Toggle & Filter Inputs */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* View Switcher */}
                <div className="flex gap-1 bg-bg-dark p-1 rounded-xl border border-border-dark text-xs font-semibold w-fit">
                  <button 
                    onClick={() => setFilterType('my')}
                    className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${filterType === 'my' ? 'bg-primary text-white' : 'text-text-gray hover:text-text-white'}`}
                  >
                    My Projects
                  </button>
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${filterType === 'all' ? 'bg-primary text-white' : 'text-text-gray hover:text-text-white'}`}
                  >
                    All Projects
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-gray" size={16} />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name or client..."
                      className="w-full pl-9 pr-4 py-2 bg-bg-dark border border-border-dark rounded-xl text-xs outline-none focus:border-primary text-text-white placeholder-text-gray/50 transition-all"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-bg-dark border border-border-dark rounded-xl text-xs outline-none text-text-gray focus:border-primary cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 bg-bg-dark border border-border-dark rounded-xl text-xs outline-none text-text-gray focus:border-primary cursor-pointer"
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>

                  {/* Grid/List View Toggle */}
                  <div className="flex bg-bg-dark border border-border-dark p-1 rounded-xl text-xs font-semibold gap-1">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-gray hover:text-white'}`}
                      title="Grid View"
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button 
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewMode === 'table' ? 'bg-primary text-white' : 'text-text-gray hover:text-white'}`}
                      title="List View"
                    >
                      <List size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20 bg-card-dark rounded-[20px] border border-border-dark shadow-sm">
                <FolderClosed className="mx-auto text-text-gray/60 mb-4" size={48} />
                <h3 className="font-semibold text-base text-text-white">No projects found</h3>
                <p className="text-xs text-text-gray mt-1">Refine your search or create a new project scope.</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto bg-card-dark border border-border-dark rounded-[20px] shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-dark bg-bg-dark text-text-gray font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4">Project Scope</th>
                      <th className="px-6 py-4">Lead PM</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Tasks Progress</th>
                      <th className="px-6 py-4">Timeline</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {filteredProjects.map((p) => {
                      const pmName = p.project_manager_details?.first_name || p.project_manager_details?.email.split('@')[0] || 'Unassigned';
                      const progressVal = p.completion_percentage || 0;
                      return (
                        <tr 
                          key={p.id}
                          onClick={() => handleOpenProject(p)}
                          className="hover:bg-bg-dark transition-colors cursor-pointer text-text-white h-14"
                        >
                          <td className="px-6 py-4 font-semibold text-text-white">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold hover:text-primary transition-colors">{p.name}</span>
                              <span className="text-[10px] text-text-gray mt-0.5">Client: {p.client || 'Internal'} • {p.project_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-gray font-medium">
                            {pmName}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(p.priority)}`}>
                              {p.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(p.status)}`}>
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="flex-1 h-1 bg-bg-dark rounded-full overflow-hidden border border-border-dark">
                                <div 
                                  className="h-full bg-maango-gradient transition-all duration-300"
                                  style={{ width: `${progressVal}%` }}
                                />
                              </div>
                              <span className="font-bold text-[10px] text-text-gray">{progressVal}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-gray font-mono">
                            {p.start_date && p.end_date ? `${p.start_date} → ${p.end_date}` : 'No deadline'}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isManagement && (
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setEditingProject(p);
                                      setEditName(p.name);
                                      setEditClient(p.client || '');
                                      setEditDesc(p.description || '');
                                      setEditStart(p.start_date || '');
                                      setEditDue(p.end_date || '');
                                      setEditPriority(p.priority);
                                      setEditStatus(p.status);
                                      setEditManager(p.project_manager?.toString() || '');
                                      setIsEditOpen(true);
                                    }}
                                    className="p-1.5 text-text-gray hover:text-primary hover:bg-bg-dark border border-transparent hover:border-border-dark rounded-lg transition-colors cursor-pointer"
                                    title="Edit Basic Details"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProject(p.id)}
                                    className="p-1.5 text-text-gray hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Project"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                              <button 
                                onClick={() => handleOpenProject(p)}
                                className="p-1.5 text-primary hover:bg-primary/10 border border-transparent rounded-lg transition-colors cursor-pointer"
                                title="Open Workspace"
                              >
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((p) => {
                  const activeStage = p.stages?.find((s: any) => s.status === 'ACTIVE');
                  const pmName = p.project_manager_details?.first_name || p.project_manager_details?.email.split('@')[0] || 'Unassigned';
                  const progressVal = p.completion_percentage || 0;
                  
                  return (
                    <div 
                      key={p.id}
                      className="kpi-card relative overflow-hidden flex flex-col justify-between border border-border-dark hover:border-primary/40 group transition-all pt-7"
                    >
                      {/* Top border progress bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-bg-dark overflow-hidden">
                        <div 
                          className="h-full bg-maango-gradient transition-all duration-300" 
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>

                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <FolderClosed size={18} />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border border-current uppercase tracking-wide ${getStatusColor(p.status)}`}>
                              {p.status.replace('_', ' ')}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                              p.health_status === 'DELAYED' ? 'bg-danger/10 text-danger border-danger/15' :
                              p.health_status === 'AT_RISK' ? 'bg-warning/10 text-warning border-warning/15' :
                              'bg-success/10 text-success border-success/15'
                            }`}>
                              {p.health_status ? p.health_status.replace('_', ' ') : 'ON TRACK'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <h3 className="font-bold text-base mt-4 text-text-white line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-text-gray bg-bg-dark px-2 py-0.5 rounded border border-border-dark">
                            Client: {p.client || 'Internal'}
                          </span>
                          {p.project_type && (
                            <span className="text-[10px] text-text-gray bg-bg-dark px-2 py-0.5 rounded border border-border-dark">
                              {p.project_type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-gray mt-2.5 line-clamp-2 leading-relaxed">{p.description || "No description provided."}</p>

                        {/* Current Stage */}
                        {activeStage && (
                          <div className="mt-4 p-2 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-text-gray">Current Stage:</span>
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              {activeStage.name}
                            </span>
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-4 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold">
                            <span className="text-text-gray">Tasks Completion</span>
                            <span className="text-text-white">{progressVal}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-bg-dark rounded-full overflow-hidden border border-border-dark">
                            <div className="h-full bg-maango-gradient rounded-full transition-all duration-300" style={{ width: `${progressVal}%` }} />
                          </div>
                        </div>

                        {/* Stats Counts */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-dark/50 text-[10px]">
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-text-gray">Lead PM</span>
                            <span className="text-text-white font-semibold truncate block">{pmName}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-text-gray">Timeline</span>
                            <span className="text-text-white font-semibold block truncate">
                              {p.start_date && p.end_date ? `${p.start_date} → ${p.end_date}` : 'No deadline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-border-dark/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(p.priority)}`}>
                            {p.priority}
                          </span>
                          
                          {/* Edit Project details button (management only) */}
                           {isManagement && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(p);
                                  setEditName(p.name);
                                  setEditClient(p.client || '');
                                  setEditDesc(p.description || '');
                                  setEditStart(p.start_date || '');
                                  setEditDue(p.end_date || '');
                                  setEditPriority(p.priority);
                                  setEditStatus(p.status);
                                  setEditManager(p.project_manager?.toString() || '');
                                  setIsEditOpen(true);
                                }}
                                className="p-1.5 text-text-gray hover:text-primary hover:bg-bg-dark border border-transparent hover:border-border-dark rounded-lg transition-colors cursor-pointer"
                                title="Edit Basic Details"
                              >
                                <Edit size={13} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(p.id);
                                }}
                                className="p-1.5 text-text-gray hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-colors cursor-pointer"
                                title="Delete Project"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => handleOpenProject(p)}
                          className="text-xs text-primary font-bold hover:opacity-90 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Workspace</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          // PROJECT WORKSPACE VIEW
          <motion.div 
            key="workspace"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6 relative"
          >
            {/* Workspace top border progress bar */}
            <div className="w-full h-1 bg-bg-dark -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 overflow-hidden rounded-t-[22px] border-b border-border-dark shrink-0">
              <div 
                className="h-full bg-maango-gradient transition-all duration-300" 
                style={{ width: `${selectedProject.completion_percentage || 0}%` }}
              />
            </div>

            {/* Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dark pb-5">
              <div className="space-y-1">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="flex items-center gap-1.5 text-text-gray hover:text-text-white transition-colors text-xs font-semibold mb-2 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Projects</span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-white">{selectedProject.name}</h1>
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-current uppercase ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(selectedProject.priority)}`}>
                    {selectedProject.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-text-gray">
                  Client: <span className="text-text-white font-medium">{selectedProject.client || 'Internal'}</span> • Workflow: <span className="text-text-white font-medium">{selectedProject.project_type}</span>
                </p>
              </div>

              {/* Progress/Readiness Indicators */}
              <div className="flex items-center gap-4 bg-bg-dark border border-border-dark p-3 rounded-2xl w-fit">
                <div className="text-right">
                  <span className="block text-[8px] uppercase font-bold text-text-gray">Operating Readiness</span>
                  <span className="text-lg font-bold text-text-white">{readiness.percentage}%</span>
                </div>
                <div className="h-9 w-0.5 bg-border-dark" />
                <div className="text-right">
                  <span className="block text-[8px] uppercase font-bold text-text-gray">Tasks Done</span>
                  <span className="text-lg font-bold text-primary">
                    {projectTasks.filter(t => t.status === 'COMPLETED').length} / {projectTasks.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Workspace Sub-navigation Tabs */}
            <div className="flex gap-2 border-b border-border-dark pb-1 overflow-x-auto">
              {([
                { id: 'workflow', label: 'Workflow Stages', icon: GitBranch },
                { id: 'overview', label: 'Project Readiness', icon: CheckCircle },
                { id: 'tasks', label: 'Tasks List', icon: ListTodo },
                { id: 'team', label: 'Team Members', icon: Users },
                { id: 'files', label: 'Uploaded Files', icon: FileSpreadsheet },
                { id: 'activity', label: 'Activity Logs', icon: Activity },
                { id: 'settings', label: 'Workspace Settings', icon: Settings2 }
              ] as const).map((tab) => {
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceTab(tab.id)}
                    className={`flex items-center gap-2 pb-2 px-3 border-b-2 font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
                      workspaceTab === tab.id 
                        ? 'border-primary text-primary font-bold' 
                        : 'border-transparent text-text-gray hover:text-text-white'
                    }`}
                  >
                    <IconComp size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT */}
            <div className="space-y-6">
              {/* TAB: WORKFLOW STAGES */}
              {workspaceTab === 'workflow' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                  
                  {/* Stages List (Left) */}
                  <div className="lg:col-span-1 bg-card-dark border border-border-dark p-4 rounded-3xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray pb-2 border-b border-border-dark">Workflow Stages</h3>
                    <div className="space-y-1">
                      {selectedProject.stages?.map((stage: any) => {
                        const isActive = stage.status === 'ACTIVE';
                        const isCompleted = stage.status === 'COMPLETED';
                        const isSelected = selectedStageId === stage.id;
                        
                        return (
                          <button
                            key={stage.id}
                            onClick={() => setSelectedStageId(stage.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                              isSelected 
                                ? 'bg-primary/10 border-primary text-text-white font-semibold' 
                                : 'bg-transparent border-transparent hover:bg-bg-dark text-text-gray hover:text-text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isCompleted ? (
                                <CheckCircle className="text-success shrink-0" size={15} />
                              ) : isActive ? (
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                              ) : (
                                <Lock className="text-text-gray/50 shrink-0" size={14} />
                              )}
                              <span className="text-xs truncate">{stage.sequence}. {stage.name}</span>
                            </div>
                            
                            {isActive && (
                              <span className="text-[8px] bg-primary/20 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Stage Details (Right) */}
                  {(() => {
                    const currentStage = selectedProject.stages?.find((s: any) => s.id === selectedStageId);
                    if (!currentStage) return <div className="lg:col-span-3 text-text-gray">No stage selected</div>;

                    const isActive = currentStage.status === 'ACTIVE';
                    const isCompleted = currentStage.status === 'COMPLETED';


                    return (
                      <div className="lg:col-span-3 space-y-6">
                        
                        {/* Stage Info Card */}
                        <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-dark">
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-text-white">{currentStage.name} Stage</h2>
                                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                                  isCompleted ? 'bg-success/10 text-success border-success/20' :
                                  isActive ? 'bg-primary/10 text-primary border-primary/20' :
                                  'bg-text-gray/10 text-text-gray border-border-dark'
                                }`}>
                                  {currentStage.status}
                                </span>
                              </div>
                              <p className="text-xs text-text-gray mt-1">Stage {currentStage.sequence} of {selectedProject.stages.length} in project lifecycle.</p>
                            </div>

                            {/* Stage Lead PM metadata */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[10px] font-bold text-text-gray uppercase">Project Lead PM:</span>
                              <span className="font-semibold text-text-white bg-bg-dark border border-border-dark px-2.5 py-1 rounded-xl">
                                {selectedProject.project_manager_details?.email || 'Unassigned'}
                              </span>
                            </div>
                          </div>

                          {/* Info bar */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="bg-bg-dark p-3 rounded-2xl border border-border-dark">
                              <span className="block text-[8px] uppercase font-bold text-text-gray">Completed Deliverables</span>
                              <span className="text-sm font-semibold text-text-white mt-1 block">
                                {currentStage.deliverables?.filter((d: any) => d.status === 'APPROVED').length} / {currentStage.deliverables?.length || 0}
                              </span>
                            </div>
                            <div className="bg-bg-dark p-3 rounded-2xl border border-border-dark">
                              <span className="block text-[8px] uppercase font-bold text-text-gray">Completed Date</span>
                              <span className="text-sm font-semibold text-text-white mt-1 block">
                                {currentStage.completed_at ? new Date(currentStage.completed_at).toLocaleDateString() : '—'}
                              </span>
                            </div>
                            <div className="bg-bg-dark p-3 rounded-2xl border border-border-dark">
                              <span className="block text-[8px] uppercase font-bold text-text-gray">Approved By</span>
                              <span className="text-sm font-semibold text-text-white mt-1 block truncate">
                                {currentStage.approved_by_details?.email || '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Deliverables List */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray flex items-center gap-1.5">
                            <FileText size={14} />
                            <span>Required Deliverables Gate</span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentStage.deliverables?.length === 0 ? (
                              <p className="text-xs text-text-gray italic">No deliverables defined for this stage.</p>
                            ) : (
                              currentStage.deliverables?.map((del: any) => {
                                const isSubmitted = del.status === 'SUBMITTED';
                                const isApproved = del.status === 'APPROVED';
                                const isRejected = del.status === 'REJECTED';
                                const isPending = del.status === 'PENDING';

                                return (
                                  <div 
                                    key={del.id}
                                    className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-border-strong transition-all relative overflow-hidden"
                                  >
                                    <div>
                                      {/* Card header */}
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-bold text-sm text-text-white flex items-center gap-1.5">
                                            {del.title}
                                            {del.is_required && (
                                              <span className="text-[7px] font-bold bg-danger/10 text-danger border border-danger/15 px-1 py-0.25 rounded uppercase">
                                                Required
                                              </span>
                                            )}
                                          </h4>
                                          <span className="text-[9px] text-text-gray bg-bg-dark px-1.5 py-0.5 rounded border border-border-dark mt-1 inline-block">
                                            {del.deliverable_type.replace('_', ' ')}
                                          </span>
                                        </div>
                                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getDeliverableStatusColor(del.status)}`}>
                                          {del.status}
                                        </span>
                                      </div>
                                      <p className="text-xs text-text-gray mt-2 leading-relaxed">{del.description || 'No description provided.'}</p>
                                    </div>

                                    {/* Uploaded content preview */}
                                    {(del.value_text || del.value_file) && (
                                      <div className="p-2.5 bg-bg-dark border border-border-dark rounded-xl text-xs space-y-1 bg-opacity-50">
                                        <span className="block text-[8px] uppercase font-bold text-text-gray">Submission:</span>
                                        
                                        {del.deliverable_type === 'CHECKLIST' ? (
                                          <div className="space-y-1 mt-1.5">
                                            {(() => {
                                              try {
                                                const list = JSON.parse(del.value_text);
                                                return Array.isArray(list) ? list.map((item: any, idx: number) => (
                                                  <div key={idx} className="flex items-center gap-1.5">
                                                    {item.done ? <CheckCircle className="text-success shrink-0" size={13} /> : <div className="h-3.5 w-3.5 rounded border border-border-dark shrink-0" />}
                                                    <span className={`text-[11px] truncate ${item.done ? 'line-through text-text-gray' : 'text-text-white'}`}>{item.text}</span>
                                                  </div>
                                                )) : <span className="text-text-gray">No items</span>;
                                              } catch {
                                                return <span className="text-text-gray">Invalid checklist format</span>;
                                              }
                                            })()}
                                          </div>
                                        ) : del.deliverable_type === 'FIGMA_LINK' || del.deliverable_type === 'GIT_REPOSITORY' || del.deliverable_type === 'URL' ? (
                                          <a 
                                            href={del.value_text.startsWith('http') ? del.value_text : `https://${del.value_text}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1 text-[11px] font-semibold break-all"
                                          >
                                            <ExternalLink size={12} />
                                            <span>{del.value_text}</span>
                                          </a>
                                        ) : (
                                          <p className="text-[11px] text-text-white whitespace-pre-wrap mt-0.5 line-clamp-3">{del.value_text}</p>
                                        )}

                                        {del.value_file && (
                                          <a 
                                            href={del.value_file} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1 text-[11px] font-semibold mt-1"
                                          >
                                            <FileText size={12} />
                                            <span>Open Uploaded File</span>
                                          </a>
                                        )}

                                        {/* Review Remarks */}
                                        {del.remarks && (
                                          <div className="mt-2 pt-2 border-t border-border-dark/50 text-[10px]">
                                            <span className="font-bold text-text-gray uppercase block">Remarks:</span>
                                            <p className="text-text-white italic mt-0.5">"{del.remarks}"</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Submission form */}
                                    {isActive && (isPending || isRejected) && (
                                      <div>
                                        {submittingDelId === del.id ? (
                                          <div className="space-y-3 bg-bg-dark p-3 rounded-2xl border border-border-dark animate-fade-in">
                                            {/* Text inputs */}
                                            {['RICH_TEXT', 'URL', 'GIT_REPOSITORY', 'FIGMA_LINK', 'DATE'].includes(del.deliverable_type) && (
                                              <div>
                                                <label className="block text-[9px] uppercase font-bold text-text-gray mb-1">
                                                  {del.deliverable_type === 'DATE' ? 'Select Date' : 'Input Link / Specification'}
                                                </label>
                                                {del.deliverable_type === 'RICH_TEXT' ? (
                                                  <textarea 
                                                    value={delTextVal}
                                                    onChange={(e) => setDelTextVal(e.target.value)}
                                                    className="w-full bg-card-dark border border-border-dark rounded-xl p-2 outline-none text-xs text-text-white h-20 resize-none"
                                                    placeholder="Write specification..."
                                                  />
                                                ) : (
                                                  <input 
                                                    type={del.deliverable_type === 'DATE' ? 'date' : 'text'}
                                                    value={delTextVal}
                                                    onChange={(e) => setDelTextVal(e.target.value)}
                                                    className="w-full bg-card-dark border border-border-dark rounded-xl p-2 outline-none text-xs text-text-white"
                                                    placeholder={
                                                      del.deliverable_type === 'FIGMA_LINK' ? 'figma.com/file/...' : 
                                                      del.deliverable_type === 'GIT_REPOSITORY' ? 'github.com/org/repo' : 
                                                      'Input value...'
                                                    }
                                                  />
                                                )}
                                              </div>
                                            )}

                                            {/* Checklist Input */}
                                            {del.deliverable_type === 'CHECKLIST' && (
                                              <div className="space-y-2">
                                                <label className="block text-[9px] uppercase font-bold text-text-gray">Checklist Items</label>
                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                  {checklistItems.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-card-dark p-1.5 rounded-lg border border-border-dark">
                                                      <div className="flex items-center gap-1.5 min-w-0">
                                                        <button 
                                                          onClick={() => toggleChecklistItem(idx)}
                                                          className="text-text-gray hover:text-text-white cursor-pointer"
                                                        >
                                                          {item.done ? <CheckCircle size={14} className="text-success" /> : <Square size={14} />}
                                                        </button>
                                                        <span className="text-[11px] truncate">{item.text}</span>
                                                      </div>
                                                      <button 
                                                        onClick={() => removeChecklistItem(idx)}
                                                        className="text-danger hover:bg-danger/10 p-1 rounded cursor-pointer"
                                                      >
                                                        <Trash2 size={12} />
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                                <div className="flex gap-2">
                                                  <input 
                                                    type="text"
                                                    value={newChecklistItem}
                                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                                    placeholder="Add checklist task..."
                                                    className="flex-1 bg-card-dark border border-border-dark rounded-xl px-2.5 py-1.5 text-xs text-text-white outline-none"
                                                  />
                                                  <button 
                                                    type="button" 
                                                    onClick={addChecklistItem}
                                                    className="px-3 bg-primary text-white rounded-xl text-xs hover:opacity-95"
                                                  >
                                                    Add
                                                  </button>
                                                </div>
                                              </div>
                                            )}

                                            {/* File uploads */}
                                            {['FILE_UPLOAD', 'IMAGE', 'VIDEO', 'MULTIPLE_FILES'].includes(del.deliverable_type) && (
                                              <div>
                                                <label className="block text-[9px] uppercase font-bold text-text-gray mb-1">Select File</label>
                                                <input 
                                                  type="file"
                                                  onChange={(e) => setDelFileVal(e.target.files?.[0] || null)}
                                                  className="w-full text-xs text-text-gray file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                                                />
                                              </div>
                                            )}

                                            {/* Submit buttons */}
                                            <div className="flex justify-end gap-1.5 text-xs">
                                              <button 
                                                onClick={() => setSubmittingDelId(null)}
                                                className="px-3 py-1.5 text-text-gray hover:text-text-white"
                                              >
                                                Cancel
                                              </button>
                                              <button 
                                                onClick={() => handleSubmitDeliverable(del.id)}
                                                className="px-3.5 py-1.5 bg-primary text-white rounded-xl font-semibold hover:opacity-90 cursor-pointer"
                                              >
                                                Submit
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button 
                                            onClick={() => handleOpenSubmission(del)}
                                            className="w-full py-2 border border-border-dark hover:border-primary/30 rounded-xl text-xs font-semibold text-text-gray hover:text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-bg-dark/30"
                                          >
                                            <FileUp size={14} />
                                            <span>
                                              {del.deliverable_type === 'APPROVAL' ? 'Submit Sign-off Request' : 
                                               del.deliverable_type === 'CHECKLIST' ? 'Submit Checklist Items' :
                                               'Submit Deliverable'}
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Review panel (PM/Management only) */}
                                    {isActive && isSubmitted && canApprove && (
                                      <div>
                                        {approvingDelId === del.id ? (
                                          <div className="space-y-3 bg-bg-dark p-3 rounded-2xl border border-border-dark animate-fade-in">
                                            <div>
                                              <label className="block text-[9px] uppercase font-bold text-text-gray mb-1">Approval Remarks</label>
                                              <textarea 
                                                value={approvalRemarks}
                                                onChange={(e) => setApprovalRemarks(e.target.value)}
                                                className="w-full bg-card-dark border border-border-dark rounded-xl p-2 outline-none text-xs text-text-white h-16 resize-none"
                                                placeholder="Approval or feedback notes..."
                                              />
                                            </div>
                                            <div className="flex justify-end gap-1.5 text-xs">
                                              <button 
                                                onClick={() => setApprovingDelId(null)}
                                                className="px-3 py-1.5 text-text-gray hover:text-text-white"
                                              >
                                                Cancel
                                              </button>
                                              <button 
                                                onClick={() => handleApproveDeliverable(del.id, 'REJECTED')}
                                                className="px-3 py-1.5 bg-danger/10 border border-danger/20 text-danger rounded-xl font-semibold hover:bg-danger/20 cursor-pointer"
                                              >
                                                Reject
                                              </button>
                                              <button 
                                                onClick={() => handleApproveDeliverable(del.id, 'APPROVED')}
                                                className="px-3 py-1.5 bg-success text-white rounded-xl font-semibold hover:opacity-90 cursor-pointer"
                                              >
                                                Approve
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            <button 
                                              onClick={() => setApprovingDelId(del.id)}
                                              className="w-full py-2 bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-xl text-xs font-semibold text-primary transition-all flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                              <CheckCircle size={14} />
                                              <span>Review Submission</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>



                        {/* Stage Completion Progress Bar / Button */}
                        {isActive && canComplete && (
                          <div className="flex items-center justify-between bg-card-dark border border-border-dark p-4 rounded-[20px] shadow-sm">
                            <div className="flex items-center gap-2.5 text-xs text-text-gray leading-normal">
                              <Info size={16} className="text-primary shrink-0" />
                              <span>Complete all required deliverables above to progress the workflow.</span>
                            </div>
                            <button
                              onClick={() => handleRequestCompleteStage(currentStage)}
                              className="btn-primary"
                            >
                              <span>Complete {currentStage.name}</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        {/* Set Stage manually (Admin only) */}
                        {!isActive && isAdmin && (
                          <div className="flex items-center justify-between bg-card-dark border border-border-dark p-4 rounded-[20px] shadow-sm">
                            <div className="flex items-center gap-2.5 text-xs text-text-gray leading-normal">
                              <AlertTriangle size={16} className="text-warning shrink-0" />
                              <span>You can manually set this stage as active. This will mark prior stages as completed and reset subsequent ones.</span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirmStageId === currentStage.id) {
                                  handleSetStage(currentStage.id);
                                  setConfirmStageId(null);
                                } else {
                                  setConfirmStageId(currentStage.id);
                                  // Reset after 3 seconds
                                  setTimeout(() => setConfirmStageId(null), 3000);
                                }
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                confirmStageId === currentStage.id
                                  ? 'bg-danger text-white hover:bg-danger/90 animate-pulse'
                                  : 'bg-primary text-white hover:opacity-90'
                              }`}
                            >
                              <span>{confirmStageId === currentStage.id ? 'Confirm Change' : 'Set as Active Stage'}</span>
                              <Play size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB: PROJECT READINESS */}
              {workspaceTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-fade-in">
                  
                  {/* Readiness Widget (Left) */}
                  <div className="md:col-span-1 bg-card-dark border border-border-dark p-6 rounded-3xl space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray border-b border-border-dark pb-2">Project Readiness</h3>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col items-center py-4 bg-bg-dark rounded-2xl border border-border-dark">
                        <span className="text-3xl font-extrabold text-primary">{readiness.percentage}%</span>
                        <span className="text-[10px] text-text-gray uppercase tracking-wider mt-1">Readiness Quotient</span>
                      </div>

                      {/* Checklist */}
                      <div className="space-y-3 text-xs leading-normal">
                        {readiness.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {item.done ? (
                              <CheckCircle className="text-success shrink-0" size={15} />
                            ) : (
                              <div className="h-4 w-4 rounded-md border border-border-dark shrink-0" />
                            )}
                            <span className={item.done ? 'text-text-white' : 'text-text-gray'}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description & Team info (Right) */}
                  <div className="md:col-span-2 space-y-6">
                    {/* General Specs */}
                    <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray border-b border-border-dark pb-2">Project Specifications</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-text-gray block">Short Description</span>
                          <p className="text-xs text-text-white mt-1 leading-relaxed">{selectedProject.description || 'No description logged.'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-text-gray">Start Date</span>
                            <span className="text-text-white font-semibold block mt-0.5">{selectedProject.start_date || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-text-gray">Target Delivery</span>
                            <span className="text-text-white font-semibold block mt-0.5">{selectedProject.end_date || 'None'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray border-b border-border-dark pb-2">Project Lead & Developers</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-bg-dark border border-border-dark rounded-2xl">
                          <span className="text-[9px] uppercase font-bold text-text-gray block">Lead Manager</span>
                          <span className="font-semibold text-text-white mt-0.5 block truncate">
                            {selectedProject.project_manager_details?.email || 'Unassigned'}
                          </span>
                        </div>
                        {selectedProject.developers_details?.map((dev: any) => (
                          <div key={dev.id} className="p-3 bg-bg-dark border border-border-dark rounded-2xl flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase font-bold text-text-gray block">Developer</span>
                              <span className="font-semibold text-text-white mt-0.5 block truncate">{dev.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: TASKS LIST */}
              {workspaceTab === 'tasks' && (
                <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-border-dark">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">All Linked Workspace Tasks</h3>
                    {canComplete && (
                      <button 
                        onClick={() => setIsAddTaskOpen(!isAddTaskOpen)}
                        className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Create Custom Task</span>
                      </button>
                    )}
                  </div>

                  {/* Create Task Form */}
                  {isAddTaskOpen && (
                    <form onSubmit={handleCreateTask} className="bg-bg-dark border border-border-dark p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-fade-in">
                      <div className="sm:col-span-3">
                        <label className="block text-[9px] font-bold uppercase text-text-gray mb-1">Task Name</label>
                        <input 
                          type="text" required value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-xl px-3 py-2 outline-none focus:border-primary text-text-white"
                          placeholder="e.g. Implement Oauth signup flow"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[9px] font-bold uppercase text-text-gray mb-1">Description</label>
                        <textarea 
                          value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-xl px-3 py-2 outline-none focus:border-primary text-text-white h-16 resize-none"
                          placeholder="Describe the deliverables for this task..."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-text-gray mb-1">Assigned Developer</label>
                        <select 
                          value={newTaskAssigned} onChange={(e) => setNewTaskAssigned(e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-xl px-3 py-2 outline-none text-text-white"
                        >
                          <option value="">Unassigned</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.email}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-text-gray mb-1">Priority</label>
                        <select 
                          value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-xl px-3 py-2 outline-none text-text-white"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                      <div className="flex items-end justify-end">
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:opacity-95 cursor-pointer">
                          Add Task
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tasks Table */}
                  <div className="space-y-2">
                    {projectTasks.length === 0 ? (
                      <p className="text-xs text-text-gray italic py-4">No tasks found for this workspace.</p>
                    ) : (
                      projectTasks.map((t) => (
                        <div key={t.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between text-xs hover:border-border-strong transition-all">
                          <div>
                            <span className="font-bold text-text-white block">{t.name}</span>
                            <span className="text-[10px] text-text-gray block mt-0.5">
                              Assignee: {t.assigned_to_details?.email || 'Unassigned'} • Priority: {t.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-primary">{t.completion_percentage}%</span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(t.status)}`}>
                              {t.status}
                            </span>
                            {isManagement && (
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="p-1.5 text-text-gray hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: TEAM MEMBERS */}
              {workspaceTab === 'team' && (
                <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray pb-2 border-b border-border-dark">Workspace Team</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-bg-dark border border-border-dark rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm uppercase">PM</div>
                        <div>
                          <span className="font-bold text-text-white block">
                            {selectedProject.project_manager_details?.first_name || 'Project Lead'}
                          </span>
                          <span className="text-[10px] text-text-gray block mt-0.5">{selectedProject.project_manager_details?.email}</span>
                        </div>
                      </div>
                      <span className="absolute top-3 right-3 text-[8px] bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Project Lead
                      </span>
                    </div>

                    {selectedProject.developers_details?.map((dev: any) => (
                      <div key={dev.id} className="p-4 bg-bg-dark border border-border-dark rounded-2xl flex items-center justify-between relative overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-info/10 text-info font-bold flex items-center justify-center text-sm uppercase">DEV</div>
                          <div>
                            <span className="font-bold text-text-white block">{dev.first_name || dev.email.split('@')[0]}</span>
                            <span className="text-[10px] text-text-gray block mt-0.5">{dev.email}</span>
                          </div>
                        </div>
                        <span className="absolute top-3 right-3 text-[8px] bg-info/20 text-info border border-info/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Developer
                        </span>
                      </div>
                    ))}

                    {selectedProject.members_details?.map((mem: any) => (
                      <div key={mem.id} className="p-4 bg-bg-dark border border-border-dark rounded-2xl flex items-center justify-between relative overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-text-gray/10 text-text-gray font-bold flex items-center justify-center text-sm uppercase">OBS</div>
                          <div>
                            <span className="font-bold text-text-white block">{mem.first_name || mem.email.split('@')[0]}</span>
                            <span className="text-[10px] text-text-gray block mt-0.5">{mem.email}</span>
                          </div>
                        </div>
                        <span className="absolute top-3 right-3 text-[8px] bg-text-gray/20 text-text-gray border border-border-dark px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Observer
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Assign/Manage Team Form for Management/Admins */}
                  {isManagement && (
                    <div className="bg-bg-dark border border-border-dark p-4 rounded-2xl space-y-4 mt-6">
                      <h4 className="font-bold text-xs text-text-white">Assign/Manage Project Team</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-text-gray uppercase mb-1.5">Assign Developers</label>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-card-dark border border-border-dark rounded-xl">
                            {users.map(u => {
                              const isAssigned = selectedProject.developers?.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => handleToggleDeveloper(u.id)}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                                    isAssigned 
                                      ? 'bg-primary/20 border-primary text-primary' 
                                      : 'bg-transparent border-border-dark text-text-gray hover:text-text-white'
                                  }`}
                                >
                                  {u.email.split('@')[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-gray uppercase mb-1.5">Assign Observers (Members)</label>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-card-dark border border-border-dark rounded-xl">
                            {users.map(u => {
                              const isAssigned = selectedProject.members?.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => handleToggleMember(u.id)}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                                    isAssigned 
                                      ? 'bg-info/20 border-info text-info' 
                                      : 'bg-transparent border-border-dark text-text-gray hover:text-text-white'
                                  }`}
                                >
                                  {u.email.split('@')[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: UPLOADED FILES */}
              {workspaceTab === 'files' && (
                <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray pb-2 border-b border-border-dark">Uploaded Deliverable Files</h3>
                  
                  {(() => {
                    const stageFiles: any[] = [];
                    selectedProject.stages?.forEach((stage: any) => {
                      stage.deliverables?.forEach((del: any) => {
                        if (del.value_file) {
                          stageFiles.push({
                            id: del.id,
                            title: del.title,
                            stage: stage.name,
                            fileUrl: del.value_file,
                            submittedBy: del.uploaded_by_details?.email || 'System',
                            submittedDate: del.submitted_date
                          });
                        }
                      });
                    });

                    if (stageFiles.length === 0) {
                      return <p className="text-xs text-text-gray italic py-4">No deliverable files have been uploaded yet.</p>;
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {stageFiles.map((file) => (
                          <div key={file.id} className="p-3 bg-bg-dark border border-border-dark rounded-xl flex items-center justify-between hover:border-border-strong transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                                <FileText size={16} />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-text-white block truncate">{file.title}</span>
                                <span className="text-[10px] text-text-gray block mt-0.5">
                                  Stage: {file.stage} • Uploaded by {file.submittedBy}
                                </span>
                              </div>
                            </div>
                            <a 
                              href={file.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-primary text-white rounded-xl font-semibold hover:opacity-90 flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>Open</span>
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB: ACTIVITY LOGS */}
              {workspaceTab === 'activity' && (
                <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray pb-2 border-b border-border-dark">Project Audit Timeline</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {projectLogs.length === 0 ? (
                      <p className="text-xs text-text-gray italic py-4">No activities logged for this workspace.</p>
                    ) : (
                      projectLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 relative pb-4 text-xs">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div className="w-0.5 bg-border-dark flex-1 mt-1.5" />
                          </div>
                          <div>
                            <p className="text-text-white leading-relaxed">
                              <span className="font-bold mr-1">{log.user_details?.email.split('@')[0] || 'System'}</span>
                              {log.action}
                            </p>
                            <span className="text-[10px] text-text-gray block mt-1">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: WORKSPACE SETTINGS */}
              {workspaceTab === 'settings' && (
                <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-text-white border-b border-border-dark pb-2">Workspace Controls</h3>
                    <p className="text-xs text-text-gray mt-2">Adjust core characteristics of this project scope.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Basic details edit option */}
                    {canComplete && (
                      <div className="p-4 bg-bg-dark border border-border-dark rounded-2xl space-y-2">
                        <span className="font-bold text-text-white block">Edit Basic Information</span>
                        <span className="text-[11px] text-text-gray block">Modify the name, client, priority, lead manager, or description of this project.</span>
                        <button
                          onClick={() => {
                            setEditingProject(selectedProject);
                            setEditName(selectedProject.name);
                            setEditClient(selectedProject.client || '');
                            setEditDesc(selectedProject.description || '');
                            setEditStart(selectedProject.start_date || '');
                            setEditDue(selectedProject.end_date || '');
                            setEditPriority(selectedProject.priority);
                            setEditStatus(selectedProject.status);
                            setEditManager(selectedProject.project_manager?.toString() || '');
                            setIsEditOpen(true);
                          }}
                          className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl font-semibold transition-colors cursor-pointer"
                        >
                          Edit Project details
                        </button>
                      </div>
                    )}

                    {/* Delete operation */}
                    {isManagement && (
                      <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl space-y-3">
                        <div className="flex items-start gap-2 text-danger">
                          <AlertTriangle className="shrink-0" size={16} />
                          <div>
                            <span className="font-bold block">Danger Zone: Permanent Archival</span>
                            <span className="text-[11px] text-text-gray block mt-0.5">This action deletes the workspace, stage-gate deliverables, task checkpoints, and logs. It cannot be undone.</span>
                          </div>
                        </div>
                        <button
                          disabled={isDeleting}
                          onClick={() => handleDeleteProject(selectedProject.id)}
                          className="px-4 py-2 bg-danger text-white rounded-xl font-semibold hover:opacity-90 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete Workspace</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
            <div className="fixed inset-0" onClick={() => setIsCreateOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="w-full max-w-xl bg-card-dark border-l border-border-dark h-screen max-h-screen overflow-y-auto z-10 p-6 md:p-8 space-y-4 text-text-white"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-3">
                <h2 className="text-lg font-bold text-text-white">Instantiate New Project Scope</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-text-gray hover:text-text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Name</label>
                  <input 
                    type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-white placeholder-text-gray/50 text-sm focus:border-primary"
                    placeholder="e.g. ERP Automation V2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Client / Target</label>
                  <input 
                    type="text" required value={formClient} onChange={(e) => setFormClient(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-white placeholder-text-gray/50 text-sm focus:border-primary"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Type (Workflow Template)</label>
                  <select 
                    value={formWorkflow} onChange={(e) => setFormWorkflow(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary cursor-pointer text-sm"
                  >
                    {workflows.map(wf => (
                      <option key={wf.id} value={wf.id}>{wf.name} Template</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Lead / Manager</label>
                  <select 
                    value={formManager} onChange={(e) => setFormManager(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Start Date</label>
                    <input 
                      type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Expected Delivery Date</label>
                    <input 
                      type="date" value={formDue} onChange={(e) => setFormDue(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Priority</label>
                  <select 
                    value={formPriority} onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Short Description</label>
                  <textarea 
                    value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-white text-sm focus:border-primary h-20 resize-none"
                    placeholder="Short description of target scope..."
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-primary hover:opacity-95 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer text-sm"
                >
                  Create Project
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PROJECT MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
            <div className="fixed inset-0" onClick={() => { setIsEditOpen(false); setEditingProject(null); }} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="w-full max-w-xl bg-card-dark border-l border-border-dark h-screen max-h-screen overflow-y-auto z-10 p-6 md:p-8 space-y-4 text-text-white"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-3">
                <h2 className="text-lg font-bold text-text-white">Edit Project Specifications</h2>
                <button onClick={() => { setIsEditOpen(false); setEditingProject(null); }} className="text-text-gray hover:text-text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditProject} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Name</label>
                  <input 
                    type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-white placeholder-text-gray/50 text-sm focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Client / Target</label>
                  <input 
                    type="text" required value={editClient} onChange={(e) => setEditClient(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-white placeholder-text-gray/50 text-sm focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Project Lead / Manager</label>
                  <select 
                    value={editManager} onChange={(e) => setEditManager(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Start Date</label>
                    <input 
                      type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Expected Delivery Date</label>
                    <input 
                      type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Priority</label>
                    <select 
                      value={editPriority} onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm cursor-pointer"
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
                      value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-gray focus:border-primary text-sm cursor-pointer"
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
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Short Description</label>
                  <textarea 
                    value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl outline-none text-text-white text-sm focus:border-primary h-24 resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-primary hover:opacity-95 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer text-sm"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STAGE COMPLETION VALIDATION MODAL */}
      <AnimatePresence>
        {validationModalStage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="fixed inset-0" onClick={() => setValidationModalStage(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card-dark border border-border-dark max-w-md w-full rounded-[24px] p-6 shadow-large z-10 text-text-white space-y-4"
            >
              <div className="flex items-start gap-3 border-b border-border-dark pb-3">
                <AlertTriangle className="text-warning shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-base">Move to Next Stage Gate</h3>
                  <p className="text-xs text-text-gray mt-1">
                    Validating required deliverables for <span className="font-semibold text-text-white">{validationModalStage.name}</span>.
                  </p>
                </div>
              </div>

              {/* Deliverable Checklists */}
              <div className="space-y-2.5 text-xs">
                {validationModalStage.deliverables.map((d: any) => {
                  const isApproved = d.status === 'APPROVED';
                  return (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-bg-dark border border-border-dark rounded-xl">
                      <span className="font-medium truncate pr-2">{d.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isApproved ? (
                          <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                            <Check size={12} /> Approved
                          </span>
                        ) : d.is_required ? (
                          <span className="text-[10px] text-danger font-semibold flex items-center gap-1">
                            <X size={12} /> Missing / Pending
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-gray italic">Optional</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Warning box if overrides needed */}
              {validationModalStage.deliverables.some((d: any) => d.is_required && d.status !== 'APPROVED') && (
                <div className="p-3 bg-danger/10 border border-danger/25 rounded-2xl text-[11px] text-text-gray leading-normal">
                  <span className="font-bold text-danger block mb-0.5">Gated Progression Alert</span>
                  One or more required deliverables have not been approved. Proceeding requires authorized management override.
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 text-xs pt-2">
                <button 
                  onClick={() => setValidationModalStage(null)}
                  className="px-4 py-2 border border-border-dark hover:bg-bg-dark text-text-gray hover:text-text-white rounded-xl"
                >
                  Cancel
                </button>
                {validationModalStage.deliverables.some((d: any) => d.is_required && d.status !== 'APPROVED') ? (
                  overrideAllowed ? (
                    <button 
                      onClick={() => handleCompleteStage(validationModalStage.id, true)}
                      className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-95 cursor-pointer flex items-center gap-1"
                    >
                      <LockOpen size={13} />
                      <span>Approve & Continue (Override)</span>
                    </button>
                  ) : (
                    <div className="text-[10px] text-danger italic font-semibold">Missing permissions to override gates</div>
                  )
                ) : (
                  <button 
                    onClick={() => handleCompleteStage(validationModalStage.id, false)}
                    className="px-4 py-2 bg-success text-white rounded-xl font-bold hover:opacity-95 cursor-pointer"
                  >
                    Complete Stage
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
