import { useState, useEffect } from 'react';
import { ExternalLink, Phone, MapPin, AlertTriangle, CheckCircle, Star, Search } from 'lucide-react';

interface Prospect {
  id: number;
  business: string;
  industry: string;
  address: string;
  phone: string | null;
  owner: string | null;
  currentWebsite: string | null;
  websiteGrade: string;
  issue: string;
  opportunity: string;
  priority: string;
  status: string;
  notes: string;
  source: string;
}

interface ProspectsData {
  lastUpdated: string;
  summary: {
    total: number;
    noWebsite: number;
    terrible: number;
    mediocre: number;
    readyToPitch: number;
  };
  prospects: Prospect[];
}

const GITHUB_BASE = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data';

const gradeColor: Record<string, string> = {
  'F': '#ff3333',
  'D': '#ff6633',
  'D+': '#ff9933',
  'C-': '#ffcc33',
  'C': '#cccc33',
};

export function ProspectsList() {
  const [data, setData] = useState<ProspectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${GITHUB_BASE}/prospects.json?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => {
        const cached = localStorage.getItem('kam-prospects');
        if (cached) setData(JSON.parse(cached));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem('kam-prospects', JSON.stringify(data));
  }, [data]);

  if (loading) return <div className="text-gray-400 text-center py-12">Loading prospects...</div>;
  if (!data) return <div className="text-gray-400 text-center py-12">No prospect data found.</div>;

  const industries = [...new Set(data.prospects.map(p => p.industry))];
  
  const filtered = data.prospects.filter(p => {
    if (filter !== 'all' && p.industry !== filter) return false;
    if (search && !p.business.toLowerCase().includes(search.toLowerCase()) && 
        !p.industry.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort: F grades first, then by priority
  const sorted = [...filtered].sort((a, b) => {
    const gradeOrder: Record<string, number> = { 'F': 0, 'D': 1, 'D+': 2, 'C-': 3, 'C': 4 };
    return (gradeOrder[a.websiteGrade] ?? 5) - (gradeOrder[b.websiteGrade] ?? 5);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Website Prospects</h2>
          <p className="text-sm text-gray-400 mt-1">Local businesses ready for a website upgrade · Updated {data.lastUpdated}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{data.summary.noWebsite}</div>
          <div className="text-sm text-gray-400 mt-1">No Website</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">{data.summary.terrible}</div>
          <div className="text-sm text-gray-400 mt-1">Terrible Site</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{data.summary.mediocre}</div>
          <div className="text-sm text-gray-400 mt-1">Mediocre</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-neon-green">{data.summary.readyToPitch}</div>
          <div className="text-sm text-gray-400 mt-1">Ready to Pitch</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-dark-700 text-gray-400 border border-white/10 hover:text-white'
            }`}
          >
            All ({data.prospects.length})
          </button>
          {industries.map(ind => (
            <button
              key={ind}
              onClick={() => setFilter(ind)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === ind ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-dark-700 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {ind} ({data.prospects.filter(p => p.industry === ind).length})
            </button>
          ))}
        </div>
      </div>

      {/* Prospect Cards */}
      <div className="space-y-4">
        {sorted.map(prospect => (
          <div key={prospect.id} className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              {/* Left: Business info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">{prospect.business}</h3>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{ backgroundColor: `${gradeColor[prospect.websiteGrade] || '#666'}22`, color: gradeColor[prospect.websiteGrade] || '#666', border: `1px solid ${gradeColor[prospect.websiteGrade] || '#666'}44` }}
                  >
                    Grade: {prospect.websiteGrade}
                  </span>
                  <span className="text-xs text-gray-500 bg-dark-600 px-2 py-0.5 rounded">{prospect.industry}</span>
                </div>
                
                {/* Contact info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                  {prospect.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {prospect.address}
                    </span>
                  )}
                  {prospect.phone && (
                    <a href={`tel:${prospect.phone}`} className="flex items-center gap-1.5 text-neon-cyan hover:text-neon-cyan/80">
                      <Phone className="w-3.5 h-3.5" />
                      {prospect.phone}
                    </a>
                  )}
                  {prospect.owner && (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      Owner: {prospect.owner}
                    </span>
                  )}
                </div>

                {/* Issue */}
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300/80">{prospect.issue}</p>
                </div>

                {/* Opportunity */}
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{prospect.opportunity}</p>
                </div>

                {/* Current website link */}
                {prospect.currentWebsite && (
                  <a
                    href={prospect.currentWebsite.startsWith('http') ? prospect.currentWebsite : `https://${prospect.currentWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-500 hover:text-neon-cyan transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {prospect.currentWebsite}
                  </a>
                )}
              </div>

              {/* Right: Status */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-lg">{prospect.priority.split(' ')[0]}</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-dark-600 text-gray-300 border border-white/10">
                  {prospect.status}
                </span>
              </div>
            </div>

            {/* Notes */}
            {prospect.notes && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-gray-500">{prospect.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No prospects match your filters.
        </div>
      )}
    </div>
  );
}
