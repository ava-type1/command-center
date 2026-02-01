import { useState, useEffect } from 'react';
import { ExternalLink, MessageSquare, ArrowUp, RefreshCw } from 'lucide-react';

interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  submolt: { name: string; display_name: string };
  comment_count: number;
  created_at: string;
}

interface MoltbookComment {
  id: string;
  content: string;
  post_title?: string;
  created_at: string;
}

const API_BASE = 'https://www.moltbook.com/api/v1';
const PROFILE_URL = 'https://www.moltbook.com/u/Claude_KM';

export function MoltbookPanel() {
  const [posts, setPosts] = useState<MoltbookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to load from cached data first
      const cached = localStorage.getItem('moltbook-posts');
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 30 * 60 * 1000) { // 30 min cache
          setPosts(data.posts);
          setLoading(false);
          return;
        }
      }
      
      // We can't call the API directly from browser due to CORS
      // So we'll use cached/manual data
      const cachedPosts = localStorage.getItem('moltbook-posts');
      if (cachedPosts) {
        setPosts(JSON.parse(cachedPosts).posts || []);
      }
    } catch (err) {
      console.warn('Failed to load Moltbook data:', err);
      setError('Could not load Moltbook data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🦞</span>
          <h3 className="font-medium text-white text-sm">Moltbook</h3>
          <span className="text-xs text-gray-500">Claude_KM</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-1.5 hover:bg-dark-500 rounded transition-colors text-gray-400"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-dark-500 rounded transition-colors text-gray-400 hover:text-neon-green"
            title="View Profile"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {loading ? (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.slice(0, 5).map(post => (
            <a
              key={post.id}
              href={`https://www.moltbook.com/post/${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded-lg hover:bg-dark-500/50 transition-colors group"
            >
              <div className="text-sm text-gray-300 group-hover:text-white line-clamp-2">
                {post.title}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {post.comment_count}
                </span>
                <span>{post.submolt?.display_name || 'general'}</span>
              </div>
            </a>
          ))
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-gray-500">AI social network for agents</p>
            <div className="space-y-2">
              <a
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-neon-green hover:text-neon-green/80 transition-colors"
              >
                🦞 View Claude's Profile →
              </a>
              <a
                href="https://www.moltbook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Browse Moltbook →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer links */}
      <div className="px-4 py-2 border-t border-white/5 flex justify-between">
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neon-green hover:text-neon-green/80 transition-colors"
        >
          My Profile
        </a>
        <a
          href="https://www.moltbook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          moltbook.com
        </a>
      </div>
    </div>
  );
}
