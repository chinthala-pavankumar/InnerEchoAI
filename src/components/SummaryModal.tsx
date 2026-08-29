import React from 'react';
import { 
  Sparkles, 
  Check, 
  Tag, 
  Plus, 
  X,
  Heart,
  Calendar,
  Share2
} from 'lucide-react';
import { SessionSummaryResult } from '../types/journal';
import { getMoodConfig } from '../utils/moodUtils';

interface SummaryModalProps {
  summary: SessionSummaryResult;
  onClose: () => void;
  onStartNewSession: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  summary,
  onClose,
  onStartNewSession,
}) => {
  const moodConfig = getMoodConfig(summary.dominantMood);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#101017] rounded-3xl max-w-lg w-full border border-white/[0.12] shadow-2xl shadow-black/80 overflow-hidden animate-scale-up">
        {/* Header gradient banner */}
        <div className={`p-6 bg-gradient-to-br ${moodConfig.gradientClass} border-b border-white/[0.08] relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Session Closure Synthesis</span>
          </div>

          <h2 className="font-serif text-2xl font-normal text-white">
            {summary.title}
          </h2>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border bg-black/50 backdrop-blur-md ${moodConfig.borderClass} ${moodConfig.textClass}`}
            >
              <span className="text-base">{moodConfig.emoji}</span>
              <span>Dominant Mood: {summary.dominantMood}</span>
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Compassionate Summary */}
          <div>
            <h3 className="text-xs font-semibold text-[#6e6e7c] uppercase tracking-wider mb-2">
              Emotional Arc &amp; Synthesis
            </h3>
            <div className="p-4 rounded-2xl bg-[#161622]/80 border border-white/[0.08] text-sm text-[#e2e2e7] font-sans leading-relaxed">
              {summary.summary}
            </div>
          </div>

          {/* Key Themes / Tags */}
          <div>
            <h3 className="text-xs font-semibold text-[#6e6e7c] uppercase tracking-wider mb-2">
              Thematic Insights
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {summary.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#161622] text-[#c4c4d0] border border-white/[0.08] font-mono text-[11px]"
                >
                  <Tag className="w-3 h-3 text-indigo-400" />
                  <span>#{tag}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 text-xs text-[#9494a0] flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Saved permanently to your private Firestore vault</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onStartNewSession();
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start Fresh Session</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[#e2e2e7] border border-white/[0.08] text-sm font-medium transition-colors cursor-pointer"
          >
            View Chat
          </button>
        </div>
      </div>
    </div>
  );
};
