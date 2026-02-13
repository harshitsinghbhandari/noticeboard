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
      fetchBodies(); // Refresh list
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create body');
    }
  };

  if (loading) return <div className="p-4">Loading bodies...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bodies</h1>
        {currentUser?.is_system_admin && (
          <Button onClick={() => setIsModalOpen(true)}>Create Body</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bodies.map(body => (
          <div key={body.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{body.name}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{body.description}</p>
            <div className="mt-4 flex justify-between items-center">
              <Link to={`/bodies/${body.id}`}>
                <Button variant="outline" size="sm">View Profile</Button>
              </Link>
              {body.website_url && (
                <a href={body.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">
                  Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Body</h2>
            {createError && <div className="text-red-500 mb-4 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">{createError}</div>}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Initial Admin</label>
                {!selectedAdmin ? (
                  <div className="relative">
                    <input
                      value={searchQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-1 max-h-48 overflow-y-auto rounded shadow-lg z-10">
                        {searchResults.map(user => (
                          <div
                            key={user.id}
                            onClick={() => { setSelectedAdmin(user); setSearchQuery(''); setSearchResults([]); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                          >
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700/50">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedAdmin.first_name} {selectedAdmin.last_name}</div>
                      <div className="text-xs text-gray-500">{selectedAdmin.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAdmin(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Body</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
