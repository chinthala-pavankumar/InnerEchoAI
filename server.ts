import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Top-level payload deserialization middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Lazy-initialize Google GenAI SDK client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is missing or not configured. Please set your Gemini API key in the AI Studio Settings / Secrets panel."
    );
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return genAIClient;
}

// Resilient model fallback ladder ordered by availability and latency
const MODEL_FALLBACK_LADDER = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

const SYSTEM_INSTRUCTION =
  "You are an empathetic, insightful, and secure AI Journaling Assistant. Act as a gentle sounding board. Do not offer unsolicited clinical diagnoses or immediate prescriptive advice. Instead, ask thoughtful, open-ended questions that prompt deeper self-discovery. Keep individual conversational responses concise (1–2 short paragraphs max).";

// Empathetic companion fallback generator for seamless offline/unauthenticated resilience
function generateEmpatheticReflectionFallback(messages: Array<{ role: string; text: string }>): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.text || "";
  const lower = lastUserMsg.toLowerCase();

  if (lower.includes("anxious") || lower.includes("stress") || lower.includes("worry") || lower.includes("panic") || lower.includes("overwhelm")) {
    return "It sounds like you are carrying a lot of tension and emotional weight right now. It takes courage to acknowledge when things feel heavy.\n\nWhen you sit with this feeling for a moment, what part of it feels most demanding of your attention?";
  }
  if (lower.includes("sad") || lower.includes("lonely") || lower.includes("hurt") || lower.includes("crying") || lower.includes("depress")) {
    return "Thank you for sharing this tender space. Your feelings are completely valid, and you don't have to carry them all alone.\n\nIf you could offer yourself just one gentle word of comfort right now, what would it be?";
  }
  if (lower.includes("angry") || lower.includes("frustrated") || lower.includes("mad") || lower.includes("unfair") || lower.includes("annoyed")) {
    return "Frustration and anger often point to boundaries that have been crossed or values that matter deeply to you.\n\nWhat is this feeling protecting inside you, and what needs to be heard most?";
  }
  if (lower.includes("tired") || lower.includes("exhausted") || lower.includes("burnout") || lower.includes("drained")) {
    return "It sounds like your mind and body are asking for rest and gentleness after giving so much energy.\n\nWhat is one small burden you could give yourself permission to set down, even just for tonight?";
  }
  if (lower.includes("happy") || lower.includes("grateful") || lower.includes("good") || lower.includes("proud") || lower.includes("excited")) {
    return "It is wonderful to notice these moments of light and gratitude. Celebrating positive shifts helps anchor them in your journey.\n\nWhat made this moment stand out for you, and how does your body feel when you recall it?";
  }
  if (lower.includes("confused") || lower.includes("decision") || lower.includes("unsure") || lower.includes("stuck")) {
    return "Uncertainty can feel uncomfortable, yet it often signals that you are standing at the edge of a meaningful transition.\n\nIf you listen to your inner intuition beneath the doubts, what direction feels truest to who you want to be?";
  }

  return "Thank you for reflecting on that. Every time you put your thoughts into words, you give yourself more clarity and space to breathe.\n\nWhat feels most significant about what you just shared, or where would you like to explore next?";
}

// Structured summary fallback generator
function generateSummaryFallback(messages: Array<{ role: string; text: string }>) {
  const fullText = messages.map((m) => m.text).join(" ").toLowerCase();
  
  let dominantMood = "Reflective";
  let title = "Mindful Reflection Journal";
  let tags = ["reflection", "self-awareness", "mindset"];

  if (fullText.includes("stress") || fullText.includes("anxious") || fullText.includes("overwhelm")) {
    dominantMood = "Overwhelmed";
    title = "Navigating Stress & Inner Grounding";
    tags = ["stress-relief", "mindfulness", "boundaries", "grounding"];
  } else if (fullText.includes("sad") || fullText.includes("hurt") || fullText.includes("loss")) {
    dominantMood = "Vulnerable";
    title = "Processing Tender Emotions";
    tags = ["healing", "self-compassion", "emotional-space"];
  } else if (fullText.includes("grateful") || fullText.includes("happy") || fullText.includes("joy")) {
    dominantMood = "Grateful";
    title = "Moments of Gratitude & Light";
    tags = ["gratitude", "positivity", "growth", "celebration"];
  } else if (fullText.includes("angry") || fullText.includes("frustrated")) {
    dominantMood = "Conflicted";
    title = "Clarifying Boundaries & Frustration";
    tags = ["boundaries", "emotional-clarity", "inner-strength"];
  } else if (fullText.includes("hope") || fullText.includes("future") || fullText.includes("goal")) {
    dominantMood = "Hopeful";
    title = "Looking Forward with Hope";
    tags = ["future-vision", "optimism", "personal-growth"];
  }

  const summary = `In this session, you explored key thoughts around your current experiences, expressing feelings with honesty and vulnerability. The reflection highlighted opportunities for self-compassion and clearer emotional grounding.`;

  return { title, summary, dominantMood, tags };
}

