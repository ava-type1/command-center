import { useState, useEffect } from 'react';
import { ContentQueue } from './social/ContentQueue';
import { RecentPosts } from './social/RecentPosts';
import { TopPerforming } from './social/TopPerforming';
import { NeedsReply } from './social/NeedsReply';
import { ContentIdeas } from './social/ContentIdeas';
import { CalendarView } from './social/CalendarView';
import { Calendar, Clock, TrendingUp, MessageCircle, Lightbulb, BarChart3 } from 'lucide-react';
import type { SocialPost, SocialIdea } from '../types';

const GITHUB_BASE = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data';
const SOCIAL_QUEUE_URL = `${GITHUB_BASE}/social-queue.json`;
const SOCIAL_IDEAS_URL = `${GITHUB_BASE}/social-ideas.json`;

export function SocialMedia() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [ideas, setIdeas] = useState<SocialIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'recent' | 'top' | 'replies' | 'ideas' | 'calendar'>('queue');

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, ideasRes] = await Promise.all([
        fetch(SOCIAL_QUEUE_URL + '?t=' + Date.now()),
        fetch(SOCIAL_IDEAS_URL + '?t=' + Date.now()),
      ]);

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
        localStorage.setItem('kam-social-posts', JSON.stringify(postsData.posts));
      } else {
        const cached = localStorage.getItem('kam-social-posts');
        if (cached) setPosts(JSON.parse(cached));
      }

      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setIdeas(ideasData.ideas || []);
        localStorage.setItem('kam-social-ideas', JSON.stringify(ideasData.ideas));
      } else {
        const cached = localStorage.getItem('kam-social-ideas');
        if (cached) setIdeas(JSON.parse(cached));
      }
    } catch (err) {
      console.warn('Failed to load social media data:', err);
      const cachedPosts = localStorage.getItem('kam-social-posts');
      const cachedIdeas = localStorage.getItem('kam-social-ideas');
      if (cachedPosts) setPosts(JSON.parse(cachedPosts));
      if (cachedIdeas) setIdeas(JSON.parse(cachedIdeas));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const draftPosts = posts.filter(p => p.status === 'draft');
  const approvedPosts = posts.filter(p => p.status === 'approved');
  const postedPosts = posts.filter(p => p.status === 'posted');
  const needsReplyPosts = posts.filter(p => p.status === 'posted' && p.performance && (p.performance.comments || 0) > 0);

  const tabs = [
    { id: 'queue' as const, label: 'Queue', icon: Clock, count: draftPosts.length + approvedPosts.length },
    { id: 'recent' as const, label: 'Recent', icon: BarChart3, count: postedPosts.length },
    { id: 'top' as const, label: 'Top', icon: TrendingUp, count: postedPosts.filter(p => p.performance).length },
    { id: 'replies' as const, label: 'Replies', icon: MessageCircle, count: needsReplyPosts.length },
    { id: 'ideas' as const, label: 'Ideas', icon: Lightbulb, count: ideas.length },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading social media data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Social Media</h2>
          <p className="text-gray-400">Manage your social presence for AVA Type 1</p>
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{draftPosts.length}</div>
          <div className="text-sm text-gray-400">Drafts</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-neon-cyan">{approvedPosts.length}</div>
          <div className="text-sm text-gray-400">Approved</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">{postedPosts.length}</div>
          <div className="text-sm text-gray-400">Posted</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{needsReplyPosts.length}</div>
          <div className="text-sm text-gray-400">Need Reply</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="glass rounded-xl p-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-dark-500 text-neon-green shadow-neon-green/20 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-600 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-96">
        {activeTab === 'queue' && <ContentQueue posts={posts} onUpdate={setPosts} />}
        {activeTab === 'recent' && <RecentPosts posts={postedPosts} />}
        {activeTab === 'top' && <TopPerforming posts={postedPosts.filter(p => p.performance)} />}
        {activeTab === 'replies' && <NeedsReply posts={needsReplyPosts} />}
        {activeTab === 'ideas' && <ContentIdeas ideas={ideas} onUpdate={setIdeas} />}
        {activeTab === 'calendar' && <CalendarView posts={posts} />}
      </div>
    </div>
  );
}