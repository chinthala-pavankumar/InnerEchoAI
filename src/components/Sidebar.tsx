import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  LogOut, 
  Sparkles, 
  Calendar, 
  Tag, 
  MessageSquare, 
  ChevronRight,
  Shield
} from 'lucide-react';
import { JournalSession } from '../types/journal';
import { getMoodConfig, formatJournalDate } from '../utils/moodUtils';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  sessions: JournalSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onOpenDetailModal: (session: JournalSession) => void;
  isCreating: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenDetailModal,
  isCreating,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);

  // Filtered session list
  const filteredSessions = sessions.filter((session) => {
    const titleMatch = (session.metadata.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const tagMatch = session.metadata.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const moodMatch = !selectedMoodFilter || (session.metadata.dominantMood || '').toLowerCase() === selectedMoodFilter.toLowerCase();
    return (titleMatch || tagMatch) && moodMatch;
  });

  // Extract unique moods for quick filter
  const uniqueMoods = Array.from(
    new Set(sessions.map((s) => s.metadata.dominantMood).filter(Boolean))
  ) as string[];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-80 sm:w-88 bg-[#0e0e13]/95 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-serif text-sm font-bold shadow-md shadow-indigo-500/20 border border-white/10">
              IE
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold leading-tight text-white">
                InnerEcho
              </h2>
              <span className="text-[11px] text-[#9494a0]">Emotional Sanctuary</span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#9494a0] hover:bg-white/[0.08] hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Action: New Session Button */}
        <div className="p-3">
          <button
            id="new-session-button"
            onClick={() => {
              onNewSession();
              onCloseMobile();
            }}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 border border-indigo-400/20 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>New Journal Session</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-3 pb-2 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e7c]" />
            <input
              type="text"
              placeholder="Search sessions or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-[#14141c]/90 border border-white/[0.08] rounded-lg text-[#e2e2e7] placeholder-[#6e6e7c] focus:outline-hidden focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6e6e7c] hover:text-[#e2e2e7]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mood quick filter pills */}
          {uniqueMoods.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                onClick={() => setSelectedMoodFilter(null)}
                className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                  selectedMoodFilter === null
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'bg-[#181822]/80 text-[#9494a0] hover:bg-[#20202e] hover:text-[#e2e2e7] border border-white/[0.04]'
                }`}
              >
                All ({sessions.length})
              </button>
              {uniqueMoods.map((mood) => {
                const config = getMoodConfig(mood);
                const isSelected = selectedMoodFilter?.toLowerCase() === mood.toLowerCase();
                return (
                  <button
                    key={mood}
                    onClick={() => setSelectedMoodFilter(isSelected ? null : mood)}
                    className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-medium shadow-xs'
                        : `${config.bgClass} hover:opacity-90`
                    }`}
                  >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sessions History List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          <div className="flex items-center justify-between px-1 text-[11px] font-medium text-[#6e6e7c] uppercase tracking-wider">
            <span>Past Reflections</span>
            <span>{filteredSessions.length}</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-[#6e6e7c] text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40 text-indigo-400" />
              <p>{sessions.length === 0 ? 'No journaling sessions yet.' : 'No sessions match your filter.'}</p>
              {sessions.length === 0 && (
                <p className="mt-1 text-[11px] text-[#555562]">Click &ldquo;New Journal Session&rdquo; above to begin your first reflection.</p>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const moodConfig = getMoodConfig(session.metadata.dominantMood);
              const formattedDate = formatJournalDate(session.metadata.createdAt);
              const hasSummary = Boolean(session.metadata.summary);

              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-950/40 to-violet-950/20 border-indigo-500/40 shadow-xs'
                      : 'bg-[#13131a]/60 border-white/[0.06] hover:bg-[#181824]/80 hover:border-white/[0.12]'
                  }`}
                >
                  {/* Top Row: Mood Badge & Date */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${moodConfig.bgClass}`}
                    >
                      <span>{moodConfig.emoji}</span>
                      <span className="truncate max-w-[80px]">{moodConfig.label}</span>
                    </span>

                    <span className="text-[11px] text-[#6e6e7c] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-semibold text-[#e2e2e7] line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {session.metadata.title}
                  </h4>

                  {/* Optional Summary Teaser or Tag chips */}
                  {session.metadata.summary ? (
                    <p className="text-[11px] text-[#9494a0] line-clamp-2 mt-1 font-light leading-relaxed">
                      {session.metadata.summary}
                    </p>
                  ) : null}

                  {/* Tags */}
                  {session.metadata.tags && session.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.metadata.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.05] text-[#a1a1aa] border border-white/[0.06]"
                        >
                          <Tag className="w-2.5 h-2.5 opacity-60" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons (Detail & Delete) */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasSummary && (
                      <button
                        title="View Summary Card"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetailModal(session);
                        }}
                        className="p-1 rounded-md text-[#9494a0] hover:text-indigo-400 hover:bg-white/[0.08]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      title="Delete Session"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="p-1 rounded-md text-[#9494a0] hover:text-rose-400 hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0c0c10]/90">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-white/[0.12] object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-semibold text-white shrink-0 shadow-xs">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-xs font-medium text-[#e2e2e7] truncate">
                  {user?.displayName || 'Private Journaler'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Encrypted Path</span>
                </div>
              </div>
            </div>

            <button
              id="logout-button"
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-[#9494a0] hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
