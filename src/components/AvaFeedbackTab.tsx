import { useEffect, useMemo, useState } from 'react';
import { MessageSquarePlus, Trash2, Users } from 'lucide-react';

type CRMStatus = 'new' | 'replied' | 'follow-up' | 'closed';

interface AvaFeedbackNote {
  id: string;
  title: string;
  text: string;
  category: string;
  source?: string;
  askedForMmol: boolean;
  date: string;
}

interface AvaCRMContact {
  id: string;
  nameOrEmail: string;
  source: string;
  category: string;
  status: CRMStatus;
  note: string;
  date: string;
}

interface AvaFeedbackSeed {
  items?: unknown[];
  notes?: AvaFeedbackNote[];
  contacts?: AvaCRMContact[];
}

interface AvaFeedbackState {
  notes: AvaFeedbackNote[];
  contacts: AvaCRMContact[];
}

const STORAGE_KEY = 'kam-ava-feedback';
const statusOptions: CRMStatus[] = ['new', 'replied', 'follow-up', 'closed'];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeSeed(seed: AvaFeedbackSeed | null | undefined): AvaFeedbackState {
  const notes = Array.isArray(seed?.notes) ? seed!.notes : [];
  const contacts = Array.isArray(seed?.contacts) ? seed!.contacts : [];
  return { notes, contacts };
}

