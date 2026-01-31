import { MessageCircle, Clock, AlertCircle, CheckCircle2, User } from 'lucide-react';
import type { SocialPost } from '../../types';

interface NeedsReplyProps {
  posts: SocialPost[];
}

export function NeedsReply({ posts }: NeedsReplyProps) {
  // Filter posts that need replies (have comments)
  const postsNeedingReply = posts.filter(post => 
    post.performance && post.performance.comments && post.performance.comments > 0
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
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUrgencyColor = (dateStr: string, comments: number) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    // High priority: many comments or old post
    if (comments >= 10 || diffHours >= 48) return 'border-red-400 bg-red-400/10';
    if (comments >= 5 || diffHours >= 24) return 'border-yellow-400 bg-yellow-400/10';
    return 'border-neon-cyan bg-neon-cyan/10';
  };

  const getUrgencyIcon = (dateStr: string, comments: number) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (comments >= 10 || diffHours >= 48) return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (comments >= 5 || diffHours >= 24) return <Clock className="w-4 h-4 text-yellow-400" />;
    return <MessageCircle className="w-4 h-4 text-neon-cyan" />;
  };

  // Mock reply suggestions - in a real app, these might come from AI or be user-configured
  const getSuggestedReplies = (post: SocialPost) => {
    const suggestions = [];
    
    if (post.content.toLowerCase().includes('diabetes') || post.hashtags.some(tag => tag.toLowerCase().includes('t1d'))) {
      suggestions.push("Thanks for sharing! The T1D community is so supportive. 💙");
      suggestions.push("Great point! Every T1D journey is unique but we're in this together.");
    }
    
    if (post.content.toLowerCase().includes('ava')) {
      suggestions.push("So glad AVA is making a difference! Would love to hear more about your experience.");
      suggestions.push("Thank you for trying AVA! Your feedback helps us make it even better.");
    }
    
    // Default suggestions
    suggestions.push("Thank you for the engagement! 🙏");
    suggestions.push("Really appreciate this comment!");
    
    return suggestions.slice(0, 2); // Return max 2 suggestions
  };

  if (postsNeedingReply.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-neon-green mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">All caught up!</h3>
        <p className="text-gray-500">No posts currently need replies. Great job staying engaged!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-red-400" />
          Needs Reply
        </h3>
        <div className="text-sm text-gray-400">
          {postsNeedingReply.length} posts with {postsNeedingReply.reduce((sum, p) => sum + (p.performance?.comments || 0), 0)} total comments
        </div>
      </div>

      <div className="grid gap-4">
        {postsNeedingReply.map(post => {
          const commentCount = post.performance?.comments || 0;
          const urgencyColor = getUrgencyColor(post.suggested_date, commentCount);
          const urgencyIcon = getUrgencyIcon(post.suggested_date, commentCount);
          const suggestedReplies = getSuggestedReplies(post);

          return (
            <div key={post.id} className={`glass rounded-xl p-6 border-2 ${urgencyColor}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {urgencyIcon}
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
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-400/20 text-red-400 border border-red-400/30">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-xs font-medium">{commentCount} comments</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  {formatDate(post.suggested_date)}
                </div>
              </div>

              {/* Original post content */}
              <div className="mb-4">
                <p className="text-gray-200 leading-relaxed mb-3">
                  {post.content.length > 120 
                    ? post.content.slice(0, 120) + '...'
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
                  </div>
                )}
              </div>

              {/* Suggested replies */}
              {suggestedReplies.length > 0 && (
                <div className="mb-4 p-4 bg-dark-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Suggested Replies
                  </h4>
                  <div className="space-y-2">
                    {suggestedReplies.map((reply, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <button className="flex-1 text-left p-3 bg-dark-600/50 hover:bg-dark-600 rounded-lg text-sm text-gray-300 transition-colors">
                          {reply}
                        </button>
                        <button className="px-3 py-2 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green rounded-lg text-xs font-medium transition-colors">
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Priority:</span>
                  <span className={
                    commentCount >= 10 ? 'text-red-400 font-medium' :
                    commentCount >= 5 ? 'text-yellow-400 font-medium' :
                    'text-neon-cyan font-medium'
                  }>
                    {commentCount >= 10 ? 'High' : commentCount >= 5 ? 'Medium' : 'Normal'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg text-sm font-medium transition-colors">
                    View on {post.platform === 'x' ? '𝕏' : post.platform}
                  </button>
                  <button className="px-4 py-2 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green rounded-lg text-sm font-medium transition-colors">
                    Mark Replied
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}