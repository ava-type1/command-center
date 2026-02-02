import { Calendar, Clock, Trash2, Edit, ExternalLink } from 'lucide-react';
import type { SocialPost } from '../../types';

interface ContentQueueProps {
  posts: SocialPost[];
  onUpdate: (posts: SocialPost[]) => void;
}

export function ContentQueue({ posts, onUpdate }: ContentQueueProps) {
  const queuedPosts = posts.filter(p => p.status === 'draft' || p.status === 'approved');
  
  const getStatusColor = (status: SocialPost['status']) => {
    switch (status) {
      case 'draft': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 'approved': return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30';
      case 'posted': return 'bg-neon-green/20 text-neon-green border-neon-green/30';
      case 'rejected': return 'bg-red-400/20 text-red-400 border-red-400/30';
      default: return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'x': return '𝕏';
      case 'tiktok': return '🎵';
      case 'facebook': return '📘';
      default: return '📱';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'thread': return '🧵';
      case 'reply': return '💬';
      case 'retweet': return '🔁';
      default: return '📝';
    }
  };

  const updatePostStatus = (postId: string, newStatus: SocialPost['status']) => {
    const updatedPosts = posts.map(post => 
      post.id === postId ? { ...post, status: newStatus } : post
    );
    onUpdate(updatedPosts);
  };

  const getPostToXUrl = (post: SocialPost) => {
    const text = post.content + (post.hashtags.length > 0 ? '\n\n' + post.hashtags.join(' ') : '');
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (queuedPosts.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No posts in queue</h3>
        <p className="text-gray-500">All posts have been published or are in another status.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Content Queue</h3>
        <div className="text-sm text-gray-400">
          {queuedPosts.length} posts scheduled
        </div>
      </div>

      <div className="grid gap-4">
        {queuedPosts.map(post => (
          <div key={post.id} className="glass rounded-xl p-6 hover:bg-dark-600/50 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                  <span className="text-sm text-gray-400 uppercase font-mono">
                    {post.platform}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getTypeIcon(post.type)}</span>
                  <span className="text-sm text-gray-400 capitalize">{post.type}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                  {post.status}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 rounded-lg hover:bg-dark-500 transition-colors text-gray-400 hover:text-white"
                  title="Edit post"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-gray-200 leading-relaxed mb-3">
                {post.content}
              </p>
              
              {post.media_notes && (
                <div className="bg-dark-700/50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-400">
                    <span className="text-neon-cyan">📸 Media:</span> {post.media_notes}
                  </p>
                </div>
              )}

              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map(tag => (
                    <span key={tag} className="text-sm text-neon-cyan">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(post.suggested_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(post.created_at)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {post.platform === 'x' && (
                  <a
                    href={getPostToXUrl(post)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>𝕏</span> Post to X <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {post.platform === 'tiktok' && (
                  <button
                    onClick={() => {
                      const text = post.content + (post.hashtags.length > 0 ? '\n\n' + post.hashtags.join(' ') : '');
                      navigator.clipboard.writeText(text);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    🎵 Copy for TikTok
                  </button>
                )}
                {post.status === 'draft' && (
                  <button
                    onClick={() => updatePostStatus(post.id, 'approved')}
                    className="px-4 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg text-sm font-medium transition-colors"
                  >
                    Approve
                  </button>
                )}
                {post.status === 'approved' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updatePostStatus(post.id, 'draft')}
                      className="px-4 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      Back to Draft
                    </button>
                    <button
                      onClick={() => updatePostStatus(post.id, 'posted')}
                      className="px-4 py-2 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark Posted
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}