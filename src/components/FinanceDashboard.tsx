import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, CreditCard, RefreshCw, ArrowDownCircle, ArrowUpCircle, Repeat, ShoppingBag, Loader2 } from 'lucide-react';

const GITHUB_BASE = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data';
const FINANCE_URL = `${GITHUB_BASE}/finance.json`;

interface Category {
  name: string;
  total: number;
  count: number;
}

interface Store {
  name: string;
  total: number;
  count: number;
}

interface RecurringCharge {
  name: string;
  amount: number;
  count: number;
  lastDate: string;
}

interface Transaction {
  date: string;
  description: string;
  payee: string;
  amount: number;
  category: string;
}

interface FinanceData {
  lastUpdated: string;
  account: {
    name: string;
    balance: number;
    available: number;
  };
  categories: Category[];
  topStores: Store[];
  recurring: RecurringCharge[];
  monthlyMinimum: number;
  totalSpending: number;
  recentTransactions: Transaction[];
  period: {
    start: string;
    end: string;
  };
}

const categoryColors: Record<string, string> = {
  'Gas/Fuel': '#f97316',
  'Groceries': '#22c55e',
  'Food/Dining': '#eab308',
  'Subscriptions/Recurring': '#8b5cf6',
  'ATM/Cash': '#06b6d4',
  'Bank Fees': '#ef4444',
  'Shopping': '#ec4899',
  'Other': '#6b7280',
};

const categoryEmojis: Record<string, string> = {
  'Gas/Fuel': '⛽',
  'Groceries': '🛒',
  'Food/Dining': '🍔',
  'Subscriptions/Recurring': '🔄',
  'ATM/Cash': '💵',
  'Bank Fees': '🏦',
  'Shopping': '🛍️',
  'Other': '📦',
};

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

  const maxCategoryTotal = Math.max(...data.categories.map(c => c.total));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-neon-cyan" />
            Finance
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {data.account.name} · {data.period.start} to {data.period.end}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3" />
          Updated {new Date(data.lastUpdated).toLocaleDateString()}
          <button onClick={loadData} className="ml-2 px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 transition-colors text-gray-400">
            Refresh
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <CreditCard className="w-4 h-4" />
            Current Balance
          </div>
          <div className="text-3xl font-bold text-white">
            ${data.account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <ArrowUpCircle className="w-4 h-4 text-neon-green" />
            Available
          </div>
          <div className="text-3xl font-bold text-neon-green">
            ${data.account.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            Total Spent (30d)
          </div>
          <div className="text-3xl font-bold text-red-400">
            ${data.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <ArrowDownCircle className="w-4 h-4 text-yellow-400" />
            Monthly Min. Needed
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            ${data.monthlyMinimum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neon-cyan" />
            Spending by Category
          </h3>
          <div className="space-y-4">
            {data.categories.map(cat => {
              const pct = (cat.total / maxCategoryTotal) * 100;
              const color = categoryColors[cat.name] || '#6b7280';
              const emoji = categoryEmojis[cat.name] || '📦';
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <span>{emoji}</span>
                      {cat.name}
                      <span className="text-xs text-gray-500">({cat.count})</span>
                    </span>
                    <span className="text-sm font-semibold" style={{ color }}>
                      ${cat.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}40`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Stores */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neon-purple" />
            Top Stores
          </h3>
          <div className="space-y-3">
            {data.topStores.slice(0, 10).map((store, i) => (
              <div
                key={store.name}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-5 text-right font-mono">
                    {i + 1}.
                  </span>
                  <span className="text-sm text-gray-300">{store.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-white">
                    ${store.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({store.count}x)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Charges */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-neon-green" />
            Recurring Charges
          </h3>
          {data.recurring.length === 0 ? (
            <p className="text-gray-500 text-sm">No recurring charges detected</p>
          ) : (
            <div className="space-y-3">
              {data.recurring.map(item => (
                <div
                  key={item.name}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-dark-600/30 border border-white/5"
                >
                  <div>
                    <span className="text-sm text-gray-200">{item.name}</span>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Last: {item.lastDate} · {item.count}x this period
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neon-green">
                    ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neon-cyan" />
            Recent Transactions
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {data.recentTransactions.slice(0, 20).map((txn, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{txn.payee}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{txn.date}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-dark-500">
                      {txn.category}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-mono font-semibold ml-3 ${
                    txn.amount < 0 ? 'text-red-400' : 'text-neon-green'
                  }`}
                >
                  {txn.amount < 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
