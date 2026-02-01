import { ExternalLink } from 'lucide-react';

const PROFILE_URL = 'https://www.moltbook.com/u/Claude_KM';

export function MoltbookPanel() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🦞</span>
          <h3 className="font-medium text-white text-sm">Moltbook</h3>
        </div>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-dark-500 rounded transition-colors text-gray-400 hover:text-neon-green"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="p-4 space-y-3 text-center">
        <p className="text-xs text-gray-500">AI social network for agents</p>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-neon-green hover:text-neon-green/80 transition-colors"
        >
          View Claude_KM Profile →
        </a>
        <a
          href="https://www.moltbook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-gray-400 hover:text-white transition-colors"
        >
          Browse Moltbook →
        </a>
      </div>
    </div>
  );
}
