import { useState } from 'react';
import { Newspaper, Cpu, Heart, Sparkles, ExternalLink, Clock, Rocket } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url?: string;
  category: 'ai' | 'diabetes' | 'claude' | 'tools' | 'moonshots';
  source: string;
  date: string;
  relevance?: string;
}

interface NewsFeedProps {
  news: NewsItem[];
  lastUpdated?: string;
}

const categoryConfig = {
  moonshots: { icon: Rocket, label: 'Moonshots / Innermost Loop', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  ai: { icon: Sparkles, label: 'AI News', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  diabetes: { icon: Heart, label: 'Diabetes Tech', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  claude: { icon: Cpu, label: 'Claude/Coding', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  tools: { icon: Sparkles, label: 'Productivity', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
};

export function NewsFeed({ news, lastUpdated }: NewsFeedProps) {
  const [filter, setFilter] = useState<string>('all');
  
  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(item => item.category === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Daily Briefing</h2>
            {lastUpdated && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {new Date(lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === 'all' 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All
        </button>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              filter === key 
                ? config.color + ' border' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <config.icon className="w-3.5 h-3.5" />
            {config.label}
          </button>
        ))}
      </div>

      {/* News Items */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No news items yet.</p>
            <p className="text-sm">Check back after the daily update!</p>
          </div>
        ) : (
          filteredNews.map(item => {
            const config = categoryConfig[item.category];
            return (
              <div 
                key={item.id}
                className="glass rounded-xl p-4 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color} border`}>
                    <config.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-white group-hover:text-neon-green transition-colors">
                        {item.title}
                      </h3>
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-neon-cyan transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{item.summary}</p>
                    {item.relevance && (
                      <p className="text-xs text-neon-green/70 mt-2 italic">
                        💡 {item.relevance}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
