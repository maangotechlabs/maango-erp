import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building, Calendar, Shield, Trash2, Plus, 
  Clock, Loader2, Check, ShieldAlert, Palette, Users
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'working' | 'departments' | 'roles' | 'statuses' | 'theme'>('profile');
  
  // States
  const [company, setCompany] = useState<any>({ name: '', website: '', email: '', phone: '', address: '' });
  const [workingDays, setWorkingDays] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Department Form
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Local theme accent color state
  const [accentColor, setAccentColor] = useState('#8B5CF6'); // Default violet

  const isAdmin = user?.role === 'ADMIN';

  const fetchSettingsData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const compRes = await api.get('/settings/company-profile/');
      setCompany(compRes.data);

      const workRes = await api.get('/settings/working-days/');
      setWorkingDays(workRes.data);

      const deptRes = await api.get('/settings/departments/');
      setDepartments(deptRes.data.results || deptRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
    // Retrieve custom accent from localStorage if set
    const savedAccent = localStorage.getItem('theme_accent');
    if (savedAccent) {
      setAccentColor(savedAccent);
    }
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/company-profile/', company);
      alert("Company information updated.");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkingDays = async () => {
    setSaving(true);
    try {
      await api.put('/settings/working-days/', workingDays);
      alert("Working days updated.");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/departments/', {
        name: newDeptName,
        code: newDeptCode,
      });
      setNewDeptName('');
      setNewDeptCode('');
      fetchSettingsData();
    } catch (err) {
      alert("Error adding department: " + JSON.stringify(err));
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await api.delete(`/settings/departments/${id}/`);
      fetchSettingsData();
    } catch (e) {
      console.error(e);
    }
  };

  const changeThemeAccent = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('theme_accent', color);
    // Apply styling variable to root
    document.documentElement.style.setProperty('--color-primary', color);
    alert(`Theme primary color updated to ${color}`);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-card-dark rounded-2xl border border-border-dark max-w-md mx-auto mt-20">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
        <p className="text-xs text-text-gray mb-4">
          Only system Administrators have access to global ERP configurations.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-text-gray mt-1">
          Admin configurations for departments, roles, active days, statuses, and themes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1 bg-card-dark p-4 rounded-2xl border border-border-dark h-fit">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSubTab === 'profile' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-slate-800'
            }`}
          >
            <Building size={16} />
            <span>Company Profile</span>
          </button>
          <button
            onClick={() => setActiveSubTab('working')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSubTab === 'working' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-slate-800'
            }`}
          >
            <Clock size={16} />
            <span>Working Days</span>
          </button>
          <button
            onClick={() => setActiveSubTab('departments')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSubTab === 'departments' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-slate-800'
            }`}
          >
            <Shield size={16} />
            <span>Departments</span>
          </button>
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSubTab === 'roles' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-slate-800'
            }`}
          >
            <Users size={16} />
            <span>Predefined Roles</span>
          </button>
          <button
            onClick={() => setActiveSubTab('statuses')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSubTab === 'statuses' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-slate-800'
            }`}
          >
            <Check size={16} />
            <span>Task & Folder Statuses</span>
          </button>
          <button
            onClick={() => setActiveSubTab('theme')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSubTab === 'theme' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-slate-800'
            }`}
          >
            <Palette size={16} />
            <span>Theme Accent</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3 glass-card p-6 rounded-2xl border border-border-dark min-h-[300px]">
          
          {/* Company Profile */}
          {activeSubTab === 'profile' && (
            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Edit Company Profile</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Company Name</label>
                  <input 
                    type="text" required value={company.name || ''} 
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Website URL</label>
                  <input 
                    type="url" value={company.website || ''} 
                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Support Email</label>
                  <input 
                    type="email" value={company.email || ''} 
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Contact Phone</label>
                  <input 
                    type="text" value={company.phone || ''} 
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Office Address</label>
                <textarea 
                  value={company.address || ''} 
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none h-16 resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}

          {/* Working Days */}
          {activeSubTab === 'working' && (
            <div className="space-y-5 text-xs">
              <h3 className="text-sm font-bold text-white">Edit Working Days</h3>
              <p className="text-text-gray -mt-2">Tick the default weekdays that count as active office working periods.</p>
              
              <div className="space-y-2 max-w-sm">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <label key={day} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-border-dark capitalize cursor-pointer select-none">
                    <span>{day}</span>
                    <input 
                      type="checkbox"
                      checked={workingDays[day] || false}
                      onChange={(e) => setWorkingDays({ ...workingDays, [day]: e.target.checked })}
                      className="h-4 w-4 rounded border-border-dark text-primary focus:ring-primary cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <button 
                onClick={handleSaveWorkingDays}
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 mt-4"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* Departments */}
          {activeSubTab === 'departments' && (
            <div className="space-y-6 text-xs">
              <h3 className="text-sm font-bold text-white">System Departments</h3>
              
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {departments.map(d => (
                  <div key={d.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{d.name}</span>
                      <span className="text-[10px] text-text-gray block mt-0.5">Code: {d.code}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteDept(d.id)} 
                      className="p-1 text-red-400 hover:bg-red-950/20 rounded cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddDept} className="border-t border-border-dark pt-4 space-y-3">
                <h4 className="text-[10px] font-bold text-primary uppercase">Add Department</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" required placeholder="Department Name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                  <input 
                    type="text" required placeholder="Code (e.g. ENG)" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>
                <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-indigo-600 text-white font-bold rounded-lg text-[10px] cursor-pointer">
                  <Plus size={10} />
                  <span>Add</span>
                </button>
              </form>
            </div>
          )}

          {/* Predefined Roles */}
          {activeSubTab === 'roles' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Predefined Workspace Roles</h3>
              <p className="text-text-gray -mt-2">Permissions are dynamically calculated based on these mapped user scopes.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Admin', desc: 'Full administrator authorization. Accesses settings and audit logs.' },
                  { name: 'Chief', desc: 'Executive authorization. Full access except editing settings.' },
                  { name: 'Management', desc: 'Manager permissions. Can manage team profiles, projects, and tasks.' },
                  { name: 'Employee', desc: 'Standard workspace permissions. Manages assigned tasks, comments, and uploads.' },
                  { name: 'Intern', desc: 'Observer workspace permissions. Same as Employee.' },
                  { name: 'Fellow', desc: 'Restricted task-only permissions. View assigned tasks and update completion percentage.' },
                ].map((role) => (
                  <div key={role.name} className="p-3.5 bg-slate-900/40 border border-border-dark/60 rounded-xl">
                    <span className="font-bold text-white block text-sm">{role.name}</span>
                    <span className="text-[10px] text-text-gray block mt-1">{role.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kanban & Folder Statuses */}
          {activeSubTab === 'statuses' && (
            <div className="space-y-6 text-xs">
              
              {/* Task statuses */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Board Columns</h3>
                <p className="text-text-gray mb-3">Pre-configured workflow states for task checklist tickets.</p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {['Pending', 'In Progress', 'Review', 'Completed'].map((st) => (
                    <div key={st} className="p-3 bg-slate-950 border border-border-dark rounded-xl font-bold text-white">{st}</div>
                  ))}
                </div>
              </div>

              {/* Project statuses */}
              <div className="border-t border-border-dark/50 pt-6">
                <h3 className="text-sm font-bold text-white mb-2">Project Folder Statuses</h3>
                <p className="text-text-gray mb-3">Pre-configured milestone values representing project scopes.</p>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map((st) => (
                    <div key={st} className="p-3 bg-slate-950 border border-border-dark rounded-xl font-bold text-white">{st}</div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Theme Accent Color */}
          {activeSubTab === 'theme' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Choose Primary Accent Theme</h3>
              <p className="text-text-gray -mt-2">Customize the theme accent color across buttons, borders, and active highlights.</p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { name: 'Purple (Default)', hex: '#8B5CF6' },
                  { name: 'Blue', hex: '#3B82F6' },
                  { name: 'Indigo', hex: '#6366F1' },
                  { name: 'Emerald', hex: '#10B981' },
                  { name: 'Rose', hex: '#F43F5E' },
                  { name: 'Amber', hex: '#F59E0B' },
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => changeThemeAccent(color.hex)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border-dark/65 bg-slate-900/50 hover:bg-slate-800 text-xs text-white font-medium cursor-pointer transition-all"
                  >
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color.hex }} />
                    <span>{color.name}</span>
                    {accentColor === color.hex && <Check size={12} className="text-primary ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
