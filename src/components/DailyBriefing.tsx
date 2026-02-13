import { useState } from 'react';
import {
  CheckCircle2,
  Zap,
  Lightbulb,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
  ListChecks,
  CalendarDays,
} from 'lucide-react';

interface ActionItem {
  text: string;
  owner: string;
  status: 'pending' | 'done' | 'waiting';
}

interface DayLog {
  date: string;
  summary: string;
  highlights: string[];
  decisions: string[];
  ideas: string[];
  actionItems: ActionItem[];
  projects_touched: string[];
  mood: string;
}

interface DailyBriefingProps {
  days: DayLog[];
}

const moodConfig: Record<string, { emoji: string; color: string; label: string }> = {
  productive: { emoji: '🟢', color: '#00ff88', label: 'Productive' },
  steady: { emoji: '🔵', color: '#00d4ff', label: 'Steady' },
  energized: { emoji: '⚡', color: '#f59e0b', label: 'Energized' },
  challenging: { emoji: '🟡', color: '#eab308', label: 'Challenging' },
};

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', label: 'Pending' },
  done: { color: '#00ff88', bg: 'rgba(0,255,136,0.15)', border: 'rgba(0,255,136,0.3)', label: 'Done' },
  waiting: { color: '#00d4ff', bg: 'rgba(0,212,255,0.15)', border: 'rgba(0,212,255,0.3)', label: 'Waiting' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

function DayCard({ day, isExpanded, onToggle, isLatest }: { day: DayLog; isExpanded: boolean; onToggle: () => void; isLatest: boolean }) {
  const mood = moodConfig[day.mood] || moodConfig.steady;
  const todayFlag = isToday(day.date);
  const doneCount = day.actionItems.filter(a => a.status === 'done').length;
  const totalActions = day.actionItems.length;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isLatest
          ? 'border-[#ff6600]/30 shadow-[0_0_24px_rgba(255,102,0,0.12)]'
          : 'border-white/5'
      } bg-dark-800`}
    >
      {/* Header — always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg" title={mood.label}>{mood.emoji}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate">
                {formatDate(day.date)}
              </span>
              {todayFlag && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/25">
                  Today
                </span>
              )}
            </div>
            {!isExpanded && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{day.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          {totalActions > 0 && (
            <span className="text-[11px] text-gray-500 hidden sm:inline">
              {doneCount}/{totalActions} done
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-5">
          {/* Summary hero */}
          <div className="rounded-xl p-4 bg-dark-700 border border-white/5">
            <p className="text-sm text-gray-300 leading-relaxed">{day.summary}</p>
          </div>

          {/* Highlights */}
          {day.highlights.length > 0 && (
            <Section title="Highlights" icon={<CheckCircle2 className="w-4 h-4 text-neon-green" />}>
              <ul className="space-y-2">
                {day.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Decisions */}
          {day.decisions.length > 0 && (
            <Section title="Decisions Made" icon={<Zap className="w-4 h-4 text-yellow-400" />}>
              <ul className="space-y-2">
                {day.decisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Ideas */}
          {day.ideas.length > 0 && (
            <Section title="Ideas Discussed" icon={<Lightbulb className="w-4 h-4 text-neon-purple" />}>
              <ul className="space-y-2">
                {day.ideas.map((idea, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Lightbulb className="w-4 h-4 text-neon-purple mt-0.5 flex-shrink-0" />
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Action Items */}
          {day.actionItems.length > 0 && (
            <Section title="Action Items" icon={<ListChecks className="w-4 h-4 text-[#ff6600]" />}>
              <div className="space-y-2">
                {day.actionItems.map((item, i) => {
                  const status = statusConfig[item.status] || statusConfig.pending;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 bg-dark-700 border border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: status.color }} />
                        ) : item.status === 'waiting' ? (
                          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: status.color }} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: status.color }} />
                        )}
                        <span className={`text-sm ${item.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                          {item.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-gray-500 font-medium">{item.owner}</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            color: status.color,
                            backgroundColor: status.bg,
                            borderColor: status.border,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Projects Touched */}
          {day.projects_touched.length > 0 && (
            <Section title="Projects Touched" icon={<Tag className="w-4 h-4 text-neon-cyan" />}>
              <div className="flex flex-wrap gap-2">
                {day.projects_touched.map((p) => (
                  <span
                    key={p}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function DailyBriefing({ days }: DailyBriefingProps) {
  // Sort by date descending
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
  const [expandedIndex, setExpandedIndex] = useState<number>(0); // latest expanded by default

  const toggleDay = (index: number) => {
    setExpandedIndex(prev => (prev === index ? -1 : index));
  };

  // Stats
  const totalActions = sorted.reduce((sum, d) => sum + d.actionItems.length, 0);
  const doneActions = sorted.reduce((sum, d) => sum + d.actionItems.filter(a => a.status === 'done').length, 0);
  const pendingActions = sorted.reduce((sum, d) => sum + d.actionItems.filter(a => a.status === 'pending').length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff6600]/10 flex items-center justify-center border border-[#ff6600]/20">
            <CalendarDays className="w-5 h-5 text-[#ff6600]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Daily Briefing</h2>
            <p className="text-xs text-gray-500">{sorted.length} day{sorted.length !== 1 ? 's' : ''} logged</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#ff6600]">{sorted.length}</div>
          <div className="text-[11px] text-gray-400 mt-1">Days Logged</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">{doneActions}/{totalActions}</div>
          <div className="text-[11px] text-gray-400 mt-1">Actions Done</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{pendingActions}</div>
          <div className="text-[11px] text-gray-400 mt-1">Pending</div>
        </div>
      </div>

      {/* Day selector strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {sorted.map((day, i) => {
          const mood = moodConfig[day.mood] || moodConfig.steady;
          const active = expandedIndex === i;
          return (
            <button
              key={day.date}
              onClick={() => toggleDay(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                active
                  ? 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/25'
                  : 'bg-dark-700 text-gray-400 border-white/5 hover:bg-dark-600 hover:text-gray-300'
              }`}
            >
              <span className="mr-1.5">{mood.emoji}</span>
              {formatShortDate(day.date)}
            </button>
          );
        })}
      </div>

      {/* Day cards */}
      <div className="space-y-3">
        {sorted.map((day, i) => (
          <DayCard
            key={day.date}
            day={day}
            isExpanded={expandedIndex === i}
            onToggle={() => toggleDay(i)}
            isLatest={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
