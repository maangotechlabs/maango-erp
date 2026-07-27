import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Search, Plus, Trash2, X, Mail, Phone, 
  MapPin, Calendar, FileText, 
  Download, Check, Briefcase, ShieldCheck, Loader2,
  ExternalLink, Upload, AlertCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Team: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Selected profile details & tabs
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'projects' | 'tasks' | 'documents'>('general');
  const [verificationData, setVerificationData] = useState<any>(null);
  
  // Related lists for details tabs
  const [profileProjects, setProfileProjects] = useState<any[]>([]);
  const [profileTasks, setProfileTasks] = useState<any[]>([]);
  const [profileDocuments, setProfileDocuments] = useState<any[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ID Upload
  const [idDocType, setIdDocType] = useState('MASKED_AADHAAR');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState(false);

  // Profile Document Upload
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDesc, setDocDesc] = useState('');
  const [uploadingProfileDoc, setUploadingProfileDoc] = useState(false);

  // Creation form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('EMPLOYEE');
  const [formDept, setFormDept] = useState('');
  const [formEmpType, setFormEmpType] = useState('FULL_TIME');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEmergency, setFormEmergency] = useState('');
  const [formBio, setFormBio] = useState('');

  const isManagement = user?.role && ['ADMIN', 'CHIEF', 'MANAGEMENT'].includes(user.role);

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
      const projRes = await api.get('/projects/');
      const taskRes = await api.get('/tasks/');
      
      const allProjs = projRes.data.results || projRes.data || [];
      const allTasks = taskRes.data.results || taskRes.data || [];

      // Filter projects user is PM, Dev or Member of
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
    try {
      // 1. Create User
      const userRes = await api.post('/auth/users/', {
        email: formEmail,
        password: formPassword,
        role: formRole,
        first_name: formName.split(' ')[0] || '',
        last_name: formName.split(' ').slice(1).join(' ') || '',
      });

      // 2. Update generated Profile
      const profilesRes = await api.get('/team/profiles/');
      const newProfile = (profilesRes.data.results || profilesRes.data).find((p: any) => p.user === userRes.data.id);
      
      if (newProfile) {
        await api.patch(`/team/profiles/${newProfile.id}/`, {
          name: formName,
          department: formDept ? parseInt(formDept) : null,
          employment_type: formEmpType,
          phone: formPhone,
          address: formAddress,
          emergency_contact: formEmergency,
          bio: formBio
        });
      }

      setIsCreateModalOpen(false);
      // Reset
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormDept('');
      setFormPhone('');
      setFormAddress('');
      setFormEmergency('');
      setFormBio('');

      fetchData();
      alert("Member added successfully.");
    } catch (err: any) {
      alert("Failed to add member: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDeleteMember = async (profile: any) => {
    if (!window.confirm(`Delete profile and account of ${profile.name}?`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/auth/users/${profile.user}/`);
      setSelectedProfile(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
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
    formData.append('file', docFile);
    formData.append('file_name', docFile.name);
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
      alert("Upload failed: " + JSON.stringify(err));
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
      alert("Verification upload failed: " + JSON.stringify(err));
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

  // Filter Profiles
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.user_details?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.skills.some((sk: string) => sk.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = deptFilter ? p.department === parseInt(deptFilter) : true;
    const matchesRole = roleFilter ? p.user_details?.role === roleFilter : true;
    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
          <p className="text-sm text-text-gray mt-1">
            Browse company profiles, roles, active workloads, and verify credentials.
          </p>
        </div>
        {isManagement && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card-dark p-4 rounded-2xl border border-border-dark">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, skills..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div>
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-gray-400"
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
            className="w-full px-3 py-2 bg-slate-950/40 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-gray-400"
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

      {/* Team Grid */}
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((p) => (
            <div 
              key={p.id} 
              className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-border-dark/60 hover:border-primary/40 transition-all shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                    {p.name.charAt(0)}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    p.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-text-gray'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="font-bold text-base mt-4">{p.name}</h3>
                <p className="text-xs text-text-gray">{p.user_details?.role} • {p.department_details?.name || 'No Department'}</p>
                <p className="text-[9px] text-text-gray mt-0.5">{p.employee_id}</p>
                
                {/* Active Projects and Tasks Counts */}
                <div className="flex gap-4 mt-3 text-xs">
                  <div>
                    <span className="font-bold text-white block">{p.active_projects_count || 0}</span>
                    <span className="text-[9px] text-text-gray">Active Projects</span>
                  </div>
                  <div>
                    <span className="font-bold text-white block">{p.active_tasks_count || 0}</span>
                    <span className="text-[9px] text-text-gray">Pending Tasks</span>
                  </div>
                </div>

                {/* Skills badges */}
                <div className="flex flex-wrap gap-1 mt-4">
                  {p.skills.slice(0, 3).map((sk: string) => (
                    <span key={sk} className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-gray-300">
                      {sk}
                    </span>
                  ))}
                  {p.skills.length > 3 && (
                    <span className="text-[9px] bg-slate-800/40 px-2 py-0.5 rounded text-gray-500">
                      +{p.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-border-dark/60 mt-6 pt-4 flex items-center justify-between">
                <span className="text-[9px] text-text-gray">Join: {p.joining_date}</span>
                <button 
                  onClick={() => setSelectedProfile(p)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View Profile</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Details Modal with Tabs */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto">
            <div className="fixed inset-0" onClick={() => setSelectedProfile(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-card-dark rounded-2xl border border-border-dark max-h-[90vh] overflow-y-auto z-10 p-6 md:p-8 space-y-6"
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
                    <p className="text-[10px] text-text-gray mt-0.5">{selectedProfile.employee_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isManagement && selectedProfile.user !== user?.id && (
                    <button 
                      onClick={() => handleDeleteMember(selectedProfile)}
                      disabled={isDeleting}
                      className="p-2 text-red-400 hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button onClick={() => setSelectedProfile(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-border-dark pb-1 text-xs">
                {(['general', 'projects', 'tasks', 'documents'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-2 px-3 border-b-2 font-medium capitalize transition-all cursor-pointer ${
                      activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
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
                        {selectedProfile.skills.map((sk: string) => (
                          <span key={sk} className="bg-slate-800 px-2 py-0.5 rounded text-gray-300 text-[10px]">{sk}</span>
                        ))}
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
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold text-[10px] cursor-pointer"
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
                              className="w-full px-2 py-1.5 bg-slate-950 border border-border-dark rounded-lg text-xs"
                            >
                              <option value="MASKED_AADHAAR">Masked Aadhaar</option>
                              <option value="PASSPORT">Passport</option>
                              <option value="DRIVING_LICENCE">Driving Licence</option>
                              <option value="VOTER_ID">Voter ID</option>
                              <option value="OTHER">Other</option>
                            </select>
                            <input 
                              type="file" required
                              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                              className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white cursor-pointer"
                            />
                            <button 
                              type="submit" 
                              disabled={uploadingDoc}
                              className="w-full py-2 bg-primary hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              {uploadingDoc ? 'Uploading...' : 'Submit ID Document'}
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
                  {profileProjects.length === 0 ? (
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
                  )}
                </div>
              )}

              {/* Tab Content: Tasks */}
              {activeTab === 'tasks' && (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-gray">Assigned Tasks</h3>
                  {profileTasks.length === 0 ? (
                    <p className="text-xs text-text-gray italic py-4">No tasks assigned.</p>
                  ) : (
                    profileTasks.map((t) => (
                      <div key={t.id} className="p-3.5 bg-slate-900/40 border border-border-dark/65 rounded-xl flex items-center justify-between text-xs">
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
                  )}
                </div>
              )}

              {/* Tab Content: Documents */}
              {activeTab === 'documents' && (
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
                          <a 
                            href={doc.file} 
                            target="_blank" rel="noreferrer" 
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Upload document form */}
                  <form onSubmit={handleUploadProfileDoc} className="border-t border-border-dark/50 pt-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Upload New Document</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="text" required placeholder="Short description or label" value={docDesc} onChange={(e) => setDocDesc(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-border-dark rounded-lg outline-none text-xs"
                      />
                      <input 
                        type="file" required
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white cursor-pointer"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={uploadingProfileDoc}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                    >
                      <Upload size={12} />
                      <span>{uploadingProfileDoc ? 'Uploading...' : 'Upload Document'}</span>
                    </button>
                  </form>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal (Management only) */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto">
            <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card-dark rounded-2xl border border-border-dark max-h-[90vh] overflow-y-auto z-10 p-6 md:p-8 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-3">
                <h2 className="text-lg font-bold">Add Team Member</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Full Name</label>
                    <input 
                      type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Email Address</label>
                    <input 
                      type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Temporary Password</label>
                    <input 
                      type="password" required value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Role</label>
                    <select 
                      value={formRole} onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="CHIEF">Chief</option>
                      <option value="MANAGEMENT">Management</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="INTERN">Intern</option>
                      <option value="FELLOW">Fellow</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Department</label>
                    <select 
                      value={formDept} onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="">None</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Employment Type</label>
                    <select 
                      value={formEmpType} onChange={(e) => setFormEmpType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-text-gray"
                    >
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                      <option value="FELLOWSHIP">Fellowship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Phone Number</label>
                  <input 
                    type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Address</label>
                  <input 
                    type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Emergency Contact Details</label>
                  <input 
                    type="text" value={formEmergency} onChange={(e) => setFormEmergency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Short Biography</label>
                  <textarea 
                    value={formBio} onChange={(e) => setFormBio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none h-16 resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                >
                  Create Member Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
