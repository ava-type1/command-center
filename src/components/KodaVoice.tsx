import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Settings, X, Square, Volume2 } from 'lucide-react';

// ─── SpeechRecognition types ────────────────────────────────────────────────
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
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    webkitAudioContext: typeof AudioContext;
  }
}

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

type VoiceState = 'idle' | 'listening' | 'recording' | 'thinking' | 'speaking';
type VoiceMode = 'handsfree' | 'ptt';

// ─── Constants ──────────────────────────────────────────────────────────────
const API_URL = 'https://vmi3042450.contaboserver.net:8443/v1/chat/completions';
const API_TOKEN = '4c6b9520fe27cba5e3258e3ee09dc43ca5e7ef53e4c72cb0';
const TRANSCRIBE_API = 'https://koda-transcribe.kameronmartinllc.workers.dev/transcribe';
const TTS_API = 'https://koda-transcribe.kameronmartinllc.workers.dev/tts';
const VOICES_API = 'https://koda-transcribe.kameronmartinllc.workers.dev/voices';
const STORAGE_KEYS = {
  history: 'koda-voice-history',
  mode: 'koda-voice-mode',
  voiceName: 'koda-voice-name',
  voiceRate: 'koda-voice-rate',
  silenceTimeout: 'koda-voice-silence',
  settingsOpen: 'koda-voice-settings',
  ttsMode: 'koda-voice-tts-mode',
  dgVoice: 'koda-voice-dg-voice',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function loadMessages(): Message[] {
  try {
    const s = localStorage.getItem(STORAGE_KEYS.history);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveMessages(msgs: Message[]) {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(msgs.slice(-50)));
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/[🧠🎤⚙️⚠️🥇🥈🥉💡🔥✅❌📱💊🏠🔧📊💬🚗👍🏓👆🎙️🎧]/gu, '')
    .replace(/[_~]/g, '')
    .replace(/- \*\*/g, '. ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimer(ms: number) {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Component ──────────────────────────────────────────────────────────────
export function KodaVoice() {
  // State
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [mode, setMode] = useState<VoiceMode>(() =>
    (localStorage.getItem(STORAGE_KEYS.mode) as VoiceMode) || 'handsfree'
  );
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [input, setInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [pttTimer, setPttTimer] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem(STORAGE_KEYS.voiceName) || '');
  const [voiceRate, setVoiceRate] = useState(() => parseFloat(localStorage.getItem(STORAGE_KEYS.voiceRate) || '1.0'));
  const [ttsMode, setTtsMode] = useState<'deepgram' | 'browser'>(() =>
    (localStorage.getItem(STORAGE_KEYS.ttsMode) as 'deepgram' | 'browser') || 'deepgram'
  );
  const [dgVoice, setDgVoice] = useState(() => localStorage.getItem(STORAGE_KEYS.dgVoice) || 'aura-2-zeus-en');
  const [dgVoices, setDgVoices] = useState<Record<string, string>>({});
  const [silenceTimeout, setSilenceTimeout] = useState(() => parseFloat(localStorage.getItem(STORAGE_KEYS.silenceTimeout) || '2.0'));

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recognitionActiveRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>('idle');
  const modeRef = useRef<VoiceMode>(mode);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  // PTT refs
  const pttRecordingRef = useRef(false);
  const pttAudioContextRef = useRef<AudioContext | null>(null);
  const pttSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pttProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const pttChunksRef = useRef<Float32Array[]>([]);
  const pttStreamRef = useRef<MediaStream | null>(null);
  const pttTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pttStartTimeRef = useRef<number>(0);

  // Whisper fallback refs (for handsfree when Web Speech API not available)
  const whisperFallbackRef = useRef(false);
  const whisperAudioContextRef = useRef<AudioContext | null>(null);
  const whisperSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const whisperProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const whisperChunksRef = useRef<Float32Array[]>([]);
  const whisperStreamRef = useRef<MediaStream | null>(null);
  const whisperSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whisperLastSoundRef = useRef<number>(0);

  // Deepgram TTS audio ref
  const dgAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsModeRef = useRef<'deepgram' | 'browser'>(ttsMode);

  // Keep refs in sync
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { modeRef.current = mode; localStorage.setItem(STORAGE_KEYS.mode, mode); }, [mode]);
  useEffect(() => { ttsModeRef.current = ttsMode; localStorage.setItem(STORAGE_KEYS.ttsMode, ttsMode); }, [ttsMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.dgVoice, dgVoice); }, [dgVoice]);
  useEffect(() => { finalTranscriptRef.current = finalTranscript; }, [finalTranscript]);
  useEffect(() => { interimTranscriptRef.current = interimTranscript; }, [interimTranscript]);

  // Persist messages
  useEffect(() => { saveMessages(messages); }, [messages]);

  // Persist settings
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.voiceName, selectedVoice); }, [selectedVoice]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.voiceRate, String(voiceRate)); }, [voiceRate]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.silenceTimeout, String(silenceTimeout)); }, [silenceTimeout]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent, interimTranscript]);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices() || [];
      setVoices(v);
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };

  // Load Deepgram voices
  }, []);
  useEffect(() => {
    fetch(VOICES_API).then(r => r.json()).then(data => {
      setDgVoices(data.voices || {});
    }).catch(() => {});
  }, []);

  // Chrome TTS keepalive
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if Web Speech API is available
  const hasSpeechRecognition = useCallback(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  // ── Stop everything ────────────────────────────────────────────────────
  const stopEverything = useCallback(() => {
    // Stop recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    recognitionActiveRef.current = false;

    // Stop TTS (both browser and Deepgram)
    window.speechSynthesis?.cancel();
    if (dgAudioRef.current) {
      dgAudioRef.current.pause();
      dgAudioRef.current.src = '';
      dgAudioRef.current = null;
    }

    // Stop PTT
    cleanupPTT();

    // Stop whisper fallback
    cleanupWhisperFallback();

    // Clear timers
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }

    // Abort streaming
    abortRef.current?.abort();

    isProcessingRef.current = false;
  }, []);

  const cleanupPTT = useCallback(() => {
    pttRecordingRef.current = false;
    if (pttTimerRef.current) { clearInterval(pttTimerRef.current); pttTimerRef.current = null; }
    try { pttProcessorRef.current?.disconnect(); } catch { /* */ }
    try { pttSourceRef.current?.disconnect(); } catch { /* */ }
    try { pttAudioContextRef.current?.close(); } catch { /* */ }
    pttAudioContextRef.current = null;
    if (pttStreamRef.current) { pttStreamRef.current.getTracks().forEach(t => t.stop()); pttStreamRef.current = null; }
    pttChunksRef.current = [];
    setPttTimer(0);
  }, []);

  const cleanupWhisperFallback = useCallback(() => {
    if (whisperSilenceTimerRef.current) { clearTimeout(whisperSilenceTimerRef.current); whisperSilenceTimerRef.current = null; }
    try { whisperProcessorRef.current?.disconnect(); } catch { /* */ }
    try { whisperSourceRef.current?.disconnect(); } catch { /* */ }
    try { whisperAudioContextRef.current?.close(); } catch { /* */ }
    whisperAudioContextRef.current = null;
    if (whisperStreamRef.current) { whisperStreamRef.current.getTracks().forEach(t => t.stop()); whisperStreamRef.current = null; }
    whisperChunksRef.current = [];
    whisperFallbackRef.current = false;
  }, []);

  // ── TTS ────────────────────────────────────────────────────────────────
  const speakWithBrowser = useCallback((text: string) => {
    if (!window.speechSynthesis) { finishSpeaking(); return; }
    window.speechSynthesis.cancel();

    const speechText = text.length > 1000
      ? text.substring(0, 1000) + '... Check the chat for the full response.'
      : text;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'en-US';
    utterance.rate = voiceRate;
    utterance.pitch = 1.0;

    const allVoices = window.speechSynthesis.getVoices();
    if (selectedVoice) {
      const found = allVoices.find(v => v.name === selectedVoice);
      if (found) utterance.voice = found;
    } else {
      const preferred = allVoices.find(v =>
        v.name.includes('Google') && v.name.includes('US') && v.lang.startsWith('en')
      ) || allVoices.find(v =>
        v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen')
      ) || allVoices.find(v => v.lang.startsWith('en') && v.localService);
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => finishSpeaking();
    utterance.onerror = () => finishSpeaking();

    setVoiceState('speaking');
    window.speechSynthesis.speak(utterance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice, voiceRate]);

  const speakWithDeepgram = useCallback(async (text: string) => {
    const speechText = text.length > 2000
      ? text.substring(0, 2000) + '. Check the chat for the full response.'
      : text;

    setVoiceState('speaking');
    try {
      const res = await fetch(TTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText, voice: dgVoice }),
      });
      if (!res.ok) throw new Error('TTS failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      dgAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        dgAudioRef.current = null;
        finishSpeaking();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        dgAudioRef.current = null;
        finishSpeaking();
      };

      await audio.play();
    } catch {
      // Fallback to browser TTS
      console.warn('Deepgram TTS failed, falling back to browser');
      speakWithBrowser(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dgVoice]);

  const speakText = useCallback((text: string) => {
    const clean = cleanTextForSpeech(text);
    if (!clean) { finishSpeaking(); return; }

    if (ttsModeRef.current === 'deepgram') {
      speakWithDeepgram(clean);
    } else {
      speakWithBrowser(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakWithDeepgram, speakWithBrowser]);

  const finishSpeaking = useCallback(() => {
    isProcessingRef.current = false;
    setVoiceState('idle');

    // Auto-restart listening in handsfree mode
    if (modeRef.current === 'handsfree') {
      setTimeout(() => {
        if (modeRef.current === 'handsfree' && voiceStateRef.current === 'idle' && !isProcessingRef.current) {
          startHandsfreeListening();
        }
      }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chat API ──────────────────────────────────────────────────────────
  const sendToAPI = useCallback(async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setVoiceState('thinking');
    setStreamContent('');
    setInterimTranscript('');
    setFinalTranscript('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      // Build API messages from updated
      sendRequest(updated);
      return updated;
    });

    async function sendRequest(allMessages: Message[]) {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const apiMessages = allMessages.slice(-20).map(m => ({
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

        if (!res.ok) throw new Error(`Error: ${res.status}`);

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
              } catch { /* skip */ }
            }
          }
        }

        if (fullContent) {
          // Filter out HEARTBEAT_OK and NO_REPLY
          const cleaned = fullContent.replace(/HEARTBEAT_OK/g, '').replace(/NO_REPLY/g, '').trim();
          if (cleaned) {
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: cleaned,
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setStreamContent('');
            speakText(cleaned);
          } else {
            setStreamContent('');
            isProcessingRef.current = false;
            setVoiceState('idle');
            if (modeRef.current === 'handsfree') {
              setTimeout(() => startHandsfreeListening(), 300);
            }
          }
        } else {
          setStreamContent('');
          isProcessingRef.current = false;
          setVoiceState('idle');
          if (modeRef.current === 'handsfree') {
            setTimeout(() => startHandsfreeListening(), 300);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          isProcessingRef.current = false;
          setVoiceState('idle');
          setStreamContent('');
          return;
        }

        // Fallback: non-streaming request
        try {
          const allMsgs = allMessages.slice(-20).map(m => ({ role: m.role, content: m.content }));
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
              messages: allMsgs,
            }),
          });

          if (syncRes.ok) {
            const data = await syncRes.json();
            const reply = (data.choices?.[0]?.message?.content || '')
              .replace(/HEARTBEAT_OK/g, '').replace(/NO_REPLY/g, '').trim();
            if (reply) {
              const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: reply,
                timestamp: Date.now(),
              };
              setMessages(prev => [...prev, assistantMessage]);
              setStreamContent('');
              speakText(reply);
              return;
            }
          }
          throw new Error('Fallback failed');
        } catch {
          const errorMsg: Message = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: '⚠️ Connection error. Try again in a sec.',
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMsg]);
          setStreamContent('');
          isProcessingRef.current = false;
          setVoiceState('idle');
          if (modeRef.current === 'handsfree') {
            setTimeout(() => startHandsfreeListening(), 500);
          }
        }
      } finally {
        abortRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakText]);

  // ── Hands-Free: Web Speech API (primary) or Whisper fallback ──────────
  const startHandsfreeListening = useCallback(() => {
    if (isProcessingRef.current || voiceStateRef.current === 'thinking' || voiceStateRef.current === 'speaking') return;

    if (hasSpeechRecognition()) {
      startWebSpeechListening();
    } else {
      startWhisperFallbackListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSpeechRecognition]);

  // Web Speech API listening
  const startWebSpeechListening = useCallback(() => {
    setVoiceError(null);
    if (recognitionActiveRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setFinalTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';

    recognition.onstart = () => {
      recognitionActiveRef.current = true;
      setVoiceState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      if (final) {
        setFinalTranscript(prev => {
          const newVal = (prev + ' ' + final).trim();
          finalTranscriptRef.current = newVal;
          return newVal;
        });
      }
      setInterimTranscript(interim);
      interimTranscriptRef.current = interim;

      // Reset silence timer on any speech
      const currentSilenceTimeout = parseFloat(localStorage.getItem(STORAGE_KEYS.silenceTimeout) || '2.0') * 1000;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
        if (text && !isProcessingRef.current) {
          stopWebSpeechListening();
          sendToAPI(text);
        }
      }, currentSilenceTimeout);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow mic access.');
        recognitionActiveRef.current = false;
        setVoiceState('idle');
        return;
      }
      if (event.error === 'no-speech') {
        // Normal - will auto-restart via onend
        return;
      }
      console.log('Speech recognition error:', event.error);
      recognitionActiveRef.current = false;
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      recognitionRef.current = null;

      // Auto-restart if still in handsfree and idle
      if (modeRef.current === 'handsfree' && voiceStateRef.current !== 'thinking' &&
          voiceStateRef.current !== 'speaking' && !isProcessingRef.current) {
        setVoiceState('idle');
        setTimeout(() => {
          if (modeRef.current === 'handsfree' && voiceStateRef.current === 'idle' && !isProcessingRef.current) {
            startWebSpeechListening();
          }
        }, 300);
      }
    };

    try {
      recognition.start();
    } catch {
      setVoiceError('Failed to start speech recognition.');
      setVoiceState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendToAPI]);

  const stopWebSpeechListening = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* */ }
      recognitionRef.current = null;
    }
    recognitionActiveRef.current = false;
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  // Whisper fallback listening (for browsers without Web Speech API)
  const startWhisperFallbackListening = useCallback(async () => {
    setVoiceError(null);
    whisperFallbackRef.current = true;

    try {
      if (whisperStreamRef.current) {
        whisperStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      whisperStreamRef.current = stream;

      whisperChunksRef.current = [];
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') await audioContext.resume();
      whisperAudioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      whisperSourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      whisperProcessorRef.current = processor;

      whisperLastSoundRef.current = Date.now();

      processor.onaudioprocess = (e) => {
        if (!whisperFallbackRef.current) return;
        const data = new Float32Array(e.inputBuffer.getChannelData(0));
        whisperChunksRef.current.push(data);

        // Check for sound (basic energy detection)
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);

        if (rms > 0.01) {
          whisperLastSoundRef.current = Date.now();
        }

        // Silence detection
        const currentSilenceTimeout = parseFloat(localStorage.getItem(STORAGE_KEYS.silenceTimeout) || '2.0') * 1000;
        if (Date.now() - whisperLastSoundRef.current > currentSilenceTimeout && whisperChunksRef.current.length > 10) {
          // Silence detected — transcribe what we have
          const chunks = [...whisperChunksRef.current];
          whisperChunksRef.current = [];
          whisperLastSoundRef.current = Date.now();

          const sr = whisperAudioContextRef.current?.sampleRate || 16000;
          const wavBlob = encodeWav(chunks, sr);
          if (wavBlob.size > 5000) {
            whisperTranscribeAndSend(wavBlob);
          }
        }
      };

      source.connect(processor);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      silentGain.connect(audioContext.destination);
      processor.connect(silentGain);

      setVoiceState('listening');
    } catch (err) {
      console.error('Whisper fallback mic error:', err);
      setVoiceError('Mic access error. Please allow microphone.');
      setVoiceState('idle');
      whisperFallbackRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const whisperTranscribeAndSend = useCallback(async (wavBlob: Blob) => {
    if (isProcessingRef.current) return;
    cleanupWhisperFallback();

    try {
      setVoiceState('thinking');
      isProcessingRef.current = true;

      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      const resp = await fetch(TRANSCRIBE_API, { method: 'POST', body: formData });
      if (!resp.ok) throw new Error('Transcription failed');
      const data = await resp.json();
      const transcript = (data.transcript || '').trim();

      if (!transcript || transcript === '[BLANK_AUDIO]' || transcript.length < 2) {
        isProcessingRef.current = false;
        setVoiceState('idle');
        if (modeRef.current === 'handsfree') setTimeout(() => startHandsfreeListening(), 300);
        return;
      }

      await sendToAPI(transcript);
    } catch (err) {
      console.error('Whisper transcription error:', err);
      isProcessingRef.current = false;
      setVoiceState('idle');
      if (modeRef.current === 'handsfree') setTimeout(() => startHandsfreeListening(), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendToAPI, cleanupWhisperFallback]);

  // ── Push-to-Talk ──────────────────────────────────────────────────────
  const startPTTRecording = useCallback(async () => {
    setVoiceError(null);
    try {
      if (pttStreamRef.current) {
        pttStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      pttStreamRef.current = stream;
      pttChunksRef.current = [];

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') await audioContext.resume();
      pttAudioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      pttSourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      pttProcessorRef.current = processor;
      pttRecordingRef.current = true;

      processor.onaudioprocess = (e) => {
        if (!pttRecordingRef.current) return;
        pttChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      source.connect(processor);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      silentGain.connect(audioContext.destination);
      processor.connect(silentGain);

      pttStartTimeRef.current = Date.now();
      setPttTimer(0);
      pttTimerRef.current = setInterval(() => {
        setPttTimer(Date.now() - pttStartTimeRef.current);
      }, 100);

      setVoiceState('recording');
    } catch (err) {
      console.error('PTT mic error:', err);
      setVoiceError('Mic access error. Please allow microphone.');
      setVoiceState('idle');
    }
  }, []);

  const stopPTTRecording = useCallback(async () => {
    pttRecordingRef.current = false;
    if (pttTimerRef.current) { clearInterval(pttTimerRef.current); pttTimerRef.current = null; }
    setPttTimer(0);

    if (!pttAudioContextRef.current || pttChunksRef.current.length === 0) {
      cleanupPTT();
      setVoiceState('idle');
      return;
    }

    const sampleRate = pttAudioContextRef.current.sampleRate;
    const wavBlob = encodeWav(pttChunksRef.current, sampleRate);
    cleanupPTT();

    // Transcribe with Whisper
    setVoiceState('thinking');
    isProcessingRef.current = true;

    try {
      if (wavBlob.size < 5000) {
        setVoiceError('Recording too short — hold a moment while speaking.');
        isProcessingRef.current = false;
        setVoiceState('idle');
        return;
      }

      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      const resp = await fetch(TRANSCRIBE_API, { method: 'POST', body: formData });
      if (!resp.ok) throw new Error('Transcription failed: ' + resp.status);
      const data = await resp.json();
      const transcript = (data.transcript || '').trim();

      if (!transcript || transcript === '[BLANK_AUDIO]' || transcript.length < 2) {
        setVoiceError('No speech detected. Try again.');
        isProcessingRef.current = false;
        setVoiceState('idle');
        return;
      }

      await sendToAPI(transcript);
    } catch (err) {
      console.error('PTT transcription error:', err);
      setVoiceError('Transcription failed. Try again.');
      isProcessingRef.current = false;
      setVoiceState('idle');
    }
  }, [cleanupPTT, sendToAPI]);

  // ── Mic button handler ────────────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    // Interrupt TTS if speaking
    if (voiceState === 'speaking') {
      window.speechSynthesis?.cancel();
      if (dgAudioRef.current) { dgAudioRef.current.pause(); dgAudioRef.current.src = ''; dgAudioRef.current = null; }
      isProcessingRef.current = false;
      setVoiceState('idle');
      if (mode === 'handsfree') {
        setTimeout(() => startHandsfreeListening(), 300);
      }
      return;
    }

    // Can't interrupt thinking
    if (voiceState === 'thinking') return;

    if (mode === 'handsfree') {
      if (voiceState === 'listening') {
        // If there's pending text, send it
        const text = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
        if (text && !isProcessingRef.current) {
          stopWebSpeechListening();
          cleanupWhisperFallback();
          sendToAPI(text);
        } else {
          // Stop listening
          stopWebSpeechListening();
          cleanupWhisperFallback();
          setVoiceState('idle');
        }
      } else {
        startHandsfreeListening();
      }
    } else {
      // PTT mode
      if (voiceState === 'recording') {
        stopPTTRecording();
      } else {
        startPTTRecording();
      }
    }
  }, [voiceState, mode, startHandsfreeListening, stopWebSpeechListening, cleanupWhisperFallback, sendToAPI, startPTTRecording, stopPTTRecording]);

  // ── Mode switch ───────────────────────────────────────────────────────
  const switchMode = useCallback((newMode: VoiceMode) => {
    stopEverything();
    setMode(newMode);
    setVoiceState('idle');
    setInterimTranscript('');
    setFinalTranscript('');
    setPttTimer(0);
  }, [stopEverything]);

  // ── Send text input ───────────────────────────────────────────────────
  const handleSendText = useCallback(() => {
    const text = input.trim();
    if (!text || isProcessingRef.current) return;
    setInput('');

    // Stop any listening
    stopWebSpeechListening();
    cleanupWhisperFallback();

    sendToAPI(text);
  }, [input, sendToAPI, stopWebSpeechListening, cleanupWhisperFallback]);

  // ── Stop streaming ────────────────────────────────────────────────────
  const handleStopStreaming = useCallback(() => {
    abortRef.current?.abort();
    if (streamContent) {
      const msg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: streamContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    }
    setStreamContent('');
    isProcessingRef.current = false;
    setVoiceState('idle');
  }, [streamContent]);

  // ── Clear history ─────────────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.history);
  }, []);

  // ── Live transcript display ───────────────────────────────────────────
  const liveText = (finalTranscript + ' ' + interimTranscript).trim();

  // ── Mic button styling ────────────────────────────────────────────────
  const micButtonClasses = (() => {
    const base = 'relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-200 border-4 ';
    switch (voiceState) {
      case 'listening':
        return base + 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse';
      case 'recording':
        return base + 'border-red-500 bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-105';
      case 'thinking':
        return base + 'border-amber-400 bg-amber-400/10 shadow-[0_0_25px_rgba(245,158,11,0.3)]';
      case 'speaking':
        return base + 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_25px_rgba(34,211,238,0.3)]';
      default:
        return base + 'border-neon-green bg-neon-green/5 shadow-[0_0_15px_rgba(0,255,136,0.15)] hover:shadow-[0_0_25px_rgba(0,255,136,0.25)] hover:bg-neon-green/10';
    }
  })();

  const micIconColor = (() => {
    switch (voiceState) {
      case 'listening': return 'text-red-400';
      case 'recording': return 'text-red-300';
      case 'thinking': return 'text-amber-400';
      case 'speaking': return 'text-cyan-400';
      default: return 'text-neon-green';
    }
  })();

  const stateLabel = (() => {
    switch (voiceState) {
      case 'listening': return 'Listening...';
      case 'recording': return 'Recording — tap to send';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking — tap to skip';
      default:
        return mode === 'handsfree' ? 'Tap to start listening' : 'Tap to record';
    }
  })();

  const statusDotColor = (() => {
    switch (voiceState) {
      case 'listening':
      case 'recording':
        return 'bg-red-400';
      case 'thinking': return 'bg-amber-400';
      case 'speaking': return 'bg-cyan-400';
      default: return 'bg-neon-green';
    }
  })();

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 glass shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
            <Mic className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Koda Voice</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${statusDotColor} animate-pulse`} />
              {voiceState === 'idle' ? 'Ready' : stateLabel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-2 rounded-lg transition-all ${settingsOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={clearHistory}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-all"
            title="Clear history"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="px-4 sm:px-6 py-3 border-b border-white/5 bg-dark-800/80 space-y-3 shrink-0">
          {/* TTS Engine Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wider">TTS Engine</label>
            <div className="flex bg-dark-700 rounded-full p-0.5 border border-white/5">
              <button
                onClick={() => setTtsMode('deepgram')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  ttsMode === 'deepgram'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🎧 Deepgram
              </button>
              <button
                onClick={() => setTtsMode('browser')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  ttsMode === 'browser'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔊 Browser
              </button>
            </div>
          </div>

          {/* Deepgram Voice (when Deepgram TTS selected) */}
          {ttsMode === 'deepgram' && (
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Voice</label>
              <select
                value={dgVoice}
                onChange={e => setDgVoice(e.target.value)}
                className="bg-dark-700 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white max-w-[60%] focus:outline-none focus:border-cyan-500/50"
              >
                {Object.entries(dgVoices).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Browser Voice (when browser TTS selected) */}
          {ttsMode === 'browser' && (
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Voice</label>
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="bg-dark-700 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white max-w-[60%] focus:outline-none focus:border-neon-green/50"
              >
                <option value="">Auto</option>
                {voices
                  .sort((a, b) => {
                    const aEn = a.lang.startsWith('en') ? 0 : 1;
                    const bEn = b.lang.startsWith('en') ? 0 : 1;
                    return aEn - bEn || a.name.localeCompare(b.name);
                  })
                  .map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
              </select>
            </div>
          )}

          {/* Speed (browser TTS only) */}
          {ttsMode === 'browser' && (
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Speed</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min="0.7" max="1.5" step="0.1"
                  value={voiceRate}
                  onChange={e => setVoiceRate(parseFloat(e.target.value))}
                  className="w-24 accent-neon-green"
                />
                <span className="text-xs text-white w-8 text-center">{voiceRate}x</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Silence Timeout</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min="1" max="5" step="0.5"
                value={silenceTimeout}
                onChange={e => setSilenceTimeout(parseFloat(e.target.value))}
                className="w-24 accent-neon-green"
              />
              <span className="text-xs text-white w-8 text-center">{silenceTimeout}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {voiceError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center justify-between shrink-0">
          <span>{voiceError}</span>
          <button onClick={() => setVoiceError(null)} className="ml-2 hover:text-red-300">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && !streamContent ? (
          <div className="text-center text-gray-500 py-12">
            <span className="text-5xl block mb-4">🎙️</span>
            <p className="font-medium text-gray-300 text-lg">Koda Voice</p>
            <p className="text-sm mt-2 text-gray-500">
              {mode === 'handsfree'
                ? 'Tap the mic to start — just speak naturally.'
                : 'Tap and hold the mic to record, then release to send.'}
            </p>
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
                    ? 'bg-neon-green/15 text-neon-green border border-neon-green/25'
                    : 'bg-dark-600/80 text-gray-200 border border-white/5'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className="text-[10px] opacity-40 mt-1">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))
        )}

        {/* Streaming indicator */}
        {streamContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-dark-600/80 text-gray-200 border border-cyan-500/20">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {streamContent}
                <span className="inline-block w-2 h-4 bg-cyan-400/60 animate-pulse ml-0.5" />
              </p>
            </div>
          </div>
        )}

        {/* Live transcript preview */}
        {liveText && voiceState === 'listening' && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-neon-green/5 text-neon-green/50 border border-neon-green/15 border-dashed">
              <p className="text-sm italic">💬 {liveText}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Controls Area */}
      <div className="border-t border-white/5 bg-dark-800/50 shrink-0">
        {/* Mode Toggle */}
        <div className="flex justify-center pt-3 px-4">
          <div className="flex bg-dark-700 rounded-full p-1 border border-white/5">
            <button
              onClick={() => switchMode('handsfree')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                mode === 'handsfree'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎙️ Hands-Free
            </button>
            <button
              onClick={() => switchMode('ptt')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                mode === 'ptt'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👆 Push-to-Talk
            </button>
          </div>
        </div>

        {/* PTT Timer */}
        {voiceState === 'recording' && pttTimer > 0 && (
          <div className="text-center pt-2">
            <span className="text-xl font-light text-red-400 tabular-nums">{formatTimer(pttTimer)}</span>
          </div>
        )}

        {/* Mic Button */}
        <div className="flex flex-col items-center py-4 gap-2">
          <button
            onClick={handleMicClick}
            onTouchEnd={(e) => { e.preventDefault(); handleMicClick(); }}
            disabled={voiceState === 'thinking'}
            className={micButtonClasses}
            style={voiceState === 'thinking' ? { animation: 'pulse 1s ease-in-out infinite' } : undefined}
          >
            {voiceState === 'speaking' ? (
              <Volume2 className={`w-10 h-10 sm:w-12 sm:h-12 ${micIconColor}`} />
            ) : voiceState === 'thinking' ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              </div>
            ) : voiceState === 'recording' ? (
              <Square className={`w-8 h-8 sm:w-10 sm:h-10 ${micIconColor} fill-current`} />
            ) : voiceState === 'listening' ? (
              <MicOff className={`w-10 h-10 sm:w-12 sm:h-12 ${micIconColor}`} />
            ) : (
              <Mic className={`w-10 h-10 sm:w-12 sm:h-12 ${micIconColor}`} />
            )}

            {/* Ripple effect for listening */}
            {(voiceState === 'listening' || voiceState === 'recording') && (
              <span className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
            )}
          </button>
          <span className="text-xs text-gray-500">{stateLabel}</span>
        </div>

        {/* Text Input Fallback */}
        <div className="px-4 pb-4 pb-safe">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendText()}
              placeholder="Or type here..."
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors text-sm"
              disabled={voiceState === 'thinking'}
            />
            {voiceState === 'thinking' ? (
              <button
                onClick={handleStopStreaming}
                className="px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                title="Stop"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSendText}
                disabled={!input.trim()}
                className="px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20 transition-all"
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
