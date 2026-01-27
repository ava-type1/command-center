import { LayoutDashboard, Lightbulb, Zap, Newspaper } from 'lucide-react';

interface HeaderProps {
  view: 'dashboard' | 'ideas' | 'news';
  onViewChange: (view: 'dashboard' | 'ideas' | 'news') => void;
}

export function Header({ view, onViewChange }: HeaderProps) {
  return (
    <header className="glass border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center border border-neon-green/30">
              <Zap className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Command Center</h1>
              <p className="text-xs text-gray-500">KameronMartinLLC</p>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex gap-1 bg-dark-700/50 rounded-lg p-1">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                view === 'dashboard'
                  ? 'bg-dark-500 text-neon-green shadow-neon-green/20 shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </button>
            <button
              onClick={() => onViewChange('news')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                view === 'news'
                  ? 'bg-dark-500 text-neon-cyan shadow-neon-cyan/20 shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">News</span>
            </button>
            <button
              onClick={() => onViewChange('ideas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                view === 'ideas'
                  ? 'bg-dark-500 text-neon-purple shadow-neon-purple/20 shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Ideas</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
