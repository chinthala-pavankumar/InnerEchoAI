# InnerEcho - Private AI-Driven Emotional Journal (SPA)

InnerEcho is a private, full-stack emotional journaling single-page web application built with **React**, **Vite**, **Tailwind CSS**, **Firebase Web SDK (v10+)**, and **Google Gen AI (@google/genai)**.

---

## 1. Threat Model & Security Countermeasures

| Threat Zone | Risk Identification | Potential Impact | Security Countermeasure |
| :--- | :--- | :--- | :--- |
| **Input Surfaces** | Malicious script or prompt injection in journal entries. | Cross-Site Scripting (XSS), prompt jailbreaks. | Strict client & server payload sanitization, zero raw HTML rendering, hard system instructions. |
| **Planning & Reasoning** | Prompt injection during session auto-summarization. | Output alteration or unauthorized schema escape. | Hardcoded JSON schema validation with `@google/genai` `responseMimeType: "application/json"`. |
| **Tool / Execution** | Firestore mutation failures due to undefined fields. | App crash, silent drop of user reflection. | Defensive `sanitizeFirestorePayload` recursive undefined-stripper before all writes. |
| **Memory & State** | Insecure Firestore security rules exposing other users' reflections. | Cross-user data leakage of sensitive personal journals. | Strict ABAC Firestore rules (`request.auth.uid == userId`) with path hardening and default-deny. |
| **Inter-System Communication** | Accidental client bundle exposure of `GEMINI_API_KEY`. | API quota theft and financial liability. | Server-side Express API proxy (`/api/chat`, `/api/summarize`) with zero client-side secret exposure. |

---

## 2. Architecture & Data Schema

### Firestore User-Centric Isolation Hierarchy
```text
/users/{userId}/
    ├── (doc) profile: { displayName, photoURL, createdAt, lastLoginAt }
    └── /sessions/{sessionId}/
        ├── (doc) metadata: { title, createdAt, dominantMood, summary, tags[], status }
        └── /messages/{messageId}/
            └── (doc) { role: "user" | "model", text: string, timestamp: Timestamp }
```

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny all unknown collections
    match /{document=**} {
      allow read, write: if false;
    }

    // Isolated user-centric hierarchy
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

---

## 3. Secret Management & Google Cloud Configuration

### A. Enable Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

### B. Secret Manager Setup
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant default Cloud Run service account access to read secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### C. Deploy to Google Cloud Run
```bash
# Build and deploy service
gcloud run deploy innerecho-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=3000

# Apply mandatory campaign verification label
gcloud run services update innerecho-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 4. Functional Stability & Walkthrough Test Cases

### Test Case 1: Federated Google Authentication
- **Step 1.1**: Open the application landing page when unauthenticated. Verify the serene welcome screen displays the prominent "Sign in with Google" button with no email/password inputs.
- **Step 1.2**: Click "Sign in with Google". Complete the Google popup authentication flow.
- **Step 1.3**: Confirm the app automatically observes `onAuthStateChanged`, syncs profile metadata to `/users/{userId}`, and routes the user into the private two-column dashboard.

### Test Case 2: Multi-Turn Empathetic AI Chat Interaction
- **Step 2.1**: Select or create a new journal session in the sidebar.
- **Step 2.2**: Type an emotional reflection (e.g., *"I felt overwhelmed balancing deadlines with personal family commitments today."*) and press `Enter`.
- **Step 2.3**: Verify the user message is written in real time to Firestore `/users/{userId}/sessions/{sessionId}/messages`.
- **Step 2.4**: Verify the AI responds with an empathetic, non-clinical reflection asking open-ended questions to guide deeper self-discovery. Confirm the model response is stored to Firestore.

### Test Case 3: Auto-Summary Engine (Session Closure)
- **Step 3.1**: After an active conversation exchange, click the **"End & Summarize Session"** button.
- **Step 3.2**: Verify the loading state displays while the background structured Gemini request executes.
- **Step 3.3**: Confirm the Summary Modal renders with all 4 required fields:
  - Concise Title (3–5 words)
  - Emotional Synthesis (2–3 sentences)
  - Dominant Mood badge (e.g., Overwhelmed 🌊, Reflective 🪞)
  - Semantic theme tags (array of 3–5 lowercase tags)
- **Step 3.4**: Verify that the session metadata in Firestore is updated with the JSON summary and the sidebar reflects the new title, mood anchor, and tags immediately via `onSnapshot`.

### Test Case 4: Real-Time Sidebar History & Filtering
- **Step 4.1**: Create multiple journal sessions with different emotional reflections.
- **Step 4.2**: Verify the left sidebar orders sessions by `createdAt` descending in real time.
- **Step 4.3**: Use the search input or click the mood filter chips (e.g., *"All"*, *"Grateful"*, *"Reflective"*) to confirm instant client-side filtering.
- **Step 4.4**: Click the trash icon on a session to delete it, confirming batch deletion of the session and its message subcollection from Firestore.
