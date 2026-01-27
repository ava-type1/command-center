import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader2, X, Sparkles, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const WORKER_URL = 'https://command-center-chat.5wwncts568.workers.dev';

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch messages from Supabase via worker
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${WORKER_URL}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start polling when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      // Poll every 3 seconds for new messages
      pollIntervalRef.current = setInterval(fetchMessages, 3000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistically add message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await fetch(`${WORKER_URL}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) throw new Error('Failed to send');
      
      // Fetch fresh messages
      await fetchMessages();
    } catch (err) {
      console.error('Send error:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg glass rounded-2xl shadow-2xl border border-neon-green/20 overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Claude</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                Live chat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMessages}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
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
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-neon-green" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet.</p>
              <p className="text-sm">Start a conversation!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-neon-cyan/10 text-gray-200 border border-neon-cyan/20'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-dark-800/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="px-4 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-dark-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-green/20 transition-all"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Messages sync in real-time • Claude responds via this chat
          </p>
        </div>
      </div>
    </div>
  );
}

// Floating button to open chat
export function AIChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-neon-green to-neon-cyan shadow-lg shadow-neon-green/30 flex items-center justify-center hover:scale-110 transition-transform z-40 group"
    >
      <Sparkles className="w-6 h-6 text-dark-900" />
      <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-dark-700 text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Chat with Claude
      </span>
    </button>
  );
}
