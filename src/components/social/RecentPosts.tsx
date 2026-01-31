import { Calendar, Heart, Eye, MessageCircle, Share2 } from 'lucide-react';
import type { SocialPost } from '../../types';

interface RecentPostsProps {
  posts: SocialPost[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.suggested_date).getTime() - new Date(a.suggested_date).getTime()
  );

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (sortedPosts.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No recent posts</h3>
        <p className="text-gray-500">Start posting content to see your recent activity here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Recent Posts</h3>
        <div className="text-sm text-gray-400">
          {sortedPosts.length} posts published
        </div>
      </div>

      <div className="grid gap-4">
        {sortedPosts.map(post => (
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
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-neon-green/20 text-neon-green border border-neon-green/30">
                  Posted
                </div>
              </div>
              
              <div className="text-sm text-gray-400">
                {formatDate(post.suggested_date)}
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-gray-200 leading-relaxed mb-3">
                {post.content.length > 200 
                  ? post.content.slice(0, 200) + '...'
                  : post.content
                }
              </p>
              
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-sm text-neon-cyan">
                      {tag}
                    </span>
                  ))}
                  {post.hashtags.length > 3 && (
                    <span className="text-sm text-gray-400">
                      +{post.hashtags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Performance metrics */}
            {post.performance ? (
              <div className="flex items-center gap-6 text-sm">
                {post.performance.likes !== undefined && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(post.performance.likes)}</span>
                  </div>
                )}
                {post.performance.views !== undefined && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(post.performance.views)}</span>
                  </div>
                )}
                {post.performance.comments !== undefined && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(post.performance.comments)}</span>
                  </div>
                )}
                {post.performance.shares !== undefined && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Share2 className="w-4 h-4" />
                    <span>{formatNumber(post.performance.shares)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Performance data not available
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}