import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { SummaryModal } from './components/SummaryModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { JournalMessage, JournalSession, SessionSummaryResult } from './types/journal';
import {
  subscribeSessions,
  subscribeMessages,
  createNewSession,
  addSessionMessage,
  updateSessionWithSummary,
  deleteJournalSession,
} from './services/firestoreService';
import { sendChatToGemini, summarizeSessionWithGemini } from './services/geminiService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeSummaryModal, setActiveSummaryModal] = useState<SessionSummaryResult | null>(null);
  const [detailModalSession, setDetailModalSession] = useState<JournalSession | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Subscribe to User Sessions (Real-time Firestore onSnapshot)
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeSessions(
      user.uid,
      (fetchedSessions) => {
        setSessions(fetchedSessions);
        // If no active session is selected and sessions exist, default to most recent
        setActiveSessionId((prev) => {
          if (prev && fetchedSessions.some((s) => s.id === prev)) {
            return prev;
          }
          return fetchedSessions.length > 0 ? fetchedSessions[0].id : null;
        });
      },
      (err) => {
        console.error('Failed to subscribe to sessions:', err);
        setError('Error syncing journaling sessions. Please check network connectivity.');
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Subscribe to Active Session Messages (Real-time Firestore onSnapshot)
  useEffect(() => {
    if (!user?.uid || !activeSessionId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeMessages(
      user.uid,
      activeSessionId,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
      },
      (err) => {
        console.error('Failed to subscribe to messages:', err);
        setError('Error syncing session messages.');
      }
    );

    return () => unsubscribe();
  }, [user?.uid, activeSessionId]);

  // Handle New Session Creation
  const handleCreateNewSession = useCallback(async () => {
    if (!user?.uid || isCreatingSession) return;
    setIsCreatingSession(true);
    setError(null);
    try {
      const newId = await createNewSession(user.uid, `Reflection • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
      setActiveSessionId(newId);
    } catch (err: any) {
      console.error('Failed to create new session:', err);
      setError(err.message || 'Could not start new session.');
    } finally {
      setIsCreatingSession(false);
    }
  }, [user?.uid, isCreatingSession]);

  // If authenticated user has 0 sessions on initial load, create one automatically
  useEffect(() => {
    if (user?.uid && sessions.length === 0 && !activeSessionId && !isCreatingSession) {
      handleCreateNewSession();
    }
  }, [user?.uid, sessions.length, activeSessionId, isCreatingSession, handleCreateNewSession]);

  // Handle Sending a Message in Multi-Turn Chat
  const handleSendMessage = async (text: string) => {
    if (!user?.uid || !text.trim()) return;
    let currentSessionId = activeSessionId;

    setError(null);

    // If no active session, create one first
    if (!currentSessionId) {
      try {
        currentSessionId = await createNewSession(user.uid);
        setActiveSessionId(currentSessionId);
      } catch (err: any) {
        setError('Failed to initialize session for message.');
        return;
      }
    }

    const userTimestamp = Date.now();
    const tempUserMsg: JournalMessage = {
      id: `temp-user-${userTimestamp}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(userTimestamp),
    };

    // Optimistically render user message immediately so it's placed on screen
    setMessages((prev) => {
      // Avoid duplicate if already in stream
      if (prev.some((m) => m.text === text.trim() && Math.abs((m.timestamp instanceof Date ? m.timestamp.getTime() : 0) - userTimestamp) < 2000)) {
        return prev;
      }
      return [...prev, tempUserMsg];
    });

    setIsAiGenerating(true);

    try {
      // 1. Save User Message to Firestore with explicit timestamp
      await addSessionMessage(user.uid, currentSessionId, 'user', text.trim(), userTimestamp);

      // 2. Construct conversation history for Gemini
      const cleanHistory: JournalMessage[] = [
        ...messages.filter((m) => !m.id.startsWith('temp-')),
        tempUserMsg,
      ];

      // 3. Trigger Gemini AI reflection
      const aiReplyText = await sendChatToGemini(cleanHistory);

      // 4. Save Model Reply to Firestore with timestamp guaranteed to be strictly after user message
      const aiTimestamp = Math.max(Date.now(), userTimestamp + 50);
      await addSessionMessage(user.uid, currentSessionId, 'model', aiReplyText, aiTimestamp);
    } catch (err: any) {
      console.error('Failed in multi-turn exchange:', err);
      setError(err.message || 'Failed to receive AI reflection. Please retry.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle End & Summarize Session (Auto-Summary Engine)
  const handleEndAndSummarize = async () => {
    if (!user?.uid || !activeSessionId || messages.length === 0) return;

    setIsSummarizing(true);
    setError(null);

    try {
      // 1. Request structured JSON summary from Gemini
      const summaryResult = await summarizeSessionWithGemini(messages);

      // 2. Write JSON payload into Firestore session metadata
      await updateSessionWithSummary(user.uid, activeSessionId, summaryResult);

      // 3. Show Summary Closure Modal
      setActiveSummaryModal(summaryResult);
    } catch (err: any) {
      console.error('Failed to summarize session:', err);
      setError(err.message || 'Failed to generate session closure summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle Delete Session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;

    const confirmDelete = window.confirm('Are you sure you want to permanently delete this journal reflection?');
    if (!confirmDelete) return;

    try {
      await deleteJournalSession(user.uid, sessionId);
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(null);
          handleCreateNewSession();
        }
      }
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setError('Could not delete session.');
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="h-screen w-screen flex bg-[#0a0a0c] overflow-hidden font-sans text-[#e2e2e7] relative selection:bg-indigo-500/30 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),rgba(10,10,12,0))] z-0" />

      {/* Two-Column Layout */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleCreateNewSession}
        onDeleteSession={handleDeleteSession}
        onOpenDetailModal={(session) => setDetailModalSession(session)}
        isCreating={isCreatingSession}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <ChatWorkspace
        session={activeSession}
        messages={messages}
        onSendMessage={handleSendMessage}
        onEndAndSummarize={handleEndAndSummarize}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        isAiGenerating={isAiGenerating}
        isSummarizing={isSummarizing}
        error={error}
        onClearError={() => setError(null)}
      />

      {/* Auto-Summary Closure Modal */}
      {activeSummaryModal && (
        <SummaryModal
          summary={activeSummaryModal}
          onClose={() => setActiveSummaryModal(null)}
          onStartNewSession={handleCreateNewSession}
        />
      )}

      {/* Historic Session Detail Modal */}
      {detailModalSession && (
        <SessionDetailModal
          session={detailModalSession}
          onClose={() => setDetailModalSession(null)}
          onOpenSessionInWorkspace={(id) => setActiveSessionId(id)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-[#e2e2e7] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.15),rgba(10,10,12,0))]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-lg shadow-indigo-500/25 animate-pulse mb-5 border border-white/10">
            IE
          </div>
          <p className="font-serif text-sm tracking-wide text-[#9494a0] animate-pulse">
            Opening your private emotional sanctuary...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard />;
};
