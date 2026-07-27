import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Search, Plus, Trash2, X, Mail, Phone, 
  MapPin, Calendar, FileText, 
  Download, Check, Briefcase, ShieldCheck, Loader2,
  ExternalLink, Upload, AlertCircle, ChevronRight, FolderClosed,
  Grid, List, Printer, Copy, ChevronDown, ChevronUp, UserPlus,
  Lock, Edit, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Team: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View settings
  const [viewType, setViewType] = useState<'cards' | 'table'>('cards');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected profile details & tabs
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'projects' | 'tasks' | 'documents'>('general');
  const [verificationData, setVerificationData] = useState<any>(null);
  
  // Related lists for details tabs
  const [profileProjects, setProfileProjects] = useState<any[]>([]);
  const [profileTasks, setProfileTasks] = useState<any[]>([]);
  const [profileDocuments, setProfileDocuments] = useState<any[]>([]);

  // Modals open/close
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);

  // Edit user modal state
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRole, setEditRole] = useState('EMPLOYEE');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editSkills, setEditSkills] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDOB, setEditDOB] = useState('');
  const [editGender, setEditGender] = useState('MALE');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergency, setEditEmergency] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Bulk actions states
  const [bulkDeptId, setBulkDeptId] = useState('');

  // Create Team Member form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDOB, setFormDOB] = useState('');
  const [formGender, setFormGender] = useState('MALE');
  const [formAddress, setFormAddress] = useState('');
  const [formEmergency, setFormEmergency] = useState('');

  const [formRole, setFormRole] = useState('MANAGEMENT');
  const [formDept, setFormDept] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState('ACTIVE');

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const [optionalOpen, setOptionalOpen] = useState(false);
  const [formSkills, setFormSkills] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const [formIdDocType, setFormIdDocType] = useState('MASKED_AADHAAR');
  const [formIdFile, setFormIdFile] = useState<File | null>(null);

  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [copied, setCopied] = useState(false);

  // ID Upload (Inside profile details)
  const [idDocType, setIdDocType] = useState('MASKED_AADHAAR');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState(false);

  // Profile Document Upload (Inside profile details)
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDesc, setDocDesc] = useState('');
  const [uploadingProfileDoc, setUploadingProfileDoc] = useState(false);

  const isManagement = user?.role && ['ADMIN', 'CHIEF', 'MANAGEMENT'].includes(user.role);

  const generateSecurePassword = () => {
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '!@#$%^&*()_+~|}{[]:;?><,./-=';
    const all = uppers + lowers + numbers + specials;
    
    let pwd = '';
    pwd += uppers[Math.floor(Math.random() * uppers.length)];
    pwd += lowers[Math.floor(Math.random() * lowers.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += specials[Math.floor(Math.random() * specials.length)];
    
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle password
    return pwd.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleSuggestUsername = async (nameVal: string) => {
    setFormName(nameVal);
    if (nameVal.trim()) {
      try {
        const res = await api.get(`/auth/users/suggest-username/?name=${encodeURIComponent(nameVal)}`);
        setFormUsername(res.data.username);
      } catch (e) {
        console.error(e);
      }
    } else {
      setFormUsername('');
    }
  };

  const handleRegeneratePassword = () => {
    setFormPassword(generateSecurePassword());
  };

  // Age calculation helper
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/team/profiles/');
      setProfiles(pRes.data.results || pRes.data || []);

      const dRes = await api.get('/settings/departments/');
      setDepartments(dRes.data.results || dRes.data || []);
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
      setIsCreateModalOpen(true);
      setFormPassword(generateSecurePassword());
    }
  }, []);

  const fetchVerificationStatus = async (profileId: number) => {
    try {
      const res = await api.get(`/team/profiles/${profileId}/identity/`);
      setVerificationData(res.data);
    } catch {
      setVerificationData(null);
    }
  };

  const fetchProfileDocuments = async (userId: number) => {
    try {
      const res = await api.get(`/team/documents/?profile_user_id=${userId}`);
      setProfileDocuments(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRelatedProjectsAndTasks = async (userId: number) => {
    try {
      const allProjsRes = await api.get('/projects/');
      const allTasksRes = await api.get('/tasks/');

      const allProjs = allProjsRes.data.results || allProjsRes.data || [];
      const allTasks = allTasksRes.data.results || allTasksRes.data || [];

      // Filter projects where user is assigned
      const userProjs = allProjs.filter((p: any) => 
        p.project_manager === userId || 
        p.developers.some((d: any) => d.id === userId) ||
        p.members.some((m: any) => m.id === userId)
      );

      // Filter tasks assigned to user
      const userTasks = allTasks.filter((t: any) => t.assigned_to === userId);

      setProfileProjects(userProjs);
      setProfileTasks(userTasks);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      fetchVerificationStatus(selectedProfile.id);
      fetchProfileDocuments(selectedProfile.user);
      fetchRelatedProjectsAndTasks(selectedProfile.user);
      setActiveTab('general');
    }
  }, [selectedProfile]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPassword) return;
    setSubmittingCreate(true);
    try {
      // 1. Create User
      const userRes = await api.post('/auth/users/', {
        email: formEmail,
        username: formUsername,
        password: formPassword,
        role: formRole,
        first_name: formName.split(' ')[0] || '',
        last_name: formName.split(' ').slice(1).join(' ') || '',
      });

      // 2. Update Profile details (profiles are auto-created via signals)
      const profilesRes = await api.get('/team/profiles/');
      const newProfile = (profilesRes.data.results || profilesRes.data).find((p: any) => p.user === userRes.data.id);
      
      if (newProfile) {
        await api.patch(`/team/profiles/${newProfile.id}/`, {
          name: formName,
          gender: formGender,
          dob: formDOB || null,
          phone: formPhone,
          address: formAddress,
          emergency_contact: formEmergency,
          department: formDept ? parseInt(formDept) : null,
          joining_date: formJoiningDate,
          employment_type: formRole === 'FELLOW' ? 'FELLOWSHIP' : formRole === 'INTERN' ? 'INTERN' : 'FULL_TIME',
          status: formStatus,
          skills: formSkills.split(',').map(s => s.trim()).filter(Boolean),
          github: formGithub,
          linkedin: formLinkedin,
          notes: formNotes
        });

        // 3. Optional Identity verification doc upload
        if (formIdFile) {
          const formData = new FormData();
          formData.append('document_type', formIdDocType);
          formData.append('document_file', formIdFile);

          await api.post(`/team/profiles/${newProfile.id}/identity/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      setCreatedCredentials({
        name: formName,
        role: formRole,
        username: formUsername,
        password: formPassword
      });

      setIsCreateModalOpen(false);
      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormDOB('');
      setFormGender('MALE');
      setFormAddress('');
      setFormEmergency('');
      setFormDept('');
      setFormSkills('');
      setFormGithub('');
      setFormLinkedin('');
      setFormNotes('');
      setFormIdFile(null);

      fetchData();
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      alert("Failed to add member: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleDeleteMember = async (profile: any) => {
    if (!window.confirm(`Are you sure you want to deactivate the account of ${profile.name}? Historical tasks and comments will remain intact.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/auth/users/${profile.user}/`);
      setSelectedProfile(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Deactivation failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateMember = async (profile: any) => {
    if (!window.confirm(`Are you sure you want to activate the account of ${profile.name}?`)) return;
    setIsDeleting(true);
    try {
      await api.post(`/auth/users/${profile.user}/activate/`);
      setSelectedProfile(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Activation failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHardDeleteMember = async (profile: any) => {
    if (!window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${profile.name}? This action CANNOT be undone and will erase all profile data.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/auth/users/${profile.user}/hard-delete/`);
      setSelectedProfile(null);
      fetchData();
      alert("Member deleted permanently.");
    } catch (e) {
      console.error(e);
      alert("Permanent deletion failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload Profile Document
  const handleUploadProfileDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !selectedProfile) return;
    setUploadingProfileDoc(true);

    const formData = new FormData();
    formData.append('file_name', docFile.name);
    formData.append('file', docFile);
    formData.append('description', docDesc);
    formData.append('profile_user', selectedProfile.user.toString());
    formData.append('scope', 'EMPLOYEE');

    try {
      await api.post('/team/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocFile(null);
      setDocDesc('');
      fetchProfileDocuments(selectedProfile.user);
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploadingProfileDoc(false);
    }
  };

  // Upload Verification ID
  const handleUploadIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile || !selectedProfile) return;
    setUploadingDoc(true);

    const formData = new FormData();
    formData.append('document_type', idDocType);
    formData.append('document_file', idFile);

    try {
      await api.post(`/team/profiles/${selectedProfile.id}/identity/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIdFile(null);
      fetchVerificationStatus(selectedProfile.id);
    } catch (err) {
      alert("Verification upload failed.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Verify Identity (Management)
  const handleVerifyStatus = async (statusVal: 'VERIFIED' | 'REJECTED') => {
    if (!selectedProfile) return;
    setVerifyingDoc(true);
    try {
      await api.post(`/team/profiles/${selectedProfile.id}/verify-status/`, {
        status: statusVal,
      });
      fetchVerificationStatus(selectedProfile.id);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingDoc(false);
    }
  };

  const downloadIdentityDoc = () => {
    if (!selectedProfile) return;
    window.open(`http://localhost:8000/api/v1/team/profiles/${selectedProfile.id}/identity-document/`, '_blank');
  };

  // Log ordinary document views
  const handleViewProfileDoc = async (doc: any) => {
    try {
      await api.post(`/team/documents/${doc.id}/log-view/`);
    } catch (e) {
      console.error(e);
    }
    window.open(doc.file, '_blank');
  };

  // User details Edit handler
  const handleStartEdit = (profile: any) => {
    setEditingProfile(profile);
    setEditName(profile.name || '');
    setEditEmail(profile.user_details?.email || '');
    setEditPhone(profile.phone || '');
    setEditDept(profile.department?.toString() || '');
    setEditRole(profile.user_details?.role || 'EMPLOYEE');
    setEditStatus(profile.status || 'ACTIVE');
    setEditSkills(profile.skills ? profile.skills.join(', ') : '');
    setEditNotes(profile.notes || '');
    setEditDOB(profile.dob || '');
    setEditGender(profile.gender || 'MALE');
    setEditAddress(profile.address || '');
    setEditEmergency(profile.emergency_contact || '');
    setEditJoiningDate(profile.joining_date || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSavingEdit(true);
    try {
      // 1. Update user role and email
      await api.patch(`/auth/users/${editingProfile.user}/`, {
        email: editEmail,
        role: editRole,
        first_name: editName.split(' ')[0] || '',
        last_name: editName.split(' ').slice(1).join(' ') || ''
      });

      // 2. Update profile fields
      await api.patch(`/team/profiles/${editingProfile.id}/`, {
        name: editName,
        phone: editPhone,
        department: editDept ? parseInt(editDept) : null,
        status: editStatus,
        notes: editNotes,
        skills: editSkills.split(',').map(s => s.trim()).filter(Boolean),
        dob: editDOB || null,
        gender: editGender,
        address: editAddress,
        emergency_contact: editEmergency,
        joining_date: editJoiningDate || null
      });

      setEditingProfile(null);
      setSelectedProfile(null);
      fetchData();
      alert("Member profile updated successfully.");
    } catch (err: any) {
      alert("Failed to update profile details: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  // Bulk actions handlers
  const toggleSelectUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.post('/auth/users/bulk-activate/', { user_ids: selectedUserIds });
      setSelectedUserIds([]);
      fetchData();
      alert("Selected accounts activated successfully.");
    } catch (e) {
      console.error(e);
      alert("Bulk activation failed.");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.post('/auth/users/bulk-deactivate/', { user_ids: selectedUserIds });
      setSelectedUserIds([]);
      fetchData();
      alert("Selected accounts deactivated successfully.");
    } catch (e) {
      console.error(e);
      alert("Bulk deactivation failed.");
    }
  };

  const handleBulkAssignDept = async () => {
    if (selectedUserIds.length === 0 || !bulkDeptId) return;
    try {
      await api.post('/auth/users/bulk-assign-department/', { 
        user_ids: selectedUserIds, 
        department_id: parseInt(bulkDeptId) 
      });
      setSelectedUserIds([]);
      setBulkDeptId('');
      fetchData();
      alert("Bulk assigned department successfully.");
    } catch (e) {
      console.error(e);
      alert("Bulk department assignment failed.");
    }
  };

  const handleExportUserList = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Email,Username,Role,Department,Status"].join(",") + "\n"
      + profiles.map(p => [
          `"${p.name}"`,
          `"${p.user_details?.email}"`,
          `"${p.user_details?.username || ''}"`,
          `"${p.user_details?.role}"`,
          `"${p.department_details?.name || 'No Dept'}"`,
          `"${p.status}"`
        ].join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MaAngo_ERP_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy success modal creds
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const credString = `MaAngo ERP Account Credentials:\n\nName: ${createdCredentials.name}\nRole: ${createdCredentials.role}\nUsername: ${createdCredentials.username}\nTemporary Password: ${createdCredentials.password}\n\nLink: http://localhost:5173/login`;
    navigator.clipboard.writeText(credString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print success modal creds
  const handlePrintCredentials = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && createdCredentials) {
      printWindow.document.write(`
        <html>
        <head>
          <title>MaAngo ERP Credentials Summary</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111; }
            .card { border: 1px solid #ccc; padding: 24px; border-radius: 12px; max-width: 500px; }
            h2 { margin-top: 0; color: #4f46e5; }
            .field { margin: 12px 0; }
            .label { font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 16px; font-weight: bold; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Account Credentials Created</h2>
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${createdCredentials.name}</div>
            </div>
            <div class="field">
              <div class="label">Role</div>
              <div class="value">${createdCredentials.role}</div>
            </div>
            <div class="field">
              <div class="label">Username</div>
              <div class="value">${createdCredentials.username}</div>
            </div>
            <div class="field">
              <div class="label">Temporary Password</div>
              <div class="value" style="font-family: monospace; letter-spacing: 0.5px;">${createdCredentials.password}</div>
            </div>
            <p style="font-size: 11px; color: #888; margin-top: 30px;">
              * The temporary password is only visible on this slip. Please reset it immediately upon first login.
            </p>
          </div>
          <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter Profiles
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.user_details?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.user_details?.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.user_details?.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.department_details?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesDept = deptFilter ? p.department === parseInt(deptFilter) : true;
    const matchesRole = roleFilter ? p.user_details?.role === roleFilter : true;
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-dark/45 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
          <p className="text-sm text-text-gray mt-1">
            Browse company profiles, roles, workloads, credentials, and verify identities.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950/60 p-1 border border-border-dark rounded-xl text-xs">
            <button 
              onClick={() => setViewType('cards')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewType === 'cards' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewType('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewType === 'table' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List size={16} />
            </button>
          </div>

          {isManagement && (
            <button 
              onClick={() => {
                setIsCreateModalOpen(true);
                setFormPassword(generateSecurePassword());
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions panel (if any checked) */}
      {isManagement && selectedUserIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/60 border border-primary/20 p-4 rounded-2xl animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-primary animate-pulse" size={16} />
            <span className="font-semibold">{selectedUserIds.length} users selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleBulkActivate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Activate
            </button>
            <button 
              onClick={handleBulkDeactivate}
              className="px-3 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Deactivate
            </button>
            <div className="flex items-center gap-1 bg-slate-900 border border-border-dark p-1 rounded-lg">
              <select
                value={bulkDeptId}
                onChange={(e) => setBulkDeptId(e.target.value)}
                className="bg-transparent border-none outline-none text-text-gray font-medium text-[11px] px-2 py-0.5"
              >
                <option value="">Assign Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button 
                onClick={handleBulkAssignDept}
                disabled={!bulkDeptId}
                className="px-2 py-1 bg-primary hover:bg-indigo-600 text-white font-bold rounded-md disabled:bg-primary/50 text-[10px] transition-colors cursor-pointer"
              >
                Assign
              </button>
            </div>
            <button 
              onClick={handleExportUserList}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Export Selection
            </button>
            <button 
              onClick={() => setSelectedUserIds([])}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card-dark p-4 rounded-2xl border border-border-dark text-xs">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, username, department, role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div>
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-gray-400"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-gray-400"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="CHIEF">Chief</option>
            <option value="MANAGEMENT">Management</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="INTERN">Intern</option>
            <option value="FELLOW">Fellow</option>
          </select>
        </div>
      </div>

      {/* Team Views */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-20 bg-card-dark rounded-2xl border border-border-dark">
          <Briefcase className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="font-semibold text-lg">No members found</h3>
          <p className="text-xs text-text-gray mt-1">Try tweaking your search filters.</p>
        </div>
      ) : viewType === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((p) => (
            <div 
              key={p.id} 
              className={`glass-card p-6 rounded-2xl flex flex-col justify-between border transition-all shadow-md relative ${
                selectedUserIds.includes(p.user) ? 'border-primary' : 'border-border-dark/60 hover:border-primary/40'
              }`}
            >
              {isManagement && (
                <input 
                  type="checkbox"
                  checked={selectedUserIds.includes(p.user)}
                  onChange={() => toggleSelectUser(p.user)}
                  className="absolute top-4 left-4 h-4 w-4 bg-slate-900 border-border-dark rounded focus:ring-primary cursor-pointer accent-primary"
                />
              )}
              
              <div className={isManagement ? 'pl-6' : ''}>
                <div className="flex items-start justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                    {p.name.charAt(0)}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    p.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-850 text-text-gray'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="font-bold text-base mt-4">{p.name}</h3>
                <p className="text-xs text-text-gray">{p.user_details?.role} • {p.department_details?.name || 'No Department'}</p>
                <p className="text-[9px] text-text-gray mt-0.5">@{p.user_details?.username || 'no-username'}</p>
                
                {p.user_details?.role === 'FELLOW' ? (
                  /* Fellow layout */
                  <div className="mt-3 space-y-2 text-xs border-t border-border-dark/30 pt-3">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-text-gray uppercase font-bold">Assigned Project</span>
                      <span className="font-semibold text-white text-[11px] truncate max-w-[120px]">
                        {p.fellowship_details?.project_name || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] text-text-gray uppercase font-bold">Mentor</span>
                      <span className="font-semibold text-white text-[11px]">
                        {p.fellowship_details?.mentor_name || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] text-text-gray uppercase font-bold">Deadline</span>
                      <span className="font-semibold text-white text-[11px]">
                        {p.fellowship_details?.deadline ? new Date(p.fellowship_details.deadline).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-text-gray font-bold uppercase">
                        <span>Milestone Progress</span>
                        <span>{p.fellowship_details?.progress_pct || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${p.fellowship_details?.progress_pct || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard counts */
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <div className="flex gap-4">
                      <div>
                        <span className="font-bold text-white block">{p.active_projects_count || 0}</span>
                        <span className="text-[9px] text-text-gray">Active Projects</span>
                      </div>
                      <div>
                        <span className="font-bold text-white block">{p.active_tasks_count || 0}</span>
                        <span className="text-[9px] text-text-gray">Pending Tasks</span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                        p.workload_indicator === 'High' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                        p.workload_indicator === 'Normal' ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' :
                        'bg-slate-850 text-text-gray border-border-dark/60'
                      }`}>
                        {p.workload_indicator || 'Low'} Workload
                      </span>
                    </div>
                  </div>
                )}

                {/* Skills badges */}
                <div className="flex flex-wrap gap-1 mt-4">
                  {p.skills.slice(0, 3).map((sk: string) => (
                    <span key={sk} className="text-[9px] bg-slate-800/60 px-2 py-0.5 rounded text-gray-300">
                      {sk}
                    </span>
                  ))}
                  {p.skills.length > 3 && (
                    <span className="text-[9px] bg-slate-800/30 px-2 py-0.5 rounded text-gray-500">
                      +{p.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-border-dark/60 mt-6 pt-4 flex items-center justify-between text-xs">
                <span className="text-[9px] text-text-gray">Join: {p.joining_date}</span>
                <div className="flex items-center gap-3">
                  {isManagement && p.user !== user?.id && (
                    p.status === 'INACTIVE' ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleActivateMember(p)}
                          className="text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors"
                          title="Activate Account"
                        >
                          <Check size={14} />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button 
                            onClick={() => handleHardDeleteMember(p)}
                            className="text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                            title="Permanently Delete Member"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleDeleteMember(p)}
                        className="text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                        title="Deactivate Account"
                      >
                        <Trash2 size={14} />
                      </button>
                    )
                  )}
                  <button 
                    onClick={() => setSelectedProfile(p)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View Profile</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card rounded-2xl border border-border-dark overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-dark bg-slate-950/20 text-text-gray font-bold uppercase tracking-wider text-[10px]">
                  {isManagement && <th className="px-6 py-4 w-12"></th>}
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/40">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/10 transition-colors">
                    {isManagement && (
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox"
                          checked={selectedUserIds.includes(p.user)}
                          onChange={() => toggleSelectUser(p.user)}
                          className="h-4 w-4 bg-slate-900 border-border-dark rounded focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 font-semibold text-white">{p.name}</td>
                    <td className="px-6 py-4 text-gray-400">@{p.user_details?.username || 'no-username'}</td>
                    <td className="px-6 py-4 text-gray-400">{p.user_details?.email}</td>
                    <td className="px-6 py-4 text-gray-400">{p.user_details?.role}</td>
                    <td className="px-6 py-4 text-gray-400">{p.department_details?.name || 'No Dept'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-850 text-text-gray'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-3 justify-end items-center">
                        <button 
                          onClick={() => setSelectedProfile(p)}
                          className="text-xs text-primary font-bold hover:underline cursor-pointer"
                        >
                          View Profile
                        </button>
                        {isManagement && p.user !== user?.id && (
                          p.status === 'INACTIVE' ? (
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleActivateMember(p)}
                                className="text-xs text-emerald-400 hover:text-emerald-500 font-bold hover:underline cursor-pointer"
                              >
                                Activate
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button 
                                  onClick={() => handleHardDeleteMember(p)}
                                  className="text-xs text-red-405 hover:text-red-400 font-bold hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleDeleteMember(p)}
                              className="text-xs text-red-450 hover:text-red-400 font-bold hover:underline cursor-pointer"
                            >
                              Deactivate
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Modal (First Login Temporary Credentials Display) */}
      <AnimatePresence>
        {isSuccessModalOpen && createdCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-card-dark border border-border-dark p-6 rounded-2xl shadow-2xl space-y-6 text-xs"
            >
              <div className="text-center space-y-2 border-b border-border-dark pb-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-lg font-bold text-white">Account Created Successfully</h2>
                <p className="text-[11px] text-text-gray">
                  Provide these credentials to the team member. They must reset their password on first login.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 py-1">
                  <span className="text-text-gray font-medium uppercase tracking-wider text-[9px] self-center">Name</span>
                  <span className="col-span-2 text-white font-semibold text-sm">{createdCredentials.name}</span>
                </div>
                <div className="grid grid-cols-3 py-1">
                  <span className="text-text-gray font-medium uppercase tracking-wider text-[9px] self-center">Role</span>
                  <span className="col-span-2 text-white font-semibold">{createdCredentials.role}</span>
                </div>
                <div className="grid grid-cols-3 py-1">
                  <span className="text-text-gray font-medium uppercase tracking-wider text-[9px] self-center">Username</span>
                  <span className="col-span-2 text-white font-bold font-mono">@{createdCredentials.username}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-t border-border-dark/45 pt-3">
                  <span className="text-text-gray font-medium uppercase tracking-wider text-[9px] self-center">Temp Password</span>
                  <span className="col-span-2 text-amber-400 font-bold font-mono text-sm bg-slate-950/60 p-2 rounded-lg border border-border-dark/65 select-all">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-border-dark/45 pt-4">
                <button 
                  onClick={handleCopyCredentials}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Copy size={12} />
                  <span>{copied ? "Copied!" : "Copy Details"}</span>
                </button>
                <button 
                  onClick={handlePrintCredentials}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-border-dark hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Printer size={12} />
                  <span>Print</span>
                </button>
                <button 
                  onClick={() => { setIsSuccessModalOpen(false); setCreatedCredentials(null); }}
                  className="px-4 py-2.5 bg-slate-900 border border-border-dark hover:bg-slate-800 text-gray-400 hover:text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal (Management only) */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card-dark border border-border-dark p-6 rounded-2xl shadow-2xl space-y-6 text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-4">
                <div className="flex items-center gap-2">
                  <Edit size={16} className="text-primary" />
                  <h2 className="text-base font-bold text-white">Edit Team Member Details</h2>
                </div>
                <button onClick={() => setEditingProfile(null)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Full Name *</label>
                    <input 
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Email Address *</label>
                    <input 
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    >
                      <option value="MANAGEMENT">Manager</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="INTERN">Intern</option>
                      <option value="FELLOW">Fellow</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Department</label>
                    <select
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    >
                      <option value="">No Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Date of Birth</label>
                    <input 
                      type="date"
                      value={editDOB}
                      onChange={(e) => setEditDOB(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Address</label>
                    <input 
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Emergency Contact</label>
                    <input 
                      type="text"
                      value={editEmergency}
                      onChange={(e) => setEditEmergency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Joining Date</label>
                    <input 
                      type="date"
                      value={editJoiningDate}
                      onChange={(e) => setEditJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 border-t border-border-dark/45 pt-3">
                  <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Skills (Comma-separated)</label>
                  <input 
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="Python, React, Django..."
                    className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Internal Notes</label>
                  <textarea 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 border-t border-border-dark/45 pt-4">
                  <button 
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 py-2.5 bg-primary hover:bg-indigo-600 disabled:bg-primary/50 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {savingEdit && <Loader2 className="animate-spin" size={12} />}
                    <span>Save Changes</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="px-4 py-2.5 bg-slate-900 border border-border-dark hover:bg-slate-800 text-gray-400 hover:text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Team Member Side Modal (Management only) */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-xl bg-card-dark border-l border-border-dark h-screen max-h-screen overflow-y-auto z-10 p-6 md:p-8 space-y-6 text-xs"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-4">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-primary" />
                  <h2 className="text-lg font-bold text-white">Create Team Member Account</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-6">
                
                {/* Section 1 — Personal Information */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border-dark/30 pb-1">Section 1 — Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Full Name *</label>
                      <input 
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => handleSuggestUsername(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Email Address *</label>
                      <input 
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="john.doe@maango.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Phone Number *</label>
                      <input 
                        type="text"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Date of Birth *</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="date"
                          required
                          value={formDOB}
                          onChange={(e) => setFormDOB(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                        />
                        {formDOB && (
                          <span className="text-[10px] bg-slate-800 border border-border-dark px-2.5 py-2 rounded-xl text-text-gray shrink-0 font-bold">
                            {calculateAge(formDOB)} yrs
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Gender</label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Address (Optional)</label>
                    <input 
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="123 Main St, Tech City"
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Emergency Contact Info (Optional)</label>
                    <input 
                      type="text"
                      value={formEmergency}
                      onChange={(e) => setFormEmergency(e.target.value)}
                      placeholder="Name, Phone, Relation"
                      className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Section 2 — Professional Information */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border-dark/30 pb-1">Section 2 — Professional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Role *</label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      >
                        <option value="MANAGEMENT">Manager</option>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="INTERN">Intern</option>
                        <option value="FELLOW">Fellow</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Department *</label>
                      <select
                        required
                        value={formDept}
                        onChange={(e) => setFormDept(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Joining Date</label>
                      <input 
                        type="date"
                        required
                        value={formJoiningDate}
                        onChange={(e) => setFormJoiningDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Employment Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3 — Login Credentials */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border-dark/30 pb-1">Section 3 — Login Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Username</label>
                      <input 
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Temporary Password</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          required
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none font-mono text-amber-400"
                        />
                        <button 
                          type="button"
                          onClick={handleRegeneratePassword}
                          className="px-3 bg-slate-900 hover:bg-slate-800 border border-border-dark text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Regen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4 — Optional Details */}
                <div className="border border-border-dark rounded-xl overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setOptionalOpen(!optionalOpen)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-950/40 font-bold hover:bg-slate-950/60 transition-colors"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-text-gray">Section 4 — Optional Details</span>
                    {optionalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <AnimatePresence>
                    {optionalOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-4 space-y-3 bg-slate-900/40 border-t border-border-dark overflow-hidden"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Skills (Comma-separated)</label>
                          <input 
                            type="text"
                            value={formSkills}
                            onChange={(e) => setFormSkills(e.target.value)}
                            placeholder="Python, React, SQL..."
                            className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">GitHub Profile URL</label>
                            <input 
                              type="url"
                              value={formGithub}
                              onChange={(e) => setFormGithub(e.target.value)}
                              placeholder="https://github.com/..."
                              className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">LinkedIn Profile URL</label>
                            <input 
                              type="url"
                              value={formLinkedin}
                              onChange={(e) => setFormLinkedin(e.target.value)}
                              placeholder="https://linkedin.com/in/..."
                              className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Internal Profile Notes</label>
                          <textarea 
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            rows={3}
                            placeholder="Specify details, mentor feedback, or intern project details."
                            className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Section 5 — Identity Verification (Optional) */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border-dark/30 pb-1">Section 5 — Identity Verification (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Document Type</label>
                      <select
                        value={formIdDocType}
                        onChange={(e) => setFormIdDocType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none"
                      >
                        <option value="MASKED_AADHAAR">Masked Aadhaar</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVING_LICENCE">Driving Licence</option>
                        <option value="VOTER_ID">Voter ID</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Select identity file</label>
                      <input 
                        type="file"
                        onChange={(e) => setFormIdFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-border-dark rounded-xl text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border-dark/45 pt-4">
                  <button 
                    type="submit"
                    disabled={submittingCreate}
                    className="flex-1 py-2.5 bg-primary hover:bg-indigo-600 disabled:bg-primary/50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submittingCreate && <Loader2 className="animate-spin" size={12} />}
                    <span>Create Account</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-900 border border-border-dark hover:bg-slate-800 text-gray-400 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Details Modal with Tabs */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setSelectedProfile(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-card-dark border border-border-dark p-6 rounded-2xl shadow-2xl space-y-6 text-xs max-h-[90vh] overflow-y-auto z-10"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-border-dark pb-4">
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-primary flex items-center justify-center font-bold text-primary text-2xl">
                    {selectedProfile.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedProfile.name}</h2>
                    <p className="text-xs text-text-gray">{selectedProfile.user_details?.role} • {selectedProfile.department_details?.name}</p>
                    <p className="text-[10px] text-text-gray mt-0.5">@{selectedProfile.user_details?.username || 'no-username'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isManagement && (
                    <button 
                      onClick={() => handleStartEdit(selectedProfile)}
                      className="p-2 text-primary hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {isManagement && selectedProfile.user !== user?.id && (
                    selectedProfile.status === 'INACTIVE' ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleActivateMember(selectedProfile)}
                          disabled={isDeleting}
                          className="p-2 text-emerald-450 hover:bg-emerald-950/20 rounded-xl transition-colors cursor-pointer"
                          title="Activate Account"
                        >
                          <Check size={16} />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button 
                            onClick={() => handleHardDeleteMember(selectedProfile)}
                            disabled={isDeleting}
                            className="p-2 text-red-450 hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                            title="Permanently Delete Member"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleDeleteMember(selectedProfile)}
                        disabled={isDeleting}
                        className="p-2 text-red-450 hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                        title="Deactivate Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    )
                  )}
                  <button onClick={() => setSelectedProfile(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-border-dark pb-1 text-xs">
                {(['general', 'projects', 'tasks', 'documents'] as const).map((t) => {
                  // Only Admin, Chief, Management can access Documents tab
                  if (t === 'documents' && !isManagement) return null;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`pb-2 px-3 border-b-2 font-medium capitalize transition-all cursor-pointer ${
                        activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content: General Info */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs animate-fade-in">
                  
                  {/* Left Column: Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary">General Information</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                      <div>
                        <span className="text-text-gray text-[9px] uppercase font-bold block">Gender</span>
                        <span className="text-white font-medium">{selectedProfile.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-text-gray text-[9px] uppercase font-bold block">Age</span>
                        <span className="text-white font-medium">{selectedProfile.age || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-text-gray text-[9px] uppercase font-bold block">Email</span>
                        <span className="text-white font-medium block truncate">{selectedProfile.user_details?.email}</span>
                      </div>
                      <div>
                        <span className="text-text-gray text-[9px] uppercase font-bold block">Phone</span>
                        <span className="text-white font-medium">{selectedProfile.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-text-gray text-[9px] uppercase font-bold block">Date of Joining</span>
                        <span className="text-white font-medium">{selectedProfile.joining_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-text-gray text-[9px] uppercase font-bold block">Employment Type</span>
                        <span className="text-white font-medium">{selectedProfile.employment_type?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="border-t border-border-dark/40 pt-3">
                      <span className="text-text-gray text-[9px] uppercase font-bold block">Office Address</span>
                      <span className="text-white block mt-0.5">{selectedProfile.address || 'No address logged'}</span>
                    </div>

                    <div className="border-t border-border-dark/40 pt-3">
                      <span className="text-text-gray text-[9px] uppercase font-bold block">Emergency Contact Info</span>
                      <span className="text-white block mt-0.5">{selectedProfile.emergency_contact || 'No emergency details'}</span>
                    </div>

                    <div className="border-t border-border-dark/40 pt-3">
                      <span className="text-text-gray text-[9px] uppercase font-bold block">Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedProfile.skills?.length === 0 ? (
                          <span className="text-text-gray italic">No skills listed</span>
                        ) : (
                          selectedProfile.skills?.map((sk: string) => (
                            <span key={sk} className="bg-slate-800 px-2 py-0.5 rounded text-gray-300 text-[10px]">{sk}</span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 border-t border-border-dark/40 pt-3">
                      {selectedProfile.github && (
                        <a href={selectedProfile.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink size={12} />
                          <span>GitHub</span>
                        </a>
                      )}
                      {selectedProfile.linkedin && (
                        <a href={selectedProfile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink size={12} />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {isManagement && selectedProfile.user !== user?.id && (
                        <div className="border-t border-border-dark/40 pt-4 mt-4 space-y-2">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Account Actions</span>
                          {selectedProfile.status === 'INACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleActivateMember(selectedProfile)}
                              disabled={isDeleting}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-950/40 border border-emerald-500/20 hover:bg-emerald-900/30 text-emerald-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              <Check size={12} />
                              <span>Activate Team Member Account</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(selectedProfile)}
                              disabled={isDeleting}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-950/40 border border-red-500/20 hover:bg-red-900/30 text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span>Deactivate Team Member Account</span>
                            </button>
                          )}

                          {user?.role === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleHardDeleteMember(selectedProfile)}
                              disabled={isDeleting}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-950/20 border border-red-500/35 hover:bg-red-900/40 text-red-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span>Permanently Delete Member (Admins Only)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Identity Verification */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-border-dark/60 pt-4 md:pt-0 md:pl-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Identity Verification</h3>
                    
                    {selectedProfile.user !== user?.id && !isManagement ? (
                      <p className="text-xs text-text-gray italic">Only managers or the profile owner can review identity documents.</p>
                    ) : (
                      <div className="space-y-4">
                        {verificationData ? (
                          <div className="p-4 rounded-xl bg-slate-900/60 border border-border-dark text-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{verificationData.document_type.replace('_', ' ')}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                verificationData.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400' :
                                verificationData.status === 'REJECTED' ? 'bg-red-950 text-red-400' :
                                'bg-amber-950 text-amber-400'
                              }`}>{verificationData.status}</span>
                            </div>

                            {isManagement && (
                              <div className="flex items-center gap-2 border-t border-border-dark/40 pt-3">
                                <button 
                                  onClick={downloadIdentityDoc} 
                                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium text-[10px] cursor-pointer"
                                >
                                  <Download size={10} />
                                  <span>Download file</span>
                                </button>
                                {verificationData.status === 'PENDING' && (
                                  <>
                                    <button 
                                      onClick={() => handleVerifyStatus('VERIFIED')}
                                      disabled={verifyingDoc}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-[10px] cursor-pointer"
                                    >
                                      <Check size={10} />
                                      <span>Verify</span>
                                    </button>
                                    <button 
                                      onClick={() => handleVerifyStatus('REJECTED')}
                                      disabled={verifyingDoc}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-650 hover:bg-red-500 rounded-lg text-white font-bold text-[10px] cursor-pointer"
                                    >
                                      <X size={10} />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center p-6 border-2 border-dashed border-border-dark rounded-xl">
                            <FileText className="mx-auto text-gray-600 mb-2" size={28} />
                            <p className="text-[11px] text-text-gray">No verification document uploaded.</p>
                          </div>
                        )}

                        {selectedProfile.user === user?.id && (!verificationData || verificationData.status !== 'VERIFIED') && (
                          <form onSubmit={handleUploadIdentity} className="space-y-3 pt-3 border-t border-border-dark/40">
                            <h4 className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Upload Verification ID</h4>
                            <select 
                              value={idDocType} 
                              onChange={(e) => setIdDocType(e.target.value)}
                              className="w-full p-2 bg-slate-900 border border-border-dark rounded-xl text-sm"
                            >
                              <option value="MASKED_AADHAAR">Masked Aadhaar</option>
                              <option value="PASSPORT">Passport</option>
                              <option value="DRIVING_LICENCE">Driving Licence</option>
                              <option value="VOTER_ID">Voter ID</option>
                              <option value="OTHER">Other</option>
                            </select>
                            <input 
                              type="file" 
                              required
                              onChange={(e) => setIdFile(e.target.files ? e.target.files[0] : null)}
                              className="w-full text-xs text-text-gray" 
                            />
                            <button 
                              type="submit" 
                              disabled={uploadingDoc}
                              className="w-full flex items-center justify-center gap-1 py-1.5 bg-primary hover:bg-indigo-600 disabled:bg-primary/50 text-white font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              {uploadingDoc && <Loader2 className="animate-spin" size={10} />}
                              <span>Upload Document</span>
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: Projects */}
              {activeTab === 'projects' && (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Assigned Projects</h3>
                  {selectedProfile.user_details?.role === 'FELLOW' ? (
                    /* Fellowship Project Details */
                    selectedProfile.fellowship_details?.project_id ? (
                      <div className="p-4 bg-slate-900/40 border border-border-dark/65 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-sm">{selectedProfile.fellowship_details.project_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/40 text-amber-400 border border-amber-900/30`}>
                            Fellowship Project
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-text-gray text-[9px] uppercase font-bold block">Mentor</span>
                            <span className="text-white font-semibold">{selectedProfile.fellowship_details.mentor_name}</span>
                          </div>
                          <div>
                            <span className="text-text-gray text-[9px] uppercase font-bold block">Deadline</span>
                            <span className="text-white font-semibold">
                              {selectedProfile.fellowship_details.deadline ? new Date(selectedProfile.fellowship_details.deadline).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-text-gray uppercase">
                            <span>Milestone Progress</span>
                            <span>{selectedProfile.fellowship_details.progress_pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-border-dark/40">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${selectedProfile.fellowship_details.progress_pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-gray italic py-4">No Fellowship Project assigned.</p>
                    )
                  ) : (
                    /* Ordinary assigned projects list */
                    profileProjects.length === 0 ? (
                      <p className="text-xs text-text-gray italic py-4">No projects assigned.</p>
                    ) : (
                      profileProjects.map((p) => (
                        <div key={p.id} className="p-3.5 bg-slate-900/40 border border-border-dark/65 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white text-sm">{p.name}</span>
                            <span className="text-[10px] text-text-gray block mt-0.5">Priority: {p.priority} • Client: {p.client || 'Internal'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-primary block">{p.completion_percentage}%</span>
                            <span className="text-[9px] text-text-gray">Progress</span>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              )}

              {/* Tab Content: Tasks */}
              {activeTab === 'tasks' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Assigned Tasks Workspace</h3>
                  {selectedProfile.user_details?.role === 'FELLOW' ? (
                    <div className="text-center py-6 space-y-4 max-w-sm mx-auto">
                      <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <FolderClosed size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Fellowship Work Tracker</h4>
                        <p className="text-[11px] text-text-gray mt-1">
                          Fellows manage their own internal sub-task lists. You can open their primary project scope to review milestone progress.
                        </p>
                      </div>
                      {selectedProfile.fellowship_details?.project_id ? (
                        <button
                          onClick={() => {
                            setSelectedProfile(null);
                            navigate(`/projects?id=${selectedProfile.fellowship_details.project_id}`);
                          }}
                          className="w-full py-2 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Open Fellowship Project
                        </button>
                      ) : (
                        <p className="text-[10px] text-text-gray italic">No project currently assigned to this fellow.</p>
                      )}
                    </div>
                  ) : (
                    profileTasks.length === 0 ? (
                      <p className="text-xs text-text-gray italic py-4">No tasks assigned.</p>
                    ) : (
                      profileTasks.map((t) => (
                        <div key={t.id} className="p-3.5 bg-slate-900/40 border border-border-dark/65 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-sm">{t.name}</span>
                            <span className="text-[10px] text-text-gray block mt-0.5">Due: {t.due_date || 'No deadline'} • Status: {t.status.replace('_', ' ')}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            t.priority === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                            t.priority === 'HIGH' ? 'bg-orange-950 text-orange-400' :
                            'bg-slate-800 text-text-gray'
                          }`}>{t.priority}</span>
                        </div>
                      ))
                    )
                  )}
                </div>
              )}

              {/* Tab Content: Documents */}
              {activeTab === 'documents' && isManagement && (
                <div className="space-y-6 animate-fade-in text-xs">
                  
                  {/* Documents list */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray mb-2">Profile Documents Library</h3>
                    {profileDocuments.length === 0 ? (
                      <p className="text-xs text-text-gray italic py-4">No documents uploaded.</p>
                    ) : (
                      profileDocuments.map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-900/40 border border-border-dark/60 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">{doc.file_name}</span>
                            <span className="text-[9px] text-text-gray block mt-0.5">
                              Uploaded by: {doc.uploader_details?.email} • Version: {doc.version} • {doc.description || 'No description'}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleViewProfileDoc(doc)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all cursor-pointer"
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Upload document form */}
                  <form onSubmit={handleUploadProfileDoc} className="border-t border-border-dark/50 pt-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Upload New Document</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="file" 
                        required
                        onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-xs text-text-gray" 
                      />
                      <input 
                        type="text" 
                        placeholder="Description (Optional)"
                        value={docDesc}
                        onChange={(e) => setDocDesc(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-border-dark rounded-xl text-sm"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={uploadingProfileDoc}
                      className="w-full flex items-center justify-center gap-1 py-1.5 bg-primary hover:bg-indigo-600 disabled:bg-primary/50 text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      {uploadingProfileDoc && <Loader2 className="animate-spin" size={10} />}
                      <span>Upload Profile Document</span>
                    </button>
                  </form>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
