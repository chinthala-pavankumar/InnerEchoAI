export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
  lastLoginAt?: any;
}

export type MessageRole = 'user' | 'model';

export interface JournalMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: any;
}

export interface SessionMetadata {
  title: string;
  createdAt: any;
  dominantMood: string;
  summary?: string;
  tags: string[];
  updatedAt?: any;
  status?: 'active' | 'summarized';
}

export interface JournalSession {
  id: string;
  metadata: SessionMetadata;
  messageCount?: number;
}

export interface SessionSummaryResult {
  title: string;
  summary: string;
  dominantMood: string;
  tags: string[];
}
