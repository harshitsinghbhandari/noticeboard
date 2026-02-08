import { useEffect, useState } from 'react';

type Post = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const API_URL = 'http://localhost:3000/posts';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState('');

  const fetchPosts = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async () => {
    if (!body.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': USER_ID,
        },
        body: JSON.stringify({ body }),
      });

      if (response.ok) {
        setBody('');
        fetchPosts();
      } else {
        console.error('Failed to post');
      }
    } catch (error) {
      console.error('Error posting', error);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Post Board</h1>

      <div className="mb-8">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write something..."
          className="w-full h-24 mb-4 p-3 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Submit Post
        </button>
      </div>

      <hr className="border-gray-200 mb-8" />

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border border-gray-200 p-4 rounded bg-white shadow-sm">
            <p className="text-gray-800 mb-2 whitespace-pre-wrap">{post.body}</p>
            <small className="text-gray-500 text-sm">
              {new Date(post.createdAt).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