export function AvaFeedbackTab() {
  const [notes, setNotes] = useState<AvaFeedbackNote[]>([]);
  const [contacts, setContacts] = useState<AvaCRMContact[]>([]);
  const [loading, setLoading] = useState(true);

  const [noteForm, setNoteForm] = useState({
    title: '',
    text: '',
    category: 'feature request',
    source: '',
    askedForMmol: false,
  });

  const [crmForm, setCrmForm] = useState({
    nameOrEmail: '',
    source: 'facebook',
    category: 'waitlist',
    status: 'new' as CRMStatus,
    note: '',
    date: today(),
  });

  useEffect(() => {
    const boot = async () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as AvaFeedbackState;
          setNotes(Array.isArray(parsed.notes) ? parsed.notes : []);
          setContacts(Array.isArray(parsed.contacts) ? parsed.contacts : []);
          setLoading(false);
          return;
        }

        const res = await fetch(`/data/ava-feedback.json?t=${Date.now()}`);
        if (res.ok) {
          const seed = (await res.json()) as AvaFeedbackSeed;
          const normalized = normalizeSeed(seed);
          setNotes(normalized.notes);
          setContacts(normalized.contacts);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch {
        // Keep defaults if seed cannot load.
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes, contacts }));
    }
  }, [notes, contacts, loading]);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.date.localeCompare(a.date)),
    [notes]
  );

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => b.date.localeCompare(a.date)),
    [contacts]
  );

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.text.trim()) return;

    setNotes(prev => [
      {
        id: uid(),
        title: noteForm.title.trim(),
        text: noteForm.text.trim(),
        category: noteForm.category.trim() || 'general',
        source: noteForm.source.trim() || undefined,
        askedForMmol: noteForm.askedForMmol,
        date: today(),
      },
      ...prev,
    ]);

    setNoteForm({
      title: '',
      text: '',
      category: noteForm.category,
      source: '',
      askedForMmol: false,
    });
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmForm.nameOrEmail.trim()) return;

    setContacts(prev => [
      {
        id: uid(),
        nameOrEmail: crmForm.nameOrEmail.trim(),
        source: crmForm.source.trim(),
        category: crmForm.category.trim(),
        status: crmForm.status,
        note: crmForm.note.trim(),
        date: crmForm.date || today(),
      },
      ...prev,
    ]);

    setCrmForm(prev => ({
      ...prev,
      nameOrEmail: '',
      note: '',
      status: 'new',
      date: today(),
    }));
  };

  const inputClass = 'w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50';

  if (loading) {
    return <div className="text-gray-400 text-center py-12">Loading AVA feedback...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">AVA Feedback</h2>
        <p className="text-sm text-gray-400 mt-1">Quick notes from comments + lightweight follow-up tracker.</p>
      </div>

      <section className="glass rounded-xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquarePlus className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white">Quick Notes</h3>
        </div>

        <form onSubmit={addNote} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Title (ex: Android mmol request)" value={noteForm.title} onChange={e => setNoteForm(prev => ({ ...prev, title: e.target.value }))} />
          <input className={inputClass} placeholder="Category (feature request, bug, etc.)" value={noteForm.category} onChange={e => setNoteForm(prev => ({ ...prev, category: e.target.value }))} />
          <input className={inputClass} placeholder="Source (optional: FB group name/post)" value={noteForm.source} onChange={e => setNoteForm(prev => ({ ...prev, source: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-gray-300 px-3 py-2 bg-dark-700 border border-white/10 rounded-lg">
            <input type="checkbox" checked={noteForm.askedForMmol} onChange={e => setNoteForm(prev => ({ ...prev, askedForMmol: e.target.checked }))} />
            Asked for mmol units
          </label>
          <textarea className={`${inputClass} md:col-span-2 min-h-[90px]`} placeholder="Note text" value={noteForm.text} onChange={e => setNoteForm(prev => ({ ...prev, text: e.target.value }))} />
          <div className="md:col-span-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 text-sm font-medium hover:bg-neon-cyan/30 transition-colors">
              Add note
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-2">
          {sortedNotes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet.</p>
          ) : (
            sortedNotes.map(note => (
              <div key={note.id} className="bg-dark-700/70 border border-white/10 rounded-lg p-3">
                <div className="flex justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{note.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{note.date} · {note.category}{note.source ? ` · ${note.source}` : ''}</p>
                  </div>
                  <button onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))} className="text-gray-500 hover:text-red-400" title="Delete note">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{note.text}</p>
                {note.askedForMmol && (
                  <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/25">
                    mmol requested
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="glass rounded-xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-neon-green" />
          <h3 className="text-lg font-semibold text-white">Mini CRM</h3>
        </div>

        <form onSubmit={addContact} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <input className={`${inputClass} md:col-span-2`} placeholder="Name or email" value={crmForm.nameOrEmail} onChange={e => setCrmForm(prev => ({ ...prev, nameOrEmail: e.target.value }))} />
          <input className={inputClass} placeholder="Source" value={crmForm.source} onChange={e => setCrmForm(prev => ({ ...prev, source: e.target.value }))} />
          <input className={inputClass} placeholder="Type / category" value={crmForm.category} onChange={e => setCrmForm(prev => ({ ...prev, category: e.target.value }))} />
          <select className={inputClass} value={crmForm.status} onChange={e => setCrmForm(prev => ({ ...prev, status: e.target.value as CRMStatus }))}>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" className={inputClass} value={crmForm.date} onChange={e => setCrmForm(prev => ({ ...prev, date: e.target.value }))} />
          <textarea className={`${inputClass} md:col-span-5 min-h-[70px]`} placeholder="Note" value={crmForm.note} onChange={e => setCrmForm(prev => ({ ...prev, note: e.target.value }))} />
          <div>
            <button type="submit" className="w-full px-4 py-2 rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 text-sm font-medium hover:bg-neon-green/30 transition-colors">
              Add contact
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-2 pr-3">Name / Email</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Note</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {sortedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-gray-500">No contacts yet.</td>
                </tr>
              ) : (
                sortedContacts.map(contact => (
                  <tr key={contact.id} className="border-b border-white/5 text-gray-300 align-top">
                    <td className="py-2 pr-3">{contact.nameOrEmail}</td>
                    <td className="py-2 pr-3">{contact.source}</td>
                    <td className="py-2 pr-3">{contact.category}</td>
                    <td className="py-2 pr-3"><span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">{contact.status}</span></td>
                    <td className="py-2 pr-3 max-w-[280px] whitespace-pre-wrap">{contact.note}</td>
                    <td className="py-2 pr-3">{contact.date}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => setContacts(prev => prev.filter(c => c.id !== contact.id))} className="text-gray-500 hover:text-red-400" title="Delete contact">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
