import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  LayoutDashboard, Users, FolderClosed, ClipboardList, 
  Megaphone, Bell, Settings, LogOut, Menu, X, 
  ChevronLeft, ChevronRight, Search, User as UserIcon, ShieldAlert,
  TrendingUp, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // First Login Reset States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetSubmitting(true);
    setResetError(null);
    try {
      await api.post('/auth/change-password/', { new_password: newPassword });
      alert("Password updated successfully. Welcome to MaAngo ERP.");
      window.location.reload();
    } catch (err: any) {
      setResetError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setResetSubmitting(false);
    }
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    users: any[]; projects: any[]; tasks: any[]; documents: any[];
  }>({ users: [], projects: [], tasks: [], documents: [] });

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/auth/notifications/unread-count/');
      setUnreadCount(response.data.unread_count);
      const listResponse = await api.get('/auth/notifications/');
      setNotifications(listResponse.data.results || listResponse.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/auth/notifications/read-all/');
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleRead = async (id: number) => {
    try {
      await api.post(`/auth/notifications/${id}/read/`);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Global Search Handler
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const res = await api.get(`/auth/users/?email=${searchQuery}`);
          const proj = await api.get(`/projects/?search=${searchQuery}`);
          const tsk = await api.get(`/tasks/?search=${searchQuery}`);
          const docs = await api.get(`/team/documents/?search=${searchQuery}`);
          
          setSearchResults({
            users: res.data.results || res.data || [],
            projects: proj.data.results || proj.data || [],
            tasks: tsk.data.results || tsk.data || [],
            documents: docs.data.results || docs.data || [],
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        setSearchResults({ users: [], projects: [], tasks: [], documents: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Keyboard shortcut CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderClosed },
    { name: 'Tasks', path: '/tasks', icon: ClipboardList },
    { name: 'Team', path: '/team', icon: Users, roles: ['ADMIN', 'CHIEF', 'MANAGEMENT', 'EMPLOYEE', 'INTERN'] },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    { name: 'Reports', path: '/reports', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.roles) {
      return item.roles.includes(user?.role || '');
    }
    return true;
  });

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    if (pathnames.length === 0) return 'Dashboard';
    return pathnames.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
  };

  if (user?.must_change_password) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 font-sans text-white">
        <div className="w-full max-w-md bg-card-dark border border-border-dark p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Secure Your Account</h1>
            <p className="text-xs text-text-gray">
              Since this is your first login, please update your temporary password to continue.
            </p>
          </div>
          
          {resetError && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs text-center font-medium">
              {resetError}
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">New Password</label>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">Confirm New Password</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 bg-slate-900 border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-white"
              />
            </div>
            <button 
              type="submit"
              disabled={resetSubmitting}
              className="w-full py-2.5 bg-primary hover:bg-indigo-600 disabled:bg-primary/50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {resetSubmitting && <Loader2 className="animate-spin" size={14} />}
              <span>Update Password & Log In</span>
            </button>
            <button 
              type="button"
              onClick={logout}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel & Log Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-dark text-white font-sans">
      
      {/* 1. Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-r border-border-dark bg-card-dark transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border-dark">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-lg shadow-primary/30">
              M
            </div>
            {!sidebarCollapsed && (
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                MAANGO ERP
              </span>
            )}
          </Link>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-white rounded-md p-1 hover:bg-slate-800"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-dark">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-primary flex items-center justify-center font-bold text-primary">
                {profile?.name ? profile.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-semibold text-sm truncate">{profile?.name || 'User'}</h4>
                <p className="text-xs text-text-gray truncate">{user?.role}</p>
              </div>
            </div>
          ) : null}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-72 h-full bg-card-dark border-r border-border-dark flex flex-col p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-extrabold text-xl tracking-wider text-primary">MAANGO ERP</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : 'text-gray-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={22} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-border-dark pt-6 mt-6">
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="flex items-center gap-4 w-full px-4 py-4 rounded-xl text-red-400 hover:bg-red-950/20"
                >
                  <LogOut size={22} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Navigation */}
        <header className="h-16 border-b border-border-dark bg-card-dark/60 backdrop-blur-md flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:block text-sm text-text-gray font-medium">
              {getBreadcrumbs()}
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Global Search CMD+K Trigger */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-border-dark hover:border-slate-600 text-gray-400 hover:text-white text-xs transition-colors"
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">⌘K</kbd>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 bg-slate-800/40 border border-border-dark rounded-xl text-gray-400 hover:text-white transition-colors relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50 rounded-xl bg-card-dark border border-border-dark shadow-2xl p-4"
                    >
                      <div className="flex items-center justify-between border-b border-border-dark pb-2 mb-3">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllRead} 
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-text-gray text-center py-6">No new notifications</p>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => { markSingleRead(n.id); setNotifOpen(false); navigate(n.link || '/'); }}
                              className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                                n.is_read ? 'bg-transparent border-transparent' : 'bg-slate-800/50 border-primary/20'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <ShieldAlert size={14} className="text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs font-semibold truncate">{n.title}</h5>
                                  <p className="text-[11px] text-text-gray mt-0.5 line-clamp-2">{n.message}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Circle */}
            <Link to="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-primary flex items-center justify-center font-bold text-primary text-xs">
                {profile?.name ? profile.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg-dark">
          {children}
        </main>
      </div>

      {/* 4. Global CMD+K Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70">
            <div className="fixed inset-0" onClick={() => setSearchOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-2xl bg-card-dark border border-border-dark shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border-dark bg-slate-900/40">
                <Search size={18} className="text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, projects, people..." 
                  className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm text-white placeholder-gray-500"
                  autoFocus
                />
                <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded">
                  ESC
                </button>
              </div>

              {/* Search Results list */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                {searchQuery.trim().length < 2 ? (
                  <p className="text-xs text-text-gray text-center py-6">Type at least 2 characters to search...</p>
                ) : (
                  <>
                    {/* Projects Result */}
                    {searchResults.projects.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Projects</h4>
                        <div className="space-y-1">
                          {searchResults.projects.map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => { navigate('/projects'); setSearchOpen(false); }}
                              className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium text-white">{p.name}</span>
                              <span className="text-[10px] bg-slate-800 text-text-gray px-2 py-0.5 rounded">{p.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks Result */}
                    {searchResults.tasks.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Tasks</h4>
                        <div className="space-y-1">
                          {searchResults.tasks.map(t => (
                            <div 
                              key={t.id} 
                              onClick={() => { navigate('/tasks'); setSearchOpen(false); }}
                              className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium text-white">{t.name}</span>
                              <span className="text-[10px] text-primary">{t.priority}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users Result */}
                    {searchResults.users.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Team Members</h4>
                        <div className="space-y-1">
                          {searchResults.users.map(u => (
                            <div 
                              key={u.id} 
                              onClick={() => { navigate('/team'); setSearchOpen(false); }}
                              className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center gap-2 text-xs"
                            >
                              <UserIcon size={12} className="text-gray-400" />
                              <span className="font-medium text-white">{u.first_name} {u.last_name}</span>
                              <span className="text-[10px] text-text-gray truncate">({u.email})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents Result */}
                    {searchResults.documents.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Documents</h4>
                        <div className="space-y-1">
                          {searchResults.documents.map(d => (
                            <div 
                              key={d.id} 
                              onClick={() => { navigate('/documents'); setSearchOpen(false); }}
                              className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium text-white">{d.file_name}</span>
                              <span className="text-[10px] text-text-gray">v{d.version}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.users.length === 0 && searchResults.projects.length === 0 && searchResults.tasks.length === 0 && searchResults.documents.length === 0 && (
                      <p className="text-xs text-text-gray text-center py-6">No matching results found</p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
