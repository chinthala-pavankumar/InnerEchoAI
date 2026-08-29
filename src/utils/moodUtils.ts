export interface MoodBadgeConfig {
  label: string;
  emoji: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  gradientClass: string;
}

export function getMoodConfig(moodRaw?: string): MoodBadgeConfig {
  const mood = (moodRaw || 'Reflective').trim().toLowerCase();

  if (mood.includes('calm') || mood.includes('peace') || mood.includes('seren')) {
    return {
      label: moodRaw || 'Calm',
      emoji: '🌿',
      bgClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      textClass: 'text-emerald-300',
      borderClass: 'border-emerald-500/40',
      gradientClass: 'from-emerald-950/50 via-teal-900/30 to-[#121218]',
    };
  }

  if (mood.includes('grate') || mood.includes('joy') || mood.includes('happ')) {
    return {
      label: moodRaw || 'Grateful',
      emoji: '☀️',
      bgClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      textClass: 'text-amber-300',
      borderClass: 'border-amber-500/40',
      gradientClass: 'from-amber-950/50 via-yellow-900/30 to-[#121218]',
    };
  }

  if (mood.includes('anxio') || mood.includes('nerv') || mood.includes('stress') || mood.includes('fear')) {
    return {
      label: moodRaw || 'Anxious',
      emoji: '🌪️',
      bgClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      textClass: 'text-orange-300',
      borderClass: 'border-orange-500/40',
      gradientClass: 'from-orange-950/50 via-rose-900/30 to-[#121218]',
    };
  }

  if (mood.includes('overwhelm') || mood.includes('exhaust') || mood.includes('burnout') || mood.includes('tired') || mood.includes('fatigue')) {
    return {
      label: moodRaw || 'Overwhelmed',
      emoji: '🌊',
      bgClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      textClass: 'text-rose-300',
      borderClass: 'border-rose-500/40',
      gradientClass: 'from-rose-950/50 via-pink-900/30 to-[#121218]',
    };
  }

  if (mood.includes('vuln') || mood.includes('sad') || mood.includes('grief') || mood.includes('lonel')) {
    return {
      label: moodRaw || 'Vulnerable',
      emoji: '🌧️',
      bgClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      textClass: 'text-sky-300',
      borderClass: 'border-sky-500/40',
      gradientClass: 'from-sky-950/50 via-indigo-900/30 to-[#121218]',
    };
  }

  if (mood.includes('hope') || mood.includes('optimis') || mood.includes('inspir')) {
    return {
      label: moodRaw || 'Hopeful',
      emoji: '🌱',
      bgClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      textClass: 'text-teal-300',
      borderClass: 'border-teal-500/40',
      gradientClass: 'from-teal-950/50 via-emerald-900/30 to-[#121218]',
    };
  }

  if (mood.includes('conflict') || mood.includes('uncert') || mood.includes('doubt')) {
    return {
      label: moodRaw || 'Conflicted',
      emoji: '⚖️',
      bgClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      textClass: 'text-purple-300',
      borderClass: 'border-purple-500/40',
      gradientClass: 'from-purple-950/50 via-violet-900/30 to-[#121218]',
    };
  }

  if (mood.includes('determ') || mood.includes('motivat') || mood.includes('confid') || mood.includes('power')) {
    return {
      label: moodRaw || 'Determined',
      emoji: '⚡',
      bgClass: 'bg-amber-600/15 text-amber-300 border-amber-500/30',
      textClass: 'text-amber-300',
      borderClass: 'border-amber-500/40',
      gradientClass: 'from-amber-950/50 via-orange-900/30 to-[#121218]',
    };
  }

  // Default / Reflective
  return {
    label: moodRaw || 'Reflective',
    emoji: '🪞',
    bgClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    textClass: 'text-indigo-300',
    borderClass: 'border-indigo-500/40',
    gradientClass: 'from-indigo-950/50 via-violet-900/30 to-[#121218]',
  };
}

export function formatJournalDate(timestamp: any): string {
  if (!timestamp) return 'Just now';
  
  let date: Date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return 'Recently';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
