import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../../../types';
import apiClient from '../../../api/client';
import { useBodies } from '../hooks/useBodies';

export default function Bodies() {
  const { bodies, loading, currentUser, fetchBodies, handleCreateBody } = useBodies();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<UserProfile | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiClient.get(`/users/search?q=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) {
      setCreateError('You must assign an initial administrator.');
      return;
    }

    try {
      await handleCreateBody({
        name,
        description,
        website_url: websiteUrl,
        initial_admin_id: selectedAdmin.id
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setWebsiteUrl('');
      setSelectedAdmin(null);
      setSearchQuery('');
      setSearchResults([]);
      fetchBodies();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create body');
    }
  };

  if (loading) return <div className="p-10 text-center text-white">Loading Campus Bodies...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Campus Bodies</h1>
            <p className="text-slate-400">Discover clubs, teams, and organizations.</p>
        </div>
        {currentUser?.is_system_admin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            Create Body
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bodies.map(body => (
          <div key={body.id} className="group bg-white/5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all overflow-hidden flex flex-col">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-purple-600/20 group-hover:from-primary/30 transition-all relative">
                <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-xl">
                    {body.name[0]}
                </div>
            </div>
            <div className="p-6 pt-8">
                <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{body.name}</h2>
                <p className="text-slate-400 mt-2 line-clamp-2 text-sm leading-relaxed">{body.description}</p>

                <div className="mt-6 flex items-center justify-between gap-4">
                    <Link to={`/bodies/${body.id}`} className="flex-1">
                        <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/5 text-sm">
                            View Pulse
                        </button>
                    </Link>
                    {body.website_url && (
                        <a href={body.website_url} target="_blank" rel="noopener noreferrer" className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all">
                            <span className="material-symbols-outlined">language</span>
                        </a>
                    )}
                </div>
            </div>
          </div>
        ))}
        {bodies.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                <p className="text-slate-500">No campus bodies found. Pulse is quiet.</p>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-md">
          <div className="bg-[#1a1223] border border-primary/20 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2 text-white">New Campus Body</h2>
            <p className="text-slate-400 text-sm mb-6">Establish a new heartbeat on campus.</p>

            {createError && <div className="text-red-400 mb-4 text-xs bg-red-400/10 border border-red-400/20 p-3 rounded-xl">{createError}</div>}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="e.g. Robotics Club"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="What is the heartbeat of this body?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Website</label>
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="https://robotics.pulse.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Initial Admin</label>
                {!selectedAdmin ? (
                  <div className="relative">
                    <input
                      value={searchQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder="Search students..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-[#251a30] border border-primary/20 mt-2 max-h-48 overflow-y-auto rounded-xl shadow-2xl z-50">
                        {searchResults.map(user => (
                          <div
                            key={user.id}
                            onClick={() => { setSelectedAdmin(user); setSearchQuery(''); setSearchResults([]); }}
                            className="p-3 hover:bg-primary/10 cursor-pointer transition-colors"
                          >
                            <div className="font-bold text-white text-sm">{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <div>
                      <div className="font-bold text-primary text-sm">{selectedAdmin.first_name} {selectedAdmin.last_name}</div>
                      <div className="text-[10px] text-slate-400">{selectedAdmin.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAdmin(null)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                    Create Body
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
