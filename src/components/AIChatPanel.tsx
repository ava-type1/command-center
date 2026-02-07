import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, X, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = 'http://217.216.67.51:8443/v1/chat/completions';
const API_TOKEN = '4c6b9520fe27cba5e3258e3ee09dc43ca5e7ef53e4c72cb0';
const STORAGE_KEY = 'koda-chat-history';

function loadHistory(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  const trimmed = messages.slice(-50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const content = input.trim();
    setInput('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setStreaming(true);
    setStreamContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build messages for the API - include recent history for context
      const apiMessages = updatedMessages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'clawdbot:main',
          stream: true,
          user: 'kam-dashboard',
          messages: apiMessages,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

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
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      }

      if (fullContent) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;

      // Try non-streaming fallback
      try {
        const syncRes = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'clawdbot:main',
            stream: false,
            user: 'kam-dashboard',
            messages: updatedMessages.slice(-20).map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (syncRes.ok) {
          const data = await syncRes.json();
          const reply = data.choices?.[0]?.message?.content || 'No response';
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: reply,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error('Fallback failed');
        }
      } catch {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Couldn\'t connect — I might be busy or the server is unreachable. Try again in a sec.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setStreaming(false);
      setStreamContent('');
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    if (streamContent) {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: streamContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
    setStreaming(false);
    setStreamContent('');
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg glass rounded-2xl shadow-2xl border border-neon-green/20 overflow-hidden animate-in slide-in-from-bottom-4 flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
              <span className="text-lg">🧠</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">Koda</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${streaming ? 'bg-yellow-400' : 'bg-neon-green'} animate-pulse`} />
                {streaming ? 'Thinking...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 && !streaming ? (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl block mb-3">🧠</span>
              <p className="font-medium text-gray-300">Hey, it's Koda</p>
              <p className="text-sm mt-1">Ask me anything — projects, ideas, or just chat.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-dark-600/80 text-gray-200 border border-white/5'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs opacity-40 mt-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Streaming indicator */}
          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-dark-600/80 text-gray-200 border border-neon-cyan/20">
                {streamContent ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {streamContent}
                    <span className="inline-block w-2 h-4 bg-neon-cyan/60 animate-pulse ml-0.5" />
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-dark-800/30 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Message Koda..."
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors text-sm"
              disabled={streaming}
            />
            {streaming ? (
              <button
                onClick={stopStreaming}
                className="px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                title="Stop"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="px-4 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-dark-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-green/20 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-neon-green to-neon-cyan shadow-lg shadow-neon-green/30 flex items-center justify-center hover:scale-110 transition-transform z-40 group"
    >
      <span className="text-xl">🧠</span>
      <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-dark-700 text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Chat with Koda
      </span>
    </button>
  );
}
