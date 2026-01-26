import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, X, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// Worker URL - you'll deploy this to Cloudflare Workers
const WORKER_URL = 'https://command-center-chat.kameronmartinllc.workers.dev';

export function AIChatPanel({ isOpen, onClose, onRefresh }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: "I'm connected to Claude via Telegram. Send a message and I'll update your dashboard!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `[Dashboard] ${userMessage.content}`,
          source: 'command-center'
        }),
      });

      if (response.ok) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Message sent! I'll update the dashboard shortly. Hit refresh in ~30 seconds to see changes.",
            timestamp: new Date(),
          },
        ]);
        
        // Auto-refresh after 30 seconds
        setTimeout(() => {
          onRefresh();
        }, 30000);
      } else {
        throw new Error('Failed to send');
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: "Couldn't reach Claude. Try Telegram directly: @Avatype1bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
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
              <p className="text-xs text-gray-400">Your AI assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : msg.role === 'assistant'
                    ? 'bg-neon-cyan/10 text-gray-200 border border-neon-cyan/20'
                    : 'bg-dark-600 text-gray-400 border border-white/5'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-50 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-dark-800/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Claude to update the dashboard..."
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
            Messages go to Claude via Telegram • Changes sync automatically
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