// Resilient helper to execute content generation with automated model fallback
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  let ai: GoogleGenAI | null = null;
  try {
    ai = getGenAI();
  } catch (err: any) {
    console.warn("[Gemini API] SDK key missing or not configured. Falling back to empathetic companion engine.");
    return null;
  }

  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      
      // If the API key is invalid or not authorized, fail over gracefully to companion engine
      if (
        errMsg.includes("API key not valid") || 
        errMsg.includes("API_KEY_INVALID") ||
        errMsg.includes("PERMISSION_DENIED")
      ) {
        console.warn(`[Gemini API] API Key authentication failed on model '${model}'. Using empathetic companion fallback.`);
        return null;
      }

      console.warn(`[Gemini Fallback] Model '${model}' failed:`, errMsg);
      lastError = err;
    }
  }

  console.warn(`[Gemini API] Fallback ladder completed. Using empathetic companion fallback.`);
  return null;
}

// API Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Multi-turn Chat Reflection Endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return res.status(400).json({ error: "Messages array cannot be empty." });
    }

    // Format chat history for Gemini SDK
    const formattedContents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.text || "") }],
    }));

    const result = await generateContentWithFallback({
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    });

    if (!result || !result.response?.text) {
      const fallbackReply = generateEmpatheticReflectionFallback(messages);
      return res.json({
        text: fallbackReply,
        modelUsed: "empathetic-companion-engine",
      });
    }

    const replyText = result.response.text || "I am listening closely. Could you tell me more about what you are feeling?";
    
    return res.json({
      text: replyText,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const fallbackReply = generateEmpatheticReflectionFallback(messages);
    return res.json({
      text: fallbackReply,
      modelUsed: "empathetic-companion-engine",
    });
  }
});

// Structured Session Auto-Summarizer Endpoint
app.post("/api/summarize", async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return res.status(400).json({ error: "Session conversation history is required for summarization." });
    }

    // Build the transcript
    const transcript = messages
      .map(
        (m: { role: string; text: string }) =>
          `${m.role === "user" ? "User" : "Journal Assistant"}: ${m.text}`
      )
      .join("\n\n");

    const summaryPrompt = `Analyze this emotional journaling session and provide a structured closure reflection.

CONVERSATION TRANSCRIPT:
${transcript}

REQUIREMENTS:
1. title: A concise, poetic or reflective title capturing the core essence (3-5 words).
2. summary: A compassionate, insightful synthesis of the user's emotional arc (2-3 sentences).
3. dominantMood: One single descriptive emotional word (e.g., "Reflective", "Overwhelmed", "Grateful", "Vulnerable", "Hopeful", "Anxious", "Serene", "Conflicted", "Determined", "Grounded").
4. tags: An array of 3-5 concise lowercase semantic tags representing recurring themes (e.g., ["work-stress", "boundaries", "self-compassion", "growth"]).`;

    const summarySchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "A concise title of 3-5 words capturing the session theme.",
        },
        summary: {
          type: Type.STRING,
          description: "A 2-3 sentence compassionate reflection on the session's emotional arc.",
        },
        dominantMood: {
          type: Type.STRING,
          description: "One single descriptive word representing the dominant mood.",
        },
        tags: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "An array of 3 to 5 lowercase tags describing themes.",
        },
      },
      required: ["title", "summary", "dominantMood", "tags"],
    };

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: summaryPrompt }] }],
      config: {
        systemInstruction:
          "You are an expert psychological insight engine. Given an emotional journal transcript, synthesize the session into a structured JSON summary matching the requested schema exactly.",
        responseMimeType: "application/json",
        responseSchema: summarySchema,
        temperature: 0.3,
      },
    });

    if (!result || !result.response?.text) {
      const fallbackSummary = generateSummaryFallback(messages);
      return res.json({
        summary: fallbackSummary,
        modelUsed: "empathetic-companion-engine",
      });
    }

    const rawJson = result.response.text || "{}";
    let parsedSummary: any;
    try {
      parsedSummary = JSON.parse(rawJson);
    } catch {
      parsedSummary = generateSummaryFallback(messages);
    }

    // Defensive fallback validation
    if (!parsedSummary.title || typeof parsedSummary.title !== "string") {
      parsedSummary.title = "Emotional Journal Reflection";
    }
    if (!parsedSummary.summary || typeof parsedSummary.summary !== "string") {
      parsedSummary.summary = "A session exploring underlying feelings, self-talk, and personal clarity.";
    }
    if (!parsedSummary.dominantMood || typeof parsedSummary.dominantMood !== "string") {
      parsedSummary.dominantMood = "Reflective";
    }
    if (!Array.isArray(parsedSummary.tags) || parsedSummary.tags.length === 0) {
      parsedSummary.tags = ["reflection", "self-care", "mindset"];
    } else {
      parsedSummary.tags = parsedSummary.tags.map((t: string) => String(t).toLowerCase().trim());
    }

    return res.json({
      summary: parsedSummary,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/summarize:", error);
    return res.status(500).json({
      error: error.message || "Failed to auto-summarize the journaling session.",
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`InnerEcho Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
