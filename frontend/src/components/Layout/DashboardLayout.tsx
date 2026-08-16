import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  LayoutDashboard, Users, FolderClosed, ClipboardList, 
  Megaphone, Bell, Settings, LogOut, Menu, X, 
  ChevronLeft, ChevronRight, Search, User as UserIcon, ShieldAlert,
  TrendingUp, Loader2, Sun, Moon, Plus
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

  // Enforce Dark Mode matching Logo Theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme_mode', 'dark');
  }, []);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark p-4 font-sans text-text-white">
        <div className="w-full max-w-md bg-card-dark border border-border-dark p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-white">Secure Your Account</h1>
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
                className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-text-white"
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
                className="w-full px-3 py-2 bg-bg-dark border border-border-dark rounded-xl text-sm focus:border-primary outline-none text-text-white"
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
              className="w-full py-2 bg-bg-dark hover:bg-slate-800 text-text-gray hover:text-text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-border-dark"
            >
              Cancel & Log Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-dark text-text-white font-sans p-4 gap-4 transition-colors duration-200">
      
      {/* 1. Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border border-border-dark bg-sidebar-dark rounded-[22px] transition-all duration-300 shadow-sm ${
          sidebarCollapsed ? 'w-20' : 'w-[280px]'
        }`}
        style={{
          backgroundColor: 'var(--color-sidebar-dark)',
        }}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-border-dark">
          <Link to="/" className="flex items-center">
            {sidebarCollapsed ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-maango-gradient font-bold text-white shadow-sm">
                M
              </div>
            ) : (
              <img src="/Assets/WordMark.png" alt="MaAngo Logo" className="h-8 max-w-[180px] object-contain" />
            )}
          </Link>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-text-gray hover:text-primary rounded-md p-1 hover:bg-secondary/5 cursor-pointer"
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
                className={`flex items-center gap-4 px-4 py-3.5 rounded-[14px] transition-all duration-150 ${
                  isActive 
                    ? 'bg-maango-gradient text-white shadow-sm' 
                    : 'text-text-gray hover:text-primary hover:bg-sidebar-hover'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-text-gray'} />
                {!sidebarCollapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-dark">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                {profile?.name ? profile.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-semibold text-sm truncate">{profile?.name || 'User'}</h4>
                <p className="text-[10px] text-text-gray truncate">{user?.role} • MaAngo</p>
              </div>
            </div>
          ) : null}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
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
            className="fixed inset-0 z-45 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-72 h-full bg-sidebar-dark border-r border-border-dark flex flex-col p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <img src="/Assets/WordMark.png" alt="MaAngo Logo" className="h-8 max-w-[180px] object-contain" />
                <button onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
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
                          ? 'bg-maango-gradient text-white' 
                          : 'text-text-gray hover:bg-sidebar-hover'
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
                  className="flex items-center gap-4 w-full px-4 py-4 rounded-xl text-red-500 hover:bg-red-950/20 cursor-pointer"
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
      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        
        {/* Top Header Navigation (Floating Navbar) */}
        <header className="h-[74px] border border-border-dark bg-card-dark rounded-[20px] flex items-center justify-between px-6 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-text-gray hover:text-primary cursor-pointer"
            >
              <Menu size={24} />
            </button>
            
            {/* Spotlight Search Bar */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-4 py-2 w-64 rounded-full bg-bg-dark border border-border-dark hover:border-text-gray/30 text-text-gray hover:text-primary text-xs transition-colors cursor-pointer"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search projects...</span>
              <kbd className="bg-card-dark px-1.5 py-0.5 rounded text-[10px] border border-border-dark">⌘K</kbd>
            </button>
          </div>

          {/* Center Breadcrumb */}
          <div className="hidden lg:block text-sm text-text-gray font-medium">
            {getBreadcrumbs()}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Create Button */}
            <button 
              onClick={() => navigate('/tasks')}
              className="h-9 w-9 rounded-full bg-primary text-white hover:opacity-90 flex items-center justify-center shadow-sm cursor-pointer"
              title="Quick Create Task"
            >
              <Plus size={18} />
            </button>



            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 bg-bg-dark border border-border-dark rounded-xl text-text-gray hover:text-primary transition-colors relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
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
                      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50 rounded-xl bg-card-dark border border-border-dark shadow-2xl p-4 text-text-white animate-fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-border-dark pb-2 mb-3">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllRead} 
                            className="text-xs text-primary hover:underline font-medium cursor-pointer"
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
                                n.is_read ? 'bg-transparent border-transparent hover:bg-bg-dark' : 'bg-secondary/5 border-primary/20'
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
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                {profile?.name ? profile.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-card-dark border border-border-dark rounded-[22px] shadow-sm">
          {children}
        </main>
      </div>

      {/* 4. Global CMD+K Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-[4px]">
            <div className="fixed inset-0" onClick={() => setSearchOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-2xl bg-card-dark border border-border-dark shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border-dark bg-bg-dark">
                <Search size={18} className="text-text-gray" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, projects, people..." 
                  className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm text-text-white placeholder-text-gray"
                  autoFocus
                />
                <button onClick={() => setSearchOpen(false)} className="text-text-gray hover:text-primary text-xs bg-card-dark border border-border-dark px-2.5 py-1 rounded-lg cursor-pointer">
                  ESC
                </button>
              </div>

              {/* Search Results list */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-text-white">
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
                              className="p-2 rounded-lg hover:bg-bg-dark cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="text-[10px] bg-bg-dark text-text-gray px-2 py-0.5 rounded border border-border-dark">{p.status}</span>
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
                              className="p-2 rounded-lg hover:bg-bg-dark cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium">{t.name}</span>
                              <span className="text-[10px] text-primary bg-bg-dark px-2 py-0.5 rounded border border-border-dark">{t.priority}</span>
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
                              className="p-2 rounded-lg hover:bg-bg-dark cursor-pointer flex items-center gap-2 text-xs"
                            >
                              <UserIcon size={12} className="text-text-gray" />
                              <span className="font-medium">{u.first_name} {u.last_name}</span>
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
                              onClick={() => { navigate('/team'); setSearchOpen(false); }}
                              className="p-2 rounded-lg hover:bg-bg-dark cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium">{d.file_name}</span>
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
