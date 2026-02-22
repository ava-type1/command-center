import { ExternalLink, Tag, BookOpen } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  content: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

interface NotesTabProps {
  notes: Note[];
}

const categoryColors: Record<string, { text: string; bg: string; border: string }> = {
  'AI Tools':     { text: '#00d4ff', bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.2)' },
  'Hardware':     { text: '#00ff88', bg: 'rgba(0,255,136,0.1)',   border: 'rgba(0,255,136,0.2)' },
  'Business':     { text: '#bf00ff', bg: 'rgba(191,0,255,0.1)',   border: 'rgba(191,0,255,0.2)' },
  'Dev':          { text: '#ff6600', bg: 'rgba(255,102,0,0.1)',   border: 'rgba(255,102,0,0.2)' },
  'Research':     { text: '#f5c542', bg: 'rgba(245,197,66,0.1)',  border: 'rgba(245,197,66,0.2)' },
  'Health':       { text: '#ff3366', bg: 'rgba(255,51,102,0.1)',  border: 'rgba(255,51,102,0.2)' },
};

function getColor(category: string) {
  return categoryColors[category] || { text: '#8892a4', bg: 'rgba(136,146,164,0.1)', border: 'rgba(136,146,164,0.2)' };
}

export function NotesTab({ notes }: NotesTabProps) {
  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-neon-cyan" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Notes</h2>
          <p className="text-xs text-gray-500">{notes.length} note{notes.length !== 1 ? 's' : ''} · Koda drops things worth remembering here</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No notes yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(note => {
            const color = getColor(note.category);
            return (
              <div
                key={note.id}
                className="rounded-xl border p-5"
                style={{ background: 'rgba(19,21,26,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white leading-snug">{note.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(note.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ color: color.text, background: color.bg, border: `1px solid ${color.border}` }}
                  >
                    {note.category}
                  </span>
                </div>

                {/* Content */}
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-3">
                  {note.content}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[11px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  {note.sourceUrl && (
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium shrink-0 ml-3"
                      style={{ color: color.text }}
                    >
                      {note.sourceLabel || 'Source'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
