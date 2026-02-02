import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

interface ActivityEntry {
  time: string;
  description: string;
  category: string;
}

interface ActivityDay {
  date: string;
  entries: ActivityEntry[];
}

const ACTIVITY_URL = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data/activity-log.json';

const CATEGORY_COLORS: Record<string, string> = {
  development: 'text-neon-green bg-neon-green/10 border-neon-green/30',
  feature: 'text-neon-green bg-neon-green/10 border-neon-green/30',
  bugfix: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  milestone: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30',
  setup: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30',
  infrastructure: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30',
  planning: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  research: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  design: 'text-neon-pink bg-neon-pink/10 border-neon-pink/30',
  marketing: 'text-neon-pink bg-neon-pink/10 border-neon-pink/30',
  social: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  decision: 'text-gray-300 bg-gray-300/10 border-gray-300/30',
  automation: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30',
  idea: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30',
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  development: 'bg-neon-green',
  feature: 'bg-neon-green',
  bugfix: 'bg-yellow-400',
  milestone: 'bg-neon-cyan',
  setup: 'bg-neon-purple',
  infrastructure: 'bg-neon-purple',
  planning: 'bg-blue-400',
  research: 'bg-blue-400',
  design: 'bg-neon-pink',
  marketing: 'bg-neon-pink',
  social: 'bg-orange-400',
  decision: 'bg-gray-300',
  automation: 'bg-neon-cyan',
  idea: 'bg-neon-purple',
};

export function ActivityCalendar() {
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(ACTIVITY_URL + '?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          setActivityData(data);
          localStorage.setItem('kam-activity-log', JSON.stringify(data));
        } else {
          throw new Error('fetch failed');
        }
      } catch {
        const cached = localStorage.getItem('kam-activity-log');
        if (cached) setActivityData(JSON.parse(cached));
      }
    };
    load();
  }, []);

  const activityMap = new Map(activityData.map(d => [d.date, d]));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Gather unique categories across all data for legend
  const allCategories = [...new Set(activityData.flatMap(d => d.entries.map(e => e.category)))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-6 h-6 text-neon-cyan" />
            Activity Calendar
          </h2>
          <p className="text-sm text-gray-500 mt-1">Click a day to see what was worked on</p>
        </div>
        <div className="text-sm text-gray-500">
          {activityData.length} days logged
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {allCategories.map(cat => (
          <span key={cat} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT_COLORS[cat] || 'bg-gray-500'}`} />
            {cat}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-dark-500 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-white">{monthName}</h3>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-dark-500 text-gray-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs text-gray-500 font-medium py-2">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = getDateStr(day);
              const activity = activityMap.get(dateStr);
              const isSelected = selectedDay?.date === dateStr;
              const hasActivity = !!activity;

              // Get unique category dots for this day
              const dayCats = hasActivity
                ? [...new Set(activity.entries.map(e => e.category))]
                : [];

              return (
                <button
                  key={day}
                  onClick={() => activity && setSelectedDay(activity)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                    isSelected
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan shadow-neon-cyan'
                      : hasActivity
                      ? 'bg-dark-600 hover:bg-dark-500 text-white cursor-pointer border border-white/5 hover:border-neon-green/30'
                      : 'text-gray-600 cursor-default'
                  }`}
                >
                  <span className="font-medium">{day}</span>
                  {hasActivity && (
                    <div className="flex gap-0.5 mt-1">
                      {dayCats.slice(0, 4).map((cat, ci) => (
                        <span key={ci} className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT_COLORS[cat] || 'bg-gray-500'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="lg:col-span-1">
          {selectedDay ? (
            <div className="glass rounded-xl p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 rounded hover:bg-dark-500 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-gray-500 mb-4">{selectedDay.entries.length} activities</div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {selectedDay.entries.map((entry, i) => (
                  <div key={i} className="p-3 bg-dark-700/50 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{entry.time}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[entry.category] || 'text-gray-400 bg-gray-400/10 border-gray-400/30'}`}>
                        {entry.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Select a highlighted day to see activity details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
