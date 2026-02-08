import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Club, AuthenticatedFetch } from '../types';
import { Button } from './ui/Button';

export default function Clubs({ authenticatedFetch }: { authenticatedFetch: AuthenticatedFetch }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await authenticatedFetch('/clubs');
      if (res.ok) {
        const data = await res.json();
        setClubs(data);
      }
    } catch (err) {
      console.error('Failed to fetch clubs', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading clubs...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">IIT Bombay Clubs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clubs.map(club => (
          <div key={club.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold">{club.name}</h2>
            <p className="text-gray-600 mt-2 line-clamp-2">{club.description}</p>
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
