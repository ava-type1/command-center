import { TrendingUp, Heart, Eye, MessageCircle, Share2, Trophy } from 'lucide-react';
import type { SocialPost } from '../../types';

interface TopPerformingProps {
  posts: SocialPost[];
}

export function TopPerforming({ posts }: TopPerformingProps) {
  // Calculate engagement score for sorting
  const calculateEngagementScore = (post: SocialPost) => {
    if (!post.performance) return 0;
    const { likes = 0, views = 0, comments = 0, shares = 0 } = post.performance;
    // Weight comments and shares higher than likes and views
    return (likes * 1) + (views * 0.1) + (comments * 5) + (shares * 3);
  };

  const sortedPosts = [...posts]
    .filter(post => post.performance)
    .sort((a, b) => calculateEngagementScore(b) - calculateEngagementScore(a));

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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400'; // Gold
      case 1: return 'text-gray-300';   // Silver
      case 2: return 'text-orange-400'; // Bronze
      default: return 'text-gray-500';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  if (sortedPosts.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No performance data yet</h3>
        <p className="text-gray-500">Post some content and gather engagement to see top performers here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Top Performing
        </h3>
        <div className="text-sm text-gray-400">
          {sortedPosts.length} posts with performance data
        </div>
      </div>

      <div className="grid gap-4">
        {sortedPosts.map((post, index) => (
          <div key={post.id} className={`glass rounded-xl p-6 hover:bg-dark-600/50 transition-colors ${
            index < 3 ? 'ring-1 ring-yellow-400/20' : ''
          }`}>
            {/* Header with rank */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`text-xl font-bold ${getRankColor(index)}`}>
                  {getRankIcon(index)}
                </div>
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
              </div>
              
              <div className="text-sm text-gray-400">
                {formatDate(post.suggested_date)}
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-gray-200 leading-relaxed mb-3">
                {post.content.length > 150 
                  ? post.content.slice(0, 150) + '...'
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

            {/* Performance metrics - highlighted for top performers */}
            {post.performance && (
              <div className="bg-dark-700/50 rounded-lg p-4">
                <div className="flex items-center gap-6 text-sm">
                  {post.performance.likes !== undefined && (
                    <div className={`flex items-center gap-2 ${
                      post.performance.likes > 100 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">{formatNumber(post.performance.likes)}</span>
                    </div>
                  )}
                  {post.performance.views !== undefined && (
                    <div className={`flex items-center gap-2 ${
                      post.performance.views > 1000 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">{formatNumber(post.performance.views)}</span>
                    </div>
                  )}
                  {post.performance.comments !== undefined && (
                    <div className={`flex items-center gap-2 ${
                      post.performance.comments > 10 ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-medium">{formatNumber(post.performance.comments)}</span>
                    </div>
                  )}
                  {post.performance.shares !== undefined && (
                    <div className={`flex items-center gap-2 ${
                      post.performance.shares > 5 ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      <Share2 className="w-4 h-4" />
                      <span className="font-medium">{formatNumber(post.performance.shares)}</span>
                    </div>
                  )}
                </div>
                
                {/* Engagement score */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Engagement Score</span>
                    <span className={`text-sm font-medium ${getRankColor(index)}`}>
                      {Math.round(calculateEngagementScore(post))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}