import { Lightbulb, Plus, Clock, Target, Edit, Trash2 } from 'lucide-react';
import type { SocialIdea } from '../../types';

interface ContentIdeasProps {
  ideas: SocialIdea[];
  onUpdate: (ideas: SocialIdea[]) => void;
}

export function ContentIdeas({ ideas, onUpdate }: ContentIdeasProps) {
  const getPriorityColor = (priority: SocialIdea['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-400/20 text-red-400 border-red-400/30';
      case 'medium': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 'low': return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    }
  };

  const getPriorityIcon = (priority: SocialIdea['priority']) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '⚪';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'x': return '𝕏';
      case 'tiktok': return '🎵';
      case 'both': return '📱';
      default: return '📝';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'education': 'bg-blue-400/20 text-blue-400',
      'lifestyle': 'bg-green-400/20 text-green-400',
      'product': 'bg-purple-400/20 text-purple-400',
      'community': 'bg-pink-400/20 text-pink-400',
      'practical': 'bg-orange-400/20 text-orange-400',
      'support': 'bg-cyan-400/20 text-cyan-400',
    };
    return colors[category] || 'bg-gray-400/20 text-gray-400';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const sortedIdeas = [...ideas].sort((a, b) => {
    // Sort by priority first (high > medium > low), then by created date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const createNewIdea = () => {
    const newIdea: SocialIdea = {
      id: `si${Date.now()}`,
      title: 'New Content Idea',
      description: 'Add description here...',
      platform: 'both',
      content_type: 'post',
      category: 'education',
      priority: 'medium',
      notes: '',
      suggested_timing: 'weekly',
      created_at: new Date().toISOString(),
    };
    
    onUpdate([...ideas, newIdea]);
  };

  const deleteIdea = (ideaId: string) => {
    const updatedIdeas = ideas.filter(idea => idea.id !== ideaId);
    onUpdate(updatedIdeas);
  };

  const updateIdeaPriority = (ideaId: string, newPriority: SocialIdea['priority']) => {
    const updatedIdeas = ideas.map(idea => 
      idea.id === ideaId ? { ...idea, priority: newPriority } : idea
    );
    onUpdate(updatedIdeas);
  };

  if (ideas.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Lightbulb className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No content ideas yet</h3>
        <p className="text-gray-500 mb-4">Start brainstorming content ideas to keep your social media fresh and engaging.</p>
        <button 
          onClick={createNewIdea}
          className="px-6 py-3 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <Plus className="w-5 h-5" />
          Add First Idea
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-neon-purple" />
          Content Ideas
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {ideas.length} ideas · {ideas.filter(i => i.priority === 'high').length} high priority
          </div>
          <button 
            onClick={createNewIdea}
            className="px-4 py-2 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Idea
          </button>
        </div>
      </div>

      {/* Priority filter tabs */}
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded-lg bg-red-400/20 text-red-400 text-sm">
          High ({ideas.filter(i => i.priority === 'high').length})
        </button>
        <button className="px-3 py-1 rounded-lg bg-yellow-400/20 text-yellow-400 text-sm">
          Medium ({ideas.filter(i => i.priority === 'medium').length})
        </button>
        <button className="px-3 py-1 rounded-lg bg-gray-400/20 text-gray-400 text-sm">
          Low ({ideas.filter(i => i.priority === 'low').length})
        </button>
      </div>

      <div className="grid gap-4">
        {sortedIdeas.map(idea => (
          <div key={idea.id} className="glass rounded-xl p-6 hover:bg-dark-600/50 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(idea.priority)}`}>
                  <span className="mr-1">{getPriorityIcon(idea.priority)}</span>
                  {idea.priority}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPlatformIcon(idea.platform)}</span>
                  <span className="text-sm text-gray-400 capitalize font-mono">
                    {idea.platform}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(idea.category)}`}>
                  {idea.category}
                </div>
                <div className="text-sm text-gray-500">
                  {idea.content_type.replace(/_/g, ' ')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 rounded-lg hover:bg-dark-500 transition-colors text-gray-400 hover:text-white"
                  title="Edit idea"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteIdea(idea.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                  title="Delete idea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <h4 className="text-white font-medium mb-2">{idea.title}</h4>
              <p className="text-gray-300 leading-relaxed mb-3">
                {idea.description}
              </p>
              
              {idea.notes && (
                <div className="bg-dark-700/50 rounded-lg p-3">
                  <p className="text-sm text-gray-400">
                    <span className="text-neon-cyan">💡 Notes:</span> {idea.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{idea.suggested_timing}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Created {formatDate(idea.created_at)}</span>
                </div>
              </div>

              {/* Priority controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Priority:</span>
                <button
                  onClick={() => updateIdeaPriority(idea.id, 'low')}
                  className={`w-6 h-6 rounded-full border-2 transition-colors ${
                    idea.priority === 'low' ? 'border-gray-400 bg-gray-400' : 'border-gray-600 hover:border-gray-400'
                  }`}
                  title="Low priority"
                />
                <button
                  onClick={() => updateIdeaPriority(idea.id, 'medium')}
                  className={`w-6 h-6 rounded-full border-2 transition-colors ${
                    idea.priority === 'medium' ? 'border-yellow-400 bg-yellow-400' : 'border-gray-600 hover:border-yellow-400'
                  }`}
                  title="Medium priority"
                />
                <button
                  onClick={() => updateIdeaPriority(idea.id, 'high')}
                  className={`w-6 h-6 rounded-full border-2 transition-colors ${
                    idea.priority === 'high' ? 'border-red-400 bg-red-400' : 'border-gray-600 hover:border-red-400'
                  }`}
                  title="High priority"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}