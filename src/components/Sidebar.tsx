import { LayoutDashboard, Lightbulb, DollarSign, PenTool, Calendar, Zap, Target, Mic, Newspaper, BookOpen, MessageSquare } from 'lucide-react';

export type View = 'dashboard' | 'news' | 'finance' | 'content' | 'ideas' | 'briefing' | 'prospects' | 'voice' | 'notes' | 'ava-feedback';

interface AppNavigationProps {
  view: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', short: 'Home', icon: LayoutDashboard },
  { id: 'ideas', label: 'Ideas', short: 'Ideas', icon: Lightbulb },
  { id: 'news', label: 'News', short: 'News', icon: Newspaper },
  { id: 'briefing', label: 'Daily Briefing', short: 'Brief', icon: Calendar },
  { id: 'notes', label: 'Notes', short: 'Notes', icon: BookOpen },
  { id: 'prospects', label: 'Prospects', short: 'Leads', icon: Target },
  { id: 'content', label: 'Content', short: 'Media', icon: PenTool },
  { id: 'finance', label: 'Finance', short: 'Cash', icon: DollarSign },
  { id: 'voice', label: 'Voice', short: 'Voice', icon: Mic },
  { id: 'ava-feedback', label: 'AVA Feedback', short: 'AVA', icon: MessageSquare },
];

export function AppNavigation({ view, onViewChange }: AppNavigationProps) {
  return (
    <>
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-72 border-r border-white/10 bg-[#0b1220]/95 backdrop-blur-xl z-40">
        <div className="w-full p-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400/25 via-emerald-300/20 to-indigo-400/20 flex items-center justify-center border border-white/15">
                <Zap className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-tight">Command Center</p>
                <p className="text-xs text-slate-400">Redesign V2</p>
              </div>
            </div>
          </div>

          <nav className="overflow-y-auto pr-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm border transition ${
                    active
                      ? 'bg-cyan-400/10 border-cyan-300/30 text-cyan-200'
                      : 'border-transparent text-slate-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#0b1220]/95 backdrop-blur-xl">
        <div className="grid grid-cols-5">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-1 py-2.5 flex flex-col items-center justify-center gap-1 text-[11px] ${
                  active ? 'text-cyan-200' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span>{item.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
