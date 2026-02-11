import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Body } from '../types';
import { Button } from './ui/Button';
import apiClient from '../api/client';

export default function Bodies() {
  const [bodies, setBodies] = useState<Body[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBodies();
  }, []);

  const fetchBodies = async () => {
    try {
      const res = await apiClient.get('/bodies');
      setBodies(res.data);
    } catch (err) {
      console.error('Failed to fetch bodies', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading bodies...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bodies</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bodies.map(body => (
          <div key={body.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">{body.name}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{body.description}</p>
            <div className="mt-4 flex justify-between items-center">
              <Link to={`/bodies/${body.id}`}>
                <Button variant="outline" size="sm">View Profile</Button>
              </Link>
              {body.website_url && (
                <a href={body.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
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
