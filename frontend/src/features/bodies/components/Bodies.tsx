import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../../../types';
import { Button } from '../../../components/ui/Button';
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
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setCreateError(axiosError.response?.data?.error || 'Failed to create body');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading campus bodies...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Campus Bodies</h1>
            <p className="text-slate-400 mt-1">Discover clubs, organizations, and chapters</p>
        </div>
        {currentUser?.is_system_admin && (
          <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined mr-2">add_circle</span>
            Create Body
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bodies.map(body => (
          <div key={body.id} className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-primary/30 transition-all flex flex-col">
            <div className="h-24 bg-gradient-to-br from-primary/20 to-purple-900/40 relative">
                <div className="absolute -bottom-6 left-6 size-16 rounded-xl bg-[#191022] border-2 border-white/10 flex items-center justify-center text-primary text-2xl font-bold">
                    {body.name[0]}
                </div>
            </div>
            <div className="p-6 pt-10 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{body.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2 py-0.5 rounded">Official</span>
                    {body.website_url && (
                        <span className="material-symbols-outlined text-xs text-slate-500">language</span>
                    )}
                </div>
                <p className="text-slate-400 mt-4 text-sm line-clamp-3 leading-relaxed flex-1">{body.description}</p>
                <div className="mt-6 flex items-center justify-between gap-3">
                    <Link to={`/bodies/${body.id}`} className="flex-1">
                        <button className="w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-xl transition-all border border-primary/20">
                            View Profile
                        </button>
                    </Link>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400">
                        <span className="material-symbols-outlined">bookmark</span>
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#191022] border border-white/10 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create New Body</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {createError && <div className="text-red-400 mb-6 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-xl">{createError}</div>}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Website URL</label>
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Initial Admin</label>
                {!selectedAdmin ? (
                  <div className="relative">
                    <input
                      value={searchQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder="Search users..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-[#251a30] border border-white/10 mt-2 max-h-48 overflow-y-auto rounded-xl shadow-2xl z-10">
                        {searchResults.map(user => (
                          <div
                            key={user.id}
                            onClick={() => { setSelectedAdmin(user); setSearchQuery(''); setSearchResults([]); }}
                            className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                          >
                            <div className="font-bold text-white text-sm">{user.first_name} {user.last_name}</div>
                            <div className="text-[10px] text-slate-500">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <div>
                      <div className="font-bold text-white text-sm">{selectedAdmin.first_name} {selectedAdmin.last_name}</div>
                      <div className="text-[10px] text-slate-500">{selectedAdmin.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAdmin(null)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">Cancel</button>
                <Button type="submit" className="px-8 shadow-lg shadow-primary/20">Create Body</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
