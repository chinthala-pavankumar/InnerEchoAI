import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, sanitizeFirestorePayload } from '../firebase/config';
import { JournalMessage, JournalSession, MessageRole, SessionSummaryResult } from '../types/journal';

/**
 * Real-time listener for user's journaling sessions ordered by createdAt descending.
 */
export function subscribeSessions(
  userId: string,
  onUpdate: (sessions: JournalSession[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const sessionsQuery = query(sessionsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    sessionsQuery,
    (snapshot) => {
      const sessions: JournalSession[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          metadata: {
            title: data.title || 'Untitled Session',
            createdAt: data.createdAt,
            dominantMood: data.dominantMood || 'Reflective',
            summary: data.summary,
            tags: Array.isArray(data.tags) ? data.tags : [],
            updatedAt: data.updatedAt,
            status: data.status || (data.summary ? 'summarized' : 'active'),
          },
        };
      });
      onUpdate(sessions);
    },
    (err) => {
      console.error('[Firestore] subscribeSessions error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for messages in a given session ordered chronologically.
 */
export function subscribeMessages(
  userId: string,
  sessionId: string,
  onUpdate: (messages: JournalMessage[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId || !sessionId) {
    onUpdate([]);
    return () => {};
  }

  const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
  // Order chronologically
  const messagesQuery = query(messagesRef, orderBy('createdAtMs', 'asc'));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: JournalMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          role: (data.role === 'user' ? 'user' : 'model') as MessageRole,
          text: data.text || '',
          timestamp: data.createdAtMs ? new Date(data.createdAtMs) : (data.timestamp || new Date()),
        };
      });

      // Extra deterministic client-side sorting safeguarding strict chronological order
      messages.sort((a, b) => {
        const timeA = typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp instanceof Date ? a.timestamp.getTime() : (a.timestamp?.toMillis?.() || 0));
        const timeB = typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp instanceof Date ? b.timestamp.getTime() : (b.timestamp?.toMillis?.() || 0));
        return timeA - timeB;
      });

      onUpdate(messages);
    },
    (err) => {
      // Fallback query if index on createdAtMs is building
      console.warn('[Firestore] subscribeMessages index fallback:', err);
      const fallbackQuery = query(messagesRef);
      return onSnapshot(fallbackQuery, (snapshot) => {
        const fallbackMessages: JournalMessage[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            role: (data.role === 'user' ? 'user' : 'model') as MessageRole,
            text: data.text || '',
            timestamp: data.createdAtMs ? new Date(data.createdAtMs) : (data.timestamp || new Date()),
          };
        });
        fallbackMessages.sort((a, b) => {
          const timeA = typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp instanceof Date ? a.timestamp.getTime() : (a.timestamp?.toMillis?.() || 0));
          const timeB = typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp instanceof Date ? b.timestamp.getTime() : (b.timestamp?.toMillis?.() || 0));
          return timeA - timeB;
        });
        onUpdate(fallbackMessages);
      }, onError);
    }
  );
}

/**
 * Create a new journaling session document.
 */
export async function createNewSession(
  userId: string,
  initialTitle: string = 'New Reflection'
): Promise<string> {
  if (!userId) throw new Error('User ID is required to create a session.');

  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const sessionDocRef = doc(sessionsRef);

  const payload = sanitizeFirestorePayload({
    title: initialTitle,
    dominantMood: 'Reflective',
    tags: ['reflection', 'journal'],
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
    status: 'active',
  });

  await setDoc(sessionDocRef, payload);
  return sessionDocRef.id;
}

/**
 * Add a message to a session's messages subcollection with guaranteed monotonic timestamps.
 */
export async function addSessionMessage(
  userId: string,
  sessionId: string,
  role: MessageRole,
  text: string,
  explicitTimestampMs?: number
): Promise<string> {
  if (!userId || !sessionId) throw new Error('User ID and Session ID are required.');
  if (!text || !text.trim()) throw new Error('Message text cannot be empty.');

  const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
  const nowMs = explicitTimestampMs || Date.now();
  const payload = sanitizeFirestorePayload({
    role,
    text: text.trim(),
    createdAtMs: nowMs,
    timestamp: serverTimestamp(),
  });

  const docRef = await addDoc(messagesRef, payload);
  return docRef.id;
}

/**
 * Persist structured session auto-summary into the session metadata document.
 */
export async function updateSessionWithSummary(
  userId: string,
  sessionId: string,
  summaryResult: SessionSummaryResult
): Promise<void> {
  if (!userId || !sessionId) throw new Error('User ID and Session ID are required.');

  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  const payload = sanitizeFirestorePayload({
    title: summaryResult.title,
    summary: summaryResult.summary,
    dominantMood: summaryResult.dominantMood,
    tags: summaryResult.tags,
    status: 'summarized',
    updatedAt: serverTimestamp(),
  });

  await setDoc(sessionDocRef, payload, { merge: true });
}

/**
 * Delete a session and its subcollection messages in a batch.
 */
export async function deleteJournalSession(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) throw new Error('User ID and Session ID are required.');

  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
  
  const messagesSnap = await getDocs(messagesRef);
  const batch = writeBatch(db);

  messagesSnap.docs.forEach((msgDoc) => {
    batch.delete(msgDoc.ref);
  });

  batch.delete(sessionDocRef);
  await batch.commit();
}
