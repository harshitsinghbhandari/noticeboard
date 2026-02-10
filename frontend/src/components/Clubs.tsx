import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Club } from '../types';
import { Button } from './ui/Button';
import apiClient from '../api/client';

interface ClubsProps {
  userRoles: string[];
}

export default function Clubs({ userRoles }: ClubsProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '', website_url: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await apiClient.get('/clubs');
      setClubs(res.data);
    } catch (err) {
      console.error('Failed to fetch clubs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post('/clubs', newClub);
      setShowCreateModal(false);
      setNewClub({ name: '', description: '', website_url: '' });
      fetchClubs(); // Refresh list
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error('Failed to create club', error);
      const errorMessage = error.response?.data?.error || 'Failed to create club';
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-4">Loading clubs...</div>;

  const isClubAdmin = userRoles.includes('CLUB_ADMIN');

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">IIT Bombay Clubs</h1>
        {isClubAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>Create Club</Button>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Club Name</label>
                <input
                  type="text"
                  required
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  required
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website URL (Optional)</label>
                <input
                  type="url"
                  value={newClub.website_url}
                  onChange={(e) => setNewClub({ ...newClub, website_url: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Club'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clubs.map(club => (
          <div key={club.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">{club.name}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{club.description}</p>
            <div className="mt-4 flex justify-between items-center">
              <Link to={`/clubs/${club.id}`}>
                <Button variant="outline" size="sm">View Profile</Button>
              </Link>
              {club.website_url && (
                <a href={club.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
