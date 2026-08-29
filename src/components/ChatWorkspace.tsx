import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Menu, 
  Bot, 
  User as UserIcon, 
  AlertCircle,
  Clock,
  ShieldCheck,
  Mic,
  MicOff,
  Square,
  Radio
} from 'lucide-react';
import { JournalMessage, JournalSession } from '../types/journal';
import { getMoodConfig, formatJournalDate } from '../utils/moodUtils';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface ChatWorkspaceProps {
  session: JournalSession | null;
  messages: JournalMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onEndAndSummarize: () => Promise<void>;
  onOpenMobileSidebar: () => void;
  isAiGenerating: boolean;
  isSummarizing: boolean;
  error: string | null;
  onClearError: () => void;
}

const GUIDED_STARTERS = [
  "What is one feeling taking up space in your chest or mind today?",
  "How did today treat your energy levels, and what drained you most?",
  "Is there a conversation or situation you are replaying in your thoughts?",
  "What is something you felt proud of today, even if tiny?",
  "Describe a boundary you struggled to keep or wish you had set.",
];

const EMOTIONAL_QUICK_CHIPS = [
  { label: 'Grateful', emoji: '☀️', prompt: "I'm feeling really grateful today for " },
  { label: 'Overwhelmed', emoji: '🌊', prompt: "I feel completely overwhelmed by " },
  { label: 'Anxious', emoji: '🌪️', prompt: "I have this persistent anxious feeling about " },
  { label: 'Peaceful', emoji: '🌿', prompt: "I feel unusually calm and centered because " },
  { label: 'Vulnerable', emoji: '🌧️', prompt: "It's hard to admit, but I've been feeling sad about " },
];

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  session,
  messages,
  onSendMessage,
  onEndAndSummarize,
  onOpenMobileSidebar,
  isAiGenerating,
  isSummarizing,
  error,
  onClearError,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Speech-to-text hook
  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechSupported,
    error: speechError,
    toggleListening,
    stopListening,
    clearError: clearSpeechError,
  } = useSpeechToText({
    onTranscriptChange: (newFullText) => {
      setInputText(newFullText);
    },
  });

  // Auto-scroll to bottom on messages update or generation state
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiGenerating, isListening]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText, interimTranscript]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening) {
      stopListening();
    }

    const textToSend = (inputText + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
    if (!textToSend || isAiGenerating || isSummarizing) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(textToSend);
    } catch {
      // Error handled by parent state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (speechError) clearSpeechError();
    toggleListening(inputText);
  };

  const moodConfig = getMoodConfig(session?.metadata?.dominantMood);

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0a0a0c] overflow-hidden relative">
      {/* Workspace Header */}
      <header className="h-16 px-4 sm:px-6 bg-[#0e0e13]/90 backdrop-blur-2xl border-b border-white/[0.08] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-[#9494a0] hover:bg-white/[0.08] hover:text-white cursor-pointer"
            title="Open Sessions Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-sm sm:text-base font-semibold text-white truncate">
                {session?.metadata?.title || 'Active Journal Reflection'}
              </h1>
              {session?.metadata?.dominantMood && (
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${moodConfig.bgClass}`}
                >
                  <span>{moodConfig.emoji}</span>
                  <span>{moodConfig.label}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#6e6e7c]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {session?.metadata?.createdAt ? formatJournalDate(session.metadata.createdAt) : 'In progress'}
              </span>
              <span>•</span>
              <span>{messages.length} exchanges</span>
              {session?.metadata?.status === 'summarized' && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Summarized</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* End & Summarize Session Button */}
        <div className="flex items-center gap-2">
          <button
            id="end-summarize-button"
            onClick={onEndAndSummarize}
            disabled={messages.length === 0 || isSummarizing || isAiGenerating}
            title={messages.length === 0 ? 'Add at least one exchange to summarize' : 'Synthesize and close session'}
            className="group relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-medium shadow-lg shadow-indigo-500/20 border border-indigo-400/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {isSummarizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Synthesizing Reflection...</span>
                <span className="sm:hidden">Closing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                <span className="font-sans">End &amp; Summarize Session</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Error Banners */}
      {error && (
        <div className="px-6 py-2.5 bg-rose-950/60 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-xs text-rose-400 hover:underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {speechError && (
        <div className="px-6 py-2.5 bg-amber-950/60 border-b border-amber-800 text-amber-200 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={clearSpeechError}
            className="text-xs text-amber-400 hover:underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl mx-auto w-full">
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="my-8 text-center max-w-xl mx-auto space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#14141c]/90 border border-white/[0.08] shadow-lg shadow-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>

            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                What is weighing on your heart today?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#9494a0] leading-relaxed font-sans">
                This is your private, judgment-free emotional sanctuary. Express whatever is on your mind through text or voice. InnerEcho will listen and ask reflective questions below each of your entries.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="space-y-2 text-left">
              <p className="text-[11px] font-semibold text-[#6e6e7c] uppercase tracking-wider text-center">
                Reflective Inquiries to Begin
              </p>
              <div className="grid grid-cols-1 gap-2">
                {GUIDED_STARTERS.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(starter);
                      textareaRef.current?.focus();
                    }}
                    className="p-3.5 rounded-xl bg-[#13131a]/80 backdrop-blur-xl border border-white/[0.08] text-xs text-[#d1d1db] hover:border-indigo-500/50 hover:bg-[#181824]/90 transition-all text-left shadow-xs flex items-center justify-between group cursor-pointer"
                  >
                    <span>&ldquo;{starter}&rdquo;</span>
                    <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      Use prompt →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream: Strict sequential rendering where answers appear directly below each entry */}
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-indigo-500/25 border border-white/10">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-xs shadow-md shadow-indigo-950/40 font-sans'
                    : 'bg-[#13131a]/95 backdrop-blur-xl text-[#e2e2e7] border border-white/[0.08] rounded-tl-xs shadow-xs font-sans'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/[0.08] text-[10px]">
                  <span className={`font-semibold ${isUser ? 'text-indigo-200' : 'text-indigo-400'}`}>
                    {isUser ? 'Your Journal Reflection' : 'InnerEcho Response'}
                  </span>
                  <span className={isUser ? 'text-indigo-200/70' : 'text-[#6e6e7c]'}>
                    {formatJournalDate(msg.timestamp)}
                  </span>
                </div>

                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live AI Generation / Thinking Indicator: Rendered immediately below the user's latest question */}
        {isAiGenerating && (
          <div className="flex items-start gap-3 justify-start animate-fade-in w-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-indigo-500/25 border border-white/10">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>

            <div className="bg-[#13131a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-3 text-xs text-[#9494a0] max-w-[85%]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[#c4c4d2] font-serif italic">Reflecting on what you shared... answering below</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <footer className="p-4 sm:p-5 bg-[#0e0e13]/95 backdrop-blur-2xl border-t border-white/[0.08] shrink-0">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Active Voice Recording Status Banner */}
          {isListening && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs animate-pulse">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-medium">Listening to your voice... Speak freely.</span>
                {interimTranscript && (
                  <span className="italic text-rose-300/80 max-w-xs truncate hidden sm:inline">
                    &ldquo;{interimTranscript}&rdquo;
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-rose-300" />
                <span>Done</span>
              </button>
            </div>
          )}

          {/* Quick Emotion Starter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] text-[#6e6e7c] whitespace-nowrap mr-1">Quick feeling:</span>
            {EMOTIONAL_QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev ? `${prev} ${chip.prompt}` : chip.prompt);
                  textareaRef.current?.focus();
                }}
                className="px-2.5 py-1 rounded-full bg-[#161620]/90 hover:bg-[#20202e] text-[#c4c4d0] hover:text-white text-[11px] flex items-center gap-1 whitespace-nowrap transition-colors border border-white/[0.06] hover:border-indigo-500/40 cursor-pointer"
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Form with Speech to text mic button and Send button */}
          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            <div className={`flex-1 relative bg-[#14141c]/90 rounded-2xl border transition-all ${
              isListening 
                ? 'border-rose-500/50 ring-1 ring-rose-500/30' 
                : 'border-white/[0.1] focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/25'
            }`}>
              <textarea
                ref={textareaRef}
                id="journal-input-textarea"
                rows={1}
                value={inputText + (interimTranscript ? (inputText ? ` ${interimTranscript}` : interimTranscript) : '')}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening... Speak your reflection..." : "Pour out your thoughts, emotions, or daily reflections..."}
                disabled={isAiGenerating || isSummarizing}
                className="w-full px-4 py-3 text-sm bg-transparent resize-none text-[#f1f1f5] placeholder-[#626270] focus:outline-hidden max-h-40 font-sans"
              />
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              id="voice-input-button"
              onClick={handleMicClick}
              disabled={isAiGenerating || isSummarizing}
              title={
                !isSpeechSupported
                  ? 'Speech-to-Text not supported in this browser'
                  : isListening
                  ? 'Stop Voice Input'
                  : 'Speak reflection (Speech-to-Text)'
              }
              className={`p-3 rounded-2xl border transition-all shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30 animate-pulse'
                  : isSpeechSupported
                  ? 'bg-[#161622] hover:bg-[#202030] text-[#c4c4d0] hover:text-white border-white/[0.1] hover:border-indigo-500/40'
                  : 'bg-[#14141c] text-[#555562] border-white/[0.05] cursor-not-allowed opacity-50'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Send Button */}
            <button
              id="send-message-button"
              type="submit"
              disabled={(!inputText.trim() && !interimTranscript.trim()) || isAiGenerating || isSummarizing}
              className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 active:scale-95 shrink-0 cursor-pointer border border-indigo-400/20"
              title="Send Reflection (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-[#6e6e7c] px-1">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Private session • Speech-to-Text enabled</span>
            </div>
            <span>Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] text-[#a1a1aa]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] text-[#a1a1aa]">Shift+Enter</kbd> for newline</span>
          </div>
        </div>
      </footer>
    </main>
  );
};
