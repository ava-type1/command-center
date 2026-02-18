import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, X, Trash2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

// ─── SpeechRecognition types for TypeScript ────────────────────────────────
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

// Window SpeechRecognition types declared in KodaVoice.tsx

// ─── Interfaces ────────────────────────────────────────────────────────────
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

// ─── Constants ─────────────────────────────────────────────────────────────
const API_URL = 'https://vmi3042450.contaboserver.net:8443/v1/chat/completions';
const API_TOKEN = '4c6b9520fe27cba5e3258e3ee09dc43ca5e7ef53e4c72cb0';
const STORAGE_KEY = 'koda-chat-history';
const VOICE_MODE_KEY = 'koda-voice-mode';
const TTS_ENABLED_KEY = 'koda-tts-enabled';

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

function loadBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v === 'true' : fallback;
  } catch {
    return fallback;
  }
}

// ─── Voice Waveform Component ──────────────────────────────────────────────
function VoiceWaveform({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-red-400 rounded-full"
          style={{
            animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
            height: '100%',
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Voice state
  const [voiceMode, setVoiceMode] = useState(() => loadBool(VOICE_MODE_KEY, false));
  const [ttsEnabled, setTtsEnabled] = useState(() => loadBool(TTS_ENABLED_KEY, true));
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);
  const voiceModeRef = useRef(voiceMode);
  const ttsEnabledRef = useRef(ttsEnabled);
  const streamingRef = useRef(streaming);
  const isSpeakingRef = useRef(isSpeaking);

  // Keep refs in sync
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { streamingRef.current = streaming; }, [streaming]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  // Persist preferences
  useEffect(() => { localStorage.setItem(VOICE_MODE_KEY, String(voiceMode)); }, [voiceMode]);
  useEffect(() => { localStorage.setItem(TTS_ENABLED_KEY, String(ttsEnabled)); }, [ttsEnabled]);

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

  // Clean up on unmount / close
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      window.speechSynthesis?.cancel();
      if (dgAudioRef?.current) { dgAudioRef.current.pause(); dgAudioRef.current.src = ''; dgAudioRef.current = null; }
      setIsSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Whisper fallback refs ────────────────────────────────────────────────
  const whisperModeRef = useRef(false);
  const whisperAudioCtxRef = useRef<AudioContext | null>(null);
  const whisperProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const whisperStreamRef = useRef<MediaStream | null>(null);
  const whisperChunksRef = useRef<Float32Array[]>([]);
  const whisperLastSoundRef = useRef<number>(0);
  const TRANSCRIBE_API = 'https://koda-transcribe.kameronmartinllc.workers.dev/transcribe';

  function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
    let totalLength = 0;
    for (const c of chunks) totalLength += c.length;
    const samples = new Float32Array(totalLength);
    let off = 0;
    for (const c of chunks) { samples.set(c, off); off += c.length; }
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buf);
    const w = (p: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(p + i, s.charCodeAt(i)); };
    w(0, 'RIFF');
    v.setUint32(4, 36 + samples.length * 2, true);
    w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true);
    v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true);
    v.setUint16(34, 16, true); w(36, 'data');
    v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  // ── SpeechRecognition setup ────────────────────────────────────────────
  const getSpeechRecognition = useCallback((): SpeechRecognitionInstance | null => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    return recognition;
  }, []);

  const cleanupWhisper = useCallback(() => {
    whisperModeRef.current = false;
    try { whisperProcessorRef.current?.disconnect(); } catch { /* */ }
    try { whisperAudioCtxRef.current?.close(); } catch { /* */ }
    whisperAudioCtxRef.current = null;
    if (whisperStreamRef.current) { whisperStreamRef.current.getTracks().forEach(t => t.stop()); whisperStreamRef.current = null; }
    whisperChunksRef.current = [];
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    cleanupWhisper();
    setIsListening(false);
    setInterimTranscript('');
  }, [cleanupWhisper]);

  // Whisper: send recorded audio for transcription
  const whisperTranscribe = useCallback(async (chunks: Float32Array[], sampleRate: number) => {
    const wavBlob = encodeWav(chunks, sampleRate);
    if (wavBlob.size < 5000) return; // too short
    try {
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      const resp = await fetch(TRANSCRIBE_API, { method: 'POST', body: formData });
      if (!resp.ok) return;
      const data = await resp.json();
      const transcript = (data.transcript || '').trim();
      if (transcript && transcript !== '[BLANK_AUDIO]' && transcript.length > 1) {
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
      }
    } catch { /* ignore */ }
  }, []);

  // Start Whisper-based listening (fallback when Web Speech API unavailable)
  const startWhisperListening = useCallback(async () => {
    setVoiceError(null);
    whisperModeRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      whisperStreamRef.current = stream;
      whisperChunksRef.current = [];
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') await audioContext.resume();
      whisperAudioCtxRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      whisperProcessorRef.current = processor;
      whisperLastSoundRef.current = Date.now();

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!whisperModeRef.current) return;
        const data = new Float32Array(e.inputBuffer.getChannelData(0));
        whisperChunksRef.current.push(data);
        // Energy detection
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        if (Math.sqrt(sum / data.length) > 0.01) {
          whisperLastSoundRef.current = Date.now();
        }
        // Silence = transcribe
        if (Date.now() - whisperLastSoundRef.current > 2000 && whisperChunksRef.current.length > 10) {
          const chunks = [...whisperChunksRef.current];
          whisperChunksRef.current = [];
          whisperLastSoundRef.current = Date.now();
          const sr = whisperAudioCtxRef.current?.sampleRate || 16000;
          whisperTranscribe(chunks, sr);
        }
      };

      source.connect(processor);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      silentGain.connect(audioContext.destination);
      processor.connect(silentGain);
      setIsListening(true);
    } catch {
      setVoiceError('Microphone access denied. Please allow mic access.');
      whisperModeRef.current = false;
    }
  }, [whisperTranscribe]);

  const startListening = useCallback(() => {
    setVoiceError(null);
    const recognition = getSpeechRecognition();

    // If Web Speech API unavailable, use Whisper fallback
    if (!recognition) {
      startWhisperListening();
      return;
    }

    // Stop any existing
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        setInterimTranscript(interim);
      }
      if (final) {
        setInterimTranscript('');
        setInput(prev => {
          const combined = prev ? prev + ' ' + final.trim() : final.trim();
          return combined;
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // Web Speech API blocked — fall back to Whisper
        setIsListening(false);
        recognitionRef.current = null;
        startWhisperListening();
        return;
      }
      setVoiceError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (shouldRestartRef.current && voiceModeRef.current && !streamingRef.current && !isSpeakingRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && voiceModeRef.current) {
            startListening();
          }
        }, 300);
      }
    };

    try {
      recognition.start();
    } catch {
      // Start failed — try Whisper fallback
      setIsListening(false);
      startWhisperListening();
    }
  }, [getSpeechRecognition, stopListening, startWhisperListening]);

  // ── TTS (Deepgram with browser fallback) ────────────────────────────────
  const dgAudioRef = useRef<HTMLAudioElement | null>(null);
  const TTS_API = 'https://koda-transcribe.kameronmartinllc.workers.dev/tts';

  const speakText = useCallback((text: string) => {
    if (!ttsEnabledRef.current || !voiceModeRef.current) return;

    // Strip markdown for cleaner speech
    const clean = text
      .replace(/```[\s\S]*?```/g, ' code block ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/[_~]/g, '')
      .trim();

    if (!clean) return;

    const speechText = clean.length > 2000 ? clean.substring(0, 2000) + '. Check the chat for the full response.' : clean;

    const finishSpeech = () => {
      setIsSpeaking(false);
      if (voiceModeRef.current && shouldRestartRef.current) {
        setTimeout(() => {
          if (voiceModeRef.current && shouldRestartRef.current && !streamingRef.current) {
            startListening();
          }
        }, 400);
      }
    };

    // Try Deepgram TTS first
    setIsSpeaking(true);
    fetch(TTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: speechText, voice: 'aura-2-zeus-en' }),
    }).then(res => {
      if (!res.ok) throw new Error('TTS failed');
      return res.blob();
    }).then(blob => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      dgAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); dgAudioRef.current = null; finishSpeech(); };
      audio.onerror = () => { URL.revokeObjectURL(url); dgAudioRef.current = null; finishSpeech(); };
      audio.play().catch(() => finishSpeech());
    }).catch(() => {
      // Fallback to browser TTS
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'en-US';
        utterance.rate = 1.05;
        utterance.onend = () => finishSpeech();
        utterance.onerror = () => finishSpeech();
        window.speechSynthesis.speak(utterance);
      } else {
        finishSpeech();
      }
    });
  }, [startListening]);

  // ── Voice mode toggle ──────────────────────────────────────────────────
  const toggleVoiceMode = useCallback(() => {
    const next = !voiceMode;
    setVoiceMode(next);
    if (next) {
      startListening();
    } else {
      stopListening();
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [voiceMode, startListening, stopListening]);

  const toggleTts = useCallback(() => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    if (!next) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  // ── Mic button handler (for manual push-to-listen outside voice mode) ──
  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ── Send message (supports voice auto-send) ───────────────────────────
  const sendMessage = async (overrideContent?: string) => {
    const content = (overrideContent || input).trim();
    if (!content || streaming) return;

    setInput('');
    setInterimTranscript('');

    // Stop listening while we process
    if (isListening) {
      shouldRestartRef.current = voiceMode; // remember to restart after
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
      setIsListening(false);
    }

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

        // TTS readback
        if (voiceModeRef.current && ttsEnabledRef.current) {
          speakText(fullContent);
        } else if (voiceModeRef.current && shouldRestartRef.current) {
          // No TTS but voice mode — restart listening
          setTimeout(() => {
            if (voiceModeRef.current && shouldRestartRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 400);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

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

          if (voiceModeRef.current && ttsEnabledRef.current) {
            speakText(reply);
          }
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

  // Auto-send when voice recognition produces final text and voice mode is on
  // We use an effect that watches input changes — when voice mode is active and
  // recognition ends with text, send automatically after a short delay
  const voiceAutoSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (voiceMode && input.trim() && !isListening && !streaming && !isSpeaking) {
      // Auto-send after a brief pause to allow multi-phrase accumulation
      if (voiceAutoSendTimerRef.current) clearTimeout(voiceAutoSendTimerRef.current);
      voiceAutoSendTimerRef.current = setTimeout(() => {
        sendMessage();
      }, 800);
    }
    return () => {
      if (voiceAutoSendTimerRef.current) clearTimeout(voiceAutoSendTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isListening, voiceMode, streaming, isSpeaking]);

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
                <span className={`w-2 h-2 rounded-full ${
                  isSpeaking ? 'bg-neon-cyan' :
                  isListening ? 'bg-red-400' :
                  streaming ? 'bg-yellow-400' :
                  'bg-neon-green'
                } animate-pulse`} />
                {isSpeaking ? 'Speaking...' :
                 isListening ? 'Listening...' :
                 streaming ? 'Thinking...' :
                 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Voice Mode Toggle */}
            <button
              onClick={toggleVoiceMode}
              onTouchEnd={(e) => { e.preventDefault(); toggleVoiceMode(); }}
              className={`p-2 rounded-lg transition-all relative ${
                voiceMode
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/40'
                  : 'hover:bg-white/5 text-gray-400'
              }`}
              title={voiceMode ? 'Disable voice mode' : 'Enable voice mode'}
            >
              {voiceMode ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {voiceMode && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
            </button>
            {/* TTS Toggle */}
            <button
              onClick={toggleTts}
              className={`p-2 rounded-lg transition-all ${
                ttsEnabled && voiceMode
                  ? 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 ring-1 ring-neon-cyan/40'
                  : 'hover:bg-white/5 text-gray-400'
              }`}
              title={ttsEnabled ? 'Disable response readback' : 'Enable response readback'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
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

        {/* Voice Error Banner */}
        {voiceError && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center justify-between shrink-0">
            <span>{voiceError}</span>
            <button onClick={() => setVoiceError(null)} className="ml-2 hover:text-red-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Voice Mode Active Banner */}
        {voiceMode && (
          <div className="px-4 py-1.5 bg-gradient-to-r from-red-500/10 to-neon-cyan/10 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-center gap-2 text-xs">
              <VoiceWaveform active={isListening} />
              <span className={isListening ? 'text-red-400' : isSpeaking ? 'text-neon-cyan' : 'text-gray-400'}>
                {isListening ? 'Listening...' :
                 isSpeaking ? '🔊 Speaking...' :
                 streaming ? '🤔 Thinking...' :
                 '🎙️ Voice Mode Active'}
              </span>
              <VoiceWaveform active={isListening} />
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 && !streaming ? (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl block mb-3">🧠</span>
              <p className="font-medium text-gray-300">Hey, it's Koda</p>
              <p className="text-sm mt-1">Ask me anything — projects, ideas, or just chat.</p>
              {voiceMode && (
                <p className="text-xs mt-3 text-neon-cyan/60">🎙️ Voice mode is on — just speak!</p>
              )}
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

          {/* Interim transcript preview */}
          {interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-neon-green/10 text-neon-green/50 border border-neon-green/20 border-dashed">
                <p className="text-sm italic">{interimTranscript}</p>
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
              placeholder={isListening ? 'Listening...' : 'Message Koda...'}
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors text-sm"
              disabled={streaming}
            />
            {/* Mic button */}
            {!streaming && (
              <button
                onClick={toggleMic}
                className={`px-3 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 animate-pulse'
                    : 'bg-dark-600 border border-white/10 text-gray-400 hover:text-neon-green hover:border-neon-green/30'
                }`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
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
                onClick={() => sendMessage()}
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
