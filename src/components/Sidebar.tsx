import { LayoutDashboard, Lightbulb, DollarSign, PenTool, Calendar, X, Zap, Target, Mic, Newspaper, BookOpen, MessageSquare } from 'lucide-react';

export type View = 'dashboard' | 'news' | 'finance' | 'content' | 'ideas' | 'briefing' | 'prospects' | 'voice' | 'notes' | 'ava-feedback';

interface SidebarProps {
  view: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'content', label: 'Content', icon: PenTool },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'prospects', label: 'Prospects', icon: Target },
  { id: 'briefing', label: 'Daily Briefing', icon: Calendar },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'ava-feedback', label: 'AVA Feedback', icon: MessageSquare },
];

export function Sidebar({ view, onViewChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 glass ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neon-green/25 via-neon-cyan/20 to-neon-purple/25 flex items-center justify-center border border-white/15 shadow-lg">
              <Zap className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white">Command Center</h1>
              <p className="text-[11px] text-gray-400">KameronMartinLLC</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium border transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border-neon-cyan/40 shadow-[0_10px_24px_rgba(13,22,40,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-neon-cyan' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-400 text-center">Refreshed UI Preview</div>
        </div>
      </aside>
    </>
  );
}
