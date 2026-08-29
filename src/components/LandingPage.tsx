import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  HeartHandshake, 
  BrainCircuit, 
  Compass, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e2e2e7] flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none opacity-40 blur-[120px] -z-10"
        style={{
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 35%, transparent 70%)'
        }}
      />

      {/* Top Brand Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-serif text-xl font-bold shadow-lg shadow-indigo-500/20 border border-white/10">
            IE
          </div>
          <div>
            <span className="font-serif text-xl font-semibold tracking-tight text-white">InnerEcho</span>
            <span className="text-xs text-[#9494a0] block -mt-1 font-sans">AI Emotional Sanctuary</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#c4c4d0] bg-white/[0.06] backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/[0.08]">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>User-Isolated Vault</span>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center z-10">
        {/* Subtle pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-8 animate-fade-in shadow-xs shadow-indigo-500/10">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Empathetic Multi-Turn Reflection &amp; Auto-Summarization</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white max-w-3xl leading-tight sm:leading-tight">
          A gentle, private sounding board for your inner world.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[#9494a0] max-w-2xl font-sans font-light leading-relaxed">
          Express your uncensored thoughts in a secure space. InnerEcho listens deeply without clinical judgment, guides self-discovery with thoughtful inquiries, and synthesizes your emotional arc upon session closure.
        </p>

        {/* Error notification if login fails */}
        {error && (
          <div className="mt-6 p-4 max-w-md w-full rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-sm flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <p className="font-medium">Authentication notice</p>
              <p className="text-xs text-rose-300 mt-0.5">{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="text-xs text-rose-400 hover:text-rose-200 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary CTA: Google Sign-in */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="google-signin-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-base shadow-xl shadow-indigo-500/25 border border-indigo-400/30 transition-all duration-200 active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isSigningIn ? 'Connecting securely...' : 'Sign in with Google'}</span>
            <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Security and privacy badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#9494a0]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Password Overhead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Firestore Owner-Bound ABAC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Strict Ephemeral AI Memory</span>
          </div>
        </div>

        {/* Architecture & Feature Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-[#13131a]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/20 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-white">Non-Clinical Empathy</h3>
            <p className="mt-2 text-sm text-[#9494a0] font-sans leading-relaxed">
              Trained with strict ethical system instructions to act as a supportive sounding board, posing open-ended questions rather than unrequested prescriptions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#13131a]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/20 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-white">Isolated Data Architecture</h3>
            <p className="mt-2 text-sm text-[#9494a0] font-sans leading-relaxed">
              Every message and reflection is stored in <code className="text-xs bg-white/[0.08] text-emerald-300 px-1.5 py-0.5 rounded">/users/{'{uid}'}/sessions</code> enforced by hardened Firestore security rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#13131a]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/20 hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-500/20 text-amber-300 flex items-center justify-center mb-4">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-white">Structured Auto-Summary</h3>
            <p className="mt-2 text-sm text-[#9494a0] font-sans leading-relaxed">
              Ending a session generates a concise emotional title, dominant mood anchor, 2-3 sentence reflection synthesis, and semantic tags.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/[0.08] text-center text-xs text-[#6e6e7c] flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <span>InnerEcho • Private AI Emotional Journal</span>
        <span>Built with Firebase Web SDK v10 &amp; Google Gen AI</span>
      </footer>
    </div>
  );
};
