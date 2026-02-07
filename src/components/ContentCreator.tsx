import { useState, useEffect } from 'react';
import { PenTool, Twitter, Video, Copy, Save, Trash2, Loader2, Sparkles } from 'lucide-react';

const API_URL = 'https://vmi3042450.contaboserver.net:8443/v1/chat/completions';
const API_TOKEN = '4c6b9520fe27cba5e3258e3ee09dc43ca5e7ef53e4c72cb0';
const DRAFTS_KEY = 'kam-content-drafts';

interface Draft {
  id: string;
  type: 'x' | 'tiktok';
  content: string;
  createdAt: string;
}

const PROMPTS = {
  x: `Generate an engaging X (Twitter) post for the AVA Type 1 brand. AVA Type 1 is a mobile game that teaches kids about Type 1 Diabetes management through gameplay. The post should be:
- Under 280 characters
- Include 1-2 relevant hashtags
- Be authentic, not corporate
- Focus on either: T1D awareness, game updates, community, or diabetes education
- Conversational tone

Just output the post text, nothing else.`,
  tiktok: `Generate a TikTok video idea/script for the AVA Type 1 brand. AVA Type 1 is a mobile game that teaches kids about Type 1 Diabetes management. Include:
- Hook (first 3 seconds to grab attention)
- Main content outline (15-60 seconds)
- Call to action
- Suggested trending audio/format if applicable
- Relevant hashtags

Keep it casual, fun, and educational. Format it clearly with sections.`,
};

function loadDrafts(): Draft[] {
  try {
    const stored = localStorage.getItem(DRAFTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: Draft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function ContentCreator() {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedType, setGeneratedType] = useState<'x' | 'tiktok' | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [streamContent, setStreamContent] = useState('');

  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  const generate = async (type: 'x' | 'tiktok') => {
    setGenerating(true);
    setGeneratedContent('');
    setStreamContent('');
    setGeneratedType(type);
    setCopied(false);
    setSaved(false);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'clawdbot:main',
          stream: true,
          user: 'kam-content-creator',
          messages: [{ role: 'user', content: PROMPTS[type] }],
        }),
      });

      if (!res.ok) throw new Error(`Error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                setStreamContent(fullContent);
              }
            } catch { /* skip */ }
          }
        }
      }

      setGeneratedContent(fullContent);
    } catch (err) {
      // Fallback to non-streaming
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'clawdbot:main',
            stream: false,
            user: 'kam-content-creator',
            messages: [{ role: 'user', content: PROMPTS[type] }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || 'No response';
          setGeneratedContent(content);
          setStreamContent(content);
        } else {
          throw new Error('Fallback failed');
        }
      } catch {
        setGeneratedContent('⚠️ Could not generate content. Try again.');
        setStreamContent('⚠️ Could not generate content. Try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = () => {
    const content = generatedContent || streamContent;
    if (!content || !generatedType) return;
    const draft: Draft = {
      id: Date.now().toString(),
      type: generatedType,
      content,
      createdAt: new Date().toISOString(),
    };
    setDrafts(prev => [draft, ...prev]);
    setSaved(true);
  };

  const deleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const displayContent = generatedContent || streamContent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <PenTool className="w-6 h-6 text-neon-pink" />
          Content Creator
        </h2>
        <p className="text-gray-400 text-sm mt-1">Generate content for AVA Type 1 brand</p>
      </div>

      {/* Generator */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-neon-pink" />
          Generate Content
        </h3>
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => generate('x')}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating && generatedType === 'x' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Twitter className="w-5 h-5" />
            )}
            Generate X Post
          </button>
          <button
            onClick={() => generate('tiktok')}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-3 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-xl hover:bg-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating && generatedType === 'tiktok' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Video className="w-5 h-5" />
            )}
            Generate TikTok Idea
          </button>
        </div>

        {/* Generated Content */}
        {displayContent && (
          <div className="mt-4">
            <div className="bg-dark-700/50 rounded-xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  generatedType === 'x'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-pink-500/20 text-pink-400'
                }`}>
                  {generatedType === 'x' ? '𝕏 Post' : '🎵 TikTok'}
                </span>
                {generating && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </span>
                )}
              </div>
              <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                {displayContent}
                {generating && <span className="inline-block w-2 h-4 bg-neon-pink/60 animate-pulse ml-0.5" />}
              </p>
            </div>
            {!generating && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => copyToClipboard(displayContent)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-dark-600 text-gray-300 rounded-lg hover:bg-dark-500 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={saveDraft}
                  disabled={saved}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-neon-green/10 text-neon-green rounded-lg hover:bg-neon-green/20 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved!' : 'Save Draft'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved Drafts */}
      {drafts.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Save className="w-5 h-5 text-neon-green" />
            Saved Drafts
            <span className="text-xs text-gray-500 font-normal">({drafts.length})</span>
          </h3>
          <div className="space-y-3">
            {drafts.map(draft => (
              <div
                key={draft.id}
                className="bg-dark-700/30 rounded-xl p-4 border border-white/5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      draft.type === 'x'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-pink-500/20 text-pink-400'
                    }`}>
                      {draft.type === 'x' ? '𝕏 Post' : '🎵 TikTok'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(draft.content)}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-4">
                  {draft.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
