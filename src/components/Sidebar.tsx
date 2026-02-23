import { LayoutDashboard, Lightbulb, DollarSign, PenTool, Calendar, X, Zap, Target, Mic, Newspaper, BookOpen, MessageSquare } from 'lucide-react';

export type View = 'dashboard' | 'news' | 'finance' | 'content' | 'ideas' | 'briefing' | 'prospects' | 'voice' | 'notes' | 'ava-feedback';

interface SidebarProps {
  view: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: View; label: string; icon: typeof LayoutDashboard; activeColor: string; activeBg: string; activeBorder: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, activeColor: '#00ff88', activeBg: 'rgba(0,255,136,0.1)', activeBorder: 'rgba(0,255,136,0.2)' },
  { id: 'news', label: 'News', icon: Newspaper, activeColor: '#00d4ff', activeBg: 'rgba(0,212,255,0.1)', activeBorder: 'rgba(0,212,255,0.2)' },
  { id: 'finance', label: 'Finance', icon: DollarSign, activeColor: '#00d4ff', activeBg: 'rgba(0,212,255,0.1)', activeBorder: 'rgba(0,212,255,0.2)' },
  { id: 'content', label: 'Content', icon: PenTool, activeColor: '#ff0080', activeBg: 'rgba(255,0,128,0.1)', activeBorder: 'rgba(255,0,128,0.2)' },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb, activeColor: '#bf00ff', activeBg: 'rgba(191,0,255,0.1)', activeBorder: 'rgba(191,0,255,0.2)' },
  { id: 'prospects', label: 'Prospects', icon: Target, activeColor: '#ff3366', activeBg: 'rgba(255,51,102,0.1)', activeBorder: 'rgba(255,51,102,0.2)' },
  { id: 'briefing', label: 'Daily Briefing', icon: Calendar, activeColor: '#ff6600', activeBg: 'rgba(255,102,0,0.1)', activeBorder: 'rgba(255,102,0,0.2)' },
  { id: 'voice', label: 'Voice', icon: Mic, activeColor: '#ff6347', activeBg: 'rgba(255,99,71,0.1)', activeBorder: 'rgba(255,99,71,0.2)' },
  { id: 'notes', label: 'Notes', icon: BookOpen, activeColor: '#00d4ff', activeBg: 'rgba(0,212,255,0.1)', activeBorder: 'rgba(0,212,255,0.2)' },
  { id: 'ava-feedback', label: 'AVA Feedback', icon: MessageSquare, activeColor: '#00ff88', activeBg: 'rgba(0,255,136,0.1)', activeBorder: 'rgba(0,255,136,0.2)' },
];

export function Sidebar({ view, onViewChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-64 bg-dark-800 border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center border border-neon-green/30">
              <Zap className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Command Center</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">KameronMartinLLC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'border shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                style={isActive ? {
                  backgroundColor: item.activeBg,
                  color: item.activeColor,
                  borderColor: item.activeBorder,
                  boxShadow: `0 4px 12px ${item.activeBg}`,
                } : undefined}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="text-xs text-gray-600 text-center">
            Command Center v2.1
          </div>
        </div>
      </aside>
    </>
  );
}
