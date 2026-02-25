import { useState, useEffect } from 'react';
import { CalendarDays, Loader2, RefreshCw } from 'lucide-react';

const GITHUB_BASE = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data';
const FINANCE_URL = `${GITHUB_BASE}/finance.json`;

interface BillScheduleItem {
  name: string;
  amount: number;
  dueDay: number;
  autopay?: boolean;
  flexible?: boolean;
  notes?: string;
  category?: string;
}

interface FinanceData {
  lastUpdated: string;
  billSchedule?: BillScheduleItem[];
}

export function FinanceDashboard() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(FINANCE_URL + '?t=' + Date.now());
      if (!res.ok) throw new Error('Failed to fetch finance data');
      const json = await res.json();
      setData(json);
      localStorage.setItem('kam-finance', JSON.stringify(json));
      setError(null);
    } catch {
      const cached = localStorage.getItem('kam-finance');
      if (cached) {
        setData(JSON.parse(cached));
      } else {
        setError('Unable to load finance data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">{error || 'No data available'}</p>
        <button onClick={loadData} className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  const bills = [...(data.billSchedule || [])].sort((a, b) => a.dueDay - b.dueDay);
  const monthlyTotal = bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const weeklyTotals = [
    bills.filter(b => b.dueDay >= 1 && b.dueDay <= 7).reduce((s, b) => s + b.amount, 0),
    bills.filter(b => b.dueDay >= 8 && b.dueDay <= 14).reduce((s, b) => s + b.amount, 0),
    bills.filter(b => b.dueDay >= 15 && b.dueDay <= 21).reduce((s, b) => s + b.amount, 0),
    bills.filter(b => b.dueDay >= 22).reduce((s, b) => s + b.amount, 0),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-neon-cyan" />
            Bills Calendar
          </h2>
          <p className="text-gray-400 text-sm mt-1">Due-date planning and cash flow view</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3" />
          Updated {new Date(data.lastUpdated).toLocaleDateString()}
          <button onClick={loadData} className="ml-2 px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 transition-colors text-gray-400">
            Refresh
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        {bills.length === 0 ? (
          <p className="text-gray-500 text-sm">No bill schedule loaded yet</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
              <div className="rounded-lg bg-dark-600/40 p-3 border border-white/5 col-span-2 lg:col-span-1">
                <div className="text-xs text-gray-400">Monthly Bills Total</div>
                <div className="text-xl font-bold text-neon-green">${monthlyTotal.toFixed(2)}</div>
              </div>
              {weeklyTotals.map((v, i) => (
                <div key={i} className="rounded-lg bg-dark-600/30 p-3 border border-white/5">
                  <div className="text-xs text-gray-400">Week {i + 1}</div>
                  <div className="text-lg font-semibold text-white">${v.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {bills.map((bill, i) => (
                <div key={`${bill.name}-${i}`} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-dark-600/30 border border-white/5">
                  <div>
                    <div className="text-sm text-gray-100">{bill.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Due on day {bill.dueDay}
                      {bill.autopay ? ' · Autopay' : ''}
                      {bill.flexible ? ' · Flexible due' : ''}
                      {bill.notes ? ` · ${bill.notes}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neon-cyan">${bill.amount.toFixed(2)}</div>
                    {bill.category && <div className="text-[10px] text-gray-500">{bill.category}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
