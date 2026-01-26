import { useState } from 'react';
import { Lightbulb, Sparkles, TrendingUp, Wrench, Zap, Plus, Trash2 } from 'lucide-react';
import type { Idea } from '../types';

interface IdeasHubProps {
  ideas: Idea[];
  onUpdate: (ideas: Idea[]) => void;
}

const categoryIcons = {
  saas: Zap,
  product: Sparkles,
  feature: Wrench,
  improvement: TrendingUp,
};

const categoryLabels = {
  saas: 'SaaS Product',
  product: 'Physical Product',
  feature: 'New Feature',
  improvement: 'Improvement',
};

const potentialColors = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#00ff88',
};

const placeholderIdeas: Idea[] = [
  {
    id: '1',
    title: 'CGM Data Aggregator API',
    description: 'A unified API that connects to Dexcom, Libre, and Medtronic CGM systems. Developers could build apps without dealing with each proprietary API. Charge per API call.',
    category: 'saas',
    potential: 'high',
    createdAt: '2026-01-26T00:00:00Z',
    notes: 'Could be the foundation for AvaDrive and other diabetes apps. First-mover advantage in this space.',
  },
  {
    id: '2',
    title: 'Mobile Home Service Marketplace',
    description: 'Like Thumbtack but specifically for manufactured home services - setup crews, leveling, skirting, plumbing. Connect homeowners with vetted contractors.',
    category: 'saas',
    potential: 'high',
    createdAt: '2026-01-26T00:00:00Z',
    notes: 'Natural extension of FieldSync. You already understand the industry pain points.',
  },
  {
    id: '3',
    title: 'Diabetes Camp Simulation Mode',
    description: 'Partner with diabetes camps to use AVA Type 1 as a training tool. Kids practice management in accelerated time before going on real pumps.',
    category: 'feature',
    potential: 'medium',
    createdAt: '2026-01-26T00:00:00Z',
  },
  {
    id: '4',
    title: 'NFC Sticker Packs for AVA',
    description: 'Physical NFC stickers kids can scan to trigger in-game events (eating food, exercise, etc.). Sell as expansion packs. Makes the game tangible.',
    category: 'product',
    potential: 'medium',
    createdAt: '2026-01-26T00:00:00Z',
  },
  {
    id: '5',
    title: 'FieldSync → QuickBooks Integration',
    description: 'Auto-generate invoices from completed walkthroughs. Sync materials costs. Time tracking for hourly billing. Contractors would pay for this.',
    category: 'feature',
    potential: 'high',
    createdAt: '2026-01-26T00:00:00Z',
  },
  {
    id: '6',
    title: 'Warranty Claim Automation',
    description: 'AI reads walkthrough notes and photos, auto-fills manufacturer warranty claim forms. Saves hours per claim. Sell to service companies.',
    category: 'saas',
    potential: 'high',
    createdAt: '2026-01-26T00:00:00Z',
    notes: 'This is a huge pain point you experience directly. Could integrate with FieldSync.',
  },
];

export function IdeasHub({ ideas, onUpdate }: IdeasHubProps) {
  const displayIdeas = ideas.length > 0 ? ideas : placeholderIdeas;
  const [filter, setFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: 'saas' as Idea['category'],
    potential: 'medium' as Idea['potential'],
  });

  const addIdea = () => {
    if (!newIdea.title.trim()) return;
    const idea: Idea = {
      id: Date.now().toString(),
      ...newIdea,
      createdAt: new Date().toISOString(),
    };
    onUpdate([idea, ...displayIdeas]);
    setNewIdea({ title: '', description: '', category: 'saas', potential: 'medium' });
    setShowAdd(false);
  };

  const deleteIdea = (id: string) => {
    onUpdate(displayIdeas.filter(i => i.id !== id));
  };

  const filteredIdeas = filter === 'all' 
    ? displayIdeas 
    : displayIdeas.filter(i => i.category === filter || i.potential === filter);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-neon-purple" />
            Ideas Hub
          </h2>
          <p className="text-gray-400 mt-1">Novel products, SaaS concepts, and feature ideas</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 text-neon-purple rounded-lg hover:bg-neon-purple/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Idea
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'saas', 'product', 'feature', 'improvement', 'high', 'medium'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                : 'bg-dark-600/50 text-gray-400 border border-white/5 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : f === 'high' ? '🔥 High Potential' : f === 'medium' ? '⭐ Medium' : categoryLabels[f as keyof typeof categoryLabels]}
          </button>
        ))}
      </div>

      {/* Ideas grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredIdeas.map(idea => {
          const Icon = categoryIcons[idea.category];
          return (
            <div
              key={idea.id}
              className="glass rounded-2xl p-5 group hover:border-neon-purple/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-purple/10">
                    <Icon className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{idea.title}</h3>
                    <span className="text-xs text-gray-500">{categoryLabels[idea.category]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${potentialColors[idea.potential]}15`,
                      color: potentialColors[idea.potential],
                      border: `1px solid ${potentialColors[idea.potential]}30`,
                    }}
                  >
                    {idea.potential === 'high' ? '🔥 High' : idea.potential === 'medium' ? '⭐ Medium' : 'Low'}
                  </span>
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{idea.description}</p>
              {idea.notes && (
                <div className="text-xs text-neon-cyan/80 bg-neon-cyan/5 px-3 py-2 rounded-lg border border-neon-cyan/10">
                  💡 {idea.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add idea modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Idea</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                className="w-full px-4 py-2 bg-dark-600/50 border border-white/5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/30"
              />
              <textarea
                placeholder="Description"
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-dark-600/50 border border-white/5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/30 resize-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newIdea.category}
                  onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value as Idea['category'] })}
                  className="px-4 py-2 bg-dark-600/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-neon-purple/30"
                >
                  <option value="saas">SaaS Product</option>
                  <option value="product">Physical Product</option>
                  <option value="feature">New Feature</option>
                  <option value="improvement">Improvement</option>
                </select>
                <select
                  value={newIdea.potential}
                  onChange={(e) => setNewIdea({ ...newIdea, potential: e.target.value as Idea['potential'] })}
                  className="px-4 py-2 bg-dark-600/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-neon-purple/30"
                >
                  <option value="high">🔥 High Potential</option>
                  <option value="medium">⭐ Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-2 bg-dark-600/50 text-gray-300 rounded-lg hover:bg-dark-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addIdea}
                disabled={!newIdea.title.trim()}
                className="flex-1 px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Idea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
