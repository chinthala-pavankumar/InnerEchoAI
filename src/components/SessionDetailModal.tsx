import React from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Tag, 
  MessageSquare,
  Shield
} from 'lucide-react';
import { JournalSession } from '../types/journal';
import { getMoodConfig, formatJournalDate } from '../utils/moodUtils';

interface SessionDetailModalProps {
  session: JournalSession | null;
  onClose: () => void;
  onOpenSessionInWorkspace: (sessionId: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onOpenSessionInWorkspace,
}) => {
  if (!session) return null;

  const moodConfig = getMoodConfig(session.metadata.dominantMood);
  const formattedDate = formatJournalDate(session.metadata.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#101017] rounded-3xl max-w-lg w-full border border-white/[0.12] shadow-2xl shadow-black/80 overflow-hidden animate-scale-up">
        {/* Banner */}
        <div className={`p-6 bg-gradient-to-br ${moodConfig.gradientClass} border-b border-white/[0.08] relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium border bg-black/50 backdrop-blur-md ${moodConfig.borderClass} ${moodConfig.textClass}`}
            >
              <span>{moodConfig.emoji}</span>
              <span>{moodConfig.label}</span>
            </span>

            <span className="text-xs text-[#9494a0] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>

          <h2 className="font-serif text-2xl font-normal text-white">
            {session.metadata.title}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {session.metadata.summary ? (
            <div>
              <h3 className="text-xs font-semibold text-[#6e6e7c] uppercase tracking-wider mb-2">
                Session Reflection Summary
              </h3>
              <p className="p-4 rounded-2xl bg-[#161622]/80 border border-white/[0.08] text-sm text-[#e2e2e7] font-sans leading-relaxed">
                {session.metadata.summary}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#161622]/50 border border-white/[0.06] text-xs text-[#9494a0]">
              This session has not been synthesized with auto-summary yet.
            </div>
          )}

          {/* Tags */}
          {session.metadata.tags && session.metadata.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#6e6e7c] uppercase tracking-wider mb-2">
                Identified Themes
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {session.metadata.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#161622] text-[#c4c4d0] border border-white/[0.08] font-mono text-[11px]"
                  >
                    <Tag className="w-3 h-3 text-indigo-400 opacity-80" />
                    <span>#{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#9494a0] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onOpenSessionInWorkspace(session.id);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium shadow-md shadow-indigo-500/20 border border-indigo-400/20 transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open in Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
