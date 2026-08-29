import { JournalMessage, SessionSummaryResult } from '../types/journal';

/**
 * Send conversation history to the Gemini API proxy endpoint.
 */
export async function sendChatToGemini(messages: JournalMessage[]): Promise<string> {
  const payload = {
    messages: messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text,
    })),
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate AI response';
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      errorMsg = `Server error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.text || 'I am here with you. What else comes to mind?';
}

/**
 * Request structured session auto-summarization from Gemini.
 */
export async function summarizeSessionWithGemini(
  messages: JournalMessage[]
): Promise<SessionSummaryResult> {
  const payload = {
    messages: messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text,
    })),
  };

  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to auto-summarize session';
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      errorMsg = `Server error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (!data?.summary) {
    throw new Error('Invalid summary structure returned from AI service.');
  }

  return data.summary as SessionSummaryResult;
}
