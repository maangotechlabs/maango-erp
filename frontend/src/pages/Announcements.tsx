import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Megaphone, Plus, Calendar, User, Trash2, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & form states
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isManagement = user?.role && ['ADMIN', 'CHIEF', 'MANAGEMENT'].includes(user.role);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements/');
      setAnnouncements(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('create') === 'true') {
      setIsOpen(true);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/announcements/', {
        title,
        description: desc
      });
      setTitle('');
      setDesc('');
      setIsOpen(false);
      fetchAnnouncements();
    } catch (err) {
      alert("Error posting announcement: " + JSON.stringify(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}/`);
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-dark/45 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-text-gray mt-1">
            Stay up to date with notices, updates, and releases from management.
          </p>
        </div>
        {isManagement && (
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 bg-card-dark rounded-2xl border border-border-dark">
          <Megaphone className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="font-semibold text-lg">No announcements</h3>
          <p className="text-xs text-text-gray mt-1">Check back later for company updates.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              className="glass-card p-6 rounded-2xl border border-border-dark relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-white leading-tight">{ann.title}</h3>
                  {isManagement && (
                    <button 
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-300 mt-3 whitespace-pre-wrap leading-relaxed">
                  {ann.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border-dark/50 text-[10px] text-text-gray">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <User size={11} />
                  Posted by: {ann.author_details?.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Composer Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto">
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card-dark rounded-2xl border border-border-dark max-h-[90vh] overflow-y-auto z-10 p-6 md:p-8 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-3">
                <h2 className="text-lg font-bold">Post New Announcement</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Title</label>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none text-white text-xs"
                    placeholder="e.g. System Maintenance Notice"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-gray uppercase mb-1">Details</label>
                  <textarea 
                    required value={desc} onChange={(e) => setDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-border-dark rounded-lg outline-none h-32 resize-none text-white text-xs"
                    placeholder="Type details of the announcement here..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-3 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                >
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
