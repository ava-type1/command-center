import { useState, useEffect } from 'react';
import { ExternalLink, Plus, X, Edit2, Folder, Github, Globe, FileText, Database, Settings } from 'lucide-react';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: 'github' | 'notion' | 'docs' | 'database' | 'settings' | 'globe';
  category?: string;
}

const DEFAULT_LINKS: QuickLink[] = [
  { id: '1', title: 'GitHub - AVA Type 1', url: 'https://github.com/ava-type1', icon: 'github', category: 'Development' },
  { id: '2', title: 'Command Center Repo', url: 'https://github.com/ava-type1/command-center', icon: 'github', category: 'Development' },
  { id: '3', title: 'Notion Workspace', url: 'https://notion.so', icon: 'notion', category: 'Productivity' },
  { id: '4', title: 'Clawdbot Docs', url: 'https://docs.clawd.bot', icon: 'docs', category: 'Reference' },
  { id: '5', title: 'OpenWeather', url: 'https://openweathermap.org', icon: 'globe', category: 'Tools' },
];

const getIconComponent = (icon: string) => {
  switch (icon) {
    case 'github': return Github;
    case 'notion': return Database;
    case 'docs': return FileText;
    case 'database': return Database;
    case 'settings': return Settings;
    default: return Globe;
  }
};

const iconOptions = [
  { value: 'globe', label: 'Website', Icon: Globe },
  { value: 'github', label: 'GitHub', Icon: Github },
  { value: 'notion', label: 'Notion', Icon: Database },
  { value: 'docs', label: 'Docs', Icon: FileText },
  { value: 'database', label: 'Database', Icon: Database },
  { value: 'settings', label: 'Settings', Icon: Settings },
];

export function LinksPanel() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: 'globe' as const, category: '' });

  useEffect(() => {
    const saved = localStorage.getItem('kam-quick-links');
    if (saved) {
      setLinks(JSON.parse(saved));
    } else {
      setLinks(DEFAULT_LINKS);
      localStorage.setItem('kam-quick-links', JSON.stringify(DEFAULT_LINKS));
    }
  }, []);

  const saveLinks = (newLinks: QuickLink[]) => {
    setLinks(newLinks);
    localStorage.setItem('kam-quick-links', JSON.stringify(newLinks));
  };

  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    
    const link: QuickLink = {
      id: Date.now().toString(),
      title: newLink.title,
      url: newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`,
      icon: newLink.icon,
      category: newLink.category || 'General'
    };
    
    saveLinks([...links, link]);
    setNewLink({ title: '', url: '', icon: 'globe', category: '' });
    setShowAddForm(false);
  };

  const removeLink = (id: string) => {
    saveLinks(links.filter(l => l.id !== id));
  };

  // Group by category
  const groupedLinks = links.reduce((acc, link) => {
    const cat = link.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {} as Record<string, QuickLink[]>);

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-neon-purple" />
          <h3 className="font-medium text-white text-sm">Quick Links</h3>
          <span className="text-xs text-gray-500">({links.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1.5 rounded transition-colors ${
              isEditing ? 'bg-neon-purple/20 text-neon-purple' : 'hover:bg-dark-500 text-gray-400'
            }`}
            title="Edit links"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-1.5 hover:bg-dark-500 rounded transition-colors text-gray-400 hover:text-neon-green"
            title="Add link"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="px-4 py-3 bg-dark-600/50 border-b border-white/5 space-y-2">
          <input
            type="text"
            placeholder="Title"
            value={newLink.title}
            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
            className="w-full bg-dark-700 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none"
          />
          <input
            type="text"
            placeholder="URL"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            className="w-full bg-dark-700 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              value={newLink.icon}
              onChange={(e) => setNewLink({ ...newLink, icon: e.target.value as any })}
              className="flex-1 bg-dark-700 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-purple/50 focus:outline-none"
            >
              {iconOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Category"
              value={newLink.category}
              onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
              className="flex-1 bg-dark-700 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addLink}
              className="px-3 py-1.5 text-sm bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30 transition-colors"
            >
              Add Link
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      <div className="p-2 max-h-[300px] overflow-y-auto">
        {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
          <div key={category} className="mb-2 last:mb-0">
            <div className="text-xs text-gray-500 px-2 py-1 font-medium uppercase tracking-wider">
              {category}
            </div>
            <div className="space-y-0.5">
              {categoryLinks.map((link) => {
                const IconComponent = getIconComponent(link.icon);
                return (
                  <div
                    key={link.id}
                    className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dark-500/50 transition-colors"
                  >
                    {isEditing && (
                      <button
                        onClick={() => removeLink(link.id)}
                        className="p-0.5 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <IconComponent className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-gray-300 hover:text-white truncate"
                    >
                      {link.title}
                    </a>
                    <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {links.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No links yet. Click + to add some.
          </div>
        )}
      </div>
    </div>
  );
}
