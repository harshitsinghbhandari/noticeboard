import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Club, Post, Opening, AuthenticatedFetch } from '../types';
import { Button } from './ui/Button';
import PostCard from './PostCard';

export default function ClubProfile({ authenticatedFetch }: { authenticatedFetch: AuthenticatedFetch }) {
  const { id } = useParams();
  const [club, setClub] = useState<Club | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClubData();
    }
  }, [id]);

  const fetchClubData = async () => {
    try {
      const [clubRes, openingsRes, postsRes] = await Promise.all([
        authenticatedFetch(`/clubs/${id}`),
        authenticatedFetch(`/openings?club_id=${id}`),
        authenticatedFetch(`/clubs/${id}/posts`)
      ]);

      if (clubRes.ok) {
        setClub(await clubRes.json());
      }
      if (openingsRes.ok) {
        setOpenings(await openingsRes.json());
      }
      if (postsRes.ok) {
        setPosts(await postsRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch club data', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!club) return;
    const method = club.is_following ? 'DELETE' : 'POST';
    try {
      const res = await authenticatedFetch(`/clubs/${id}/follow`, { method });
      if (res.ok) {
        setClub({ ...club, is_following: !club.is_following });
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
    }
  };

  if (loading) return <div className="p-4">Loading club...</div>;
  if (!club) return <div className="p-4">Club not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{club.name}</h1>
            {club.website_url && (
              <a href={club.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {club.website_url}
              </a>
            )}
          </div>
          <Button variant={club.is_following ? 'outline' : 'primary'} onClick={toggleFollow}>
            {club.is_following ? 'Unfollow' : 'Follow'}
          </Button>
        </div>
        <p className="mt-4 text-gray-700 whitespace-pre-wrap">{club.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Latest Updates</h2>
          {posts.length > 0 ? (
            posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  authenticatedFetch={authenticatedFetch}
                  onLike={() => {}}
                  onCommentAdded={() => {}}
                />
            ))
          ) : (
            <div className="bg-white p-4 rounded shadow border border-gray-200 text-center text-gray-500">
              No posts yet.
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Openings</h2>
          {openings.length > 0 ? (
            openings.map(opening => (
              <div key={opening.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
                <h3 className="font-bold text-lg">{opening.title}</h3>
                <p className="text-sm text-gray-600">{opening.job_type} • {opening.experience_level}</p>
                <p className="text-sm text-gray-500">{opening.location_city}, {opening.location_country}</p>
                <Button variant="ghost" size="sm" className="mt-2 w-full">Apply Now</Button>
              </div>
            ))
          ) : (
            <div className="bg-white p-4 rounded shadow border border-gray-200 text-center text-gray-500">
              No active openings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
