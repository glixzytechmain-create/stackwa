import { DayPlan } from '../types';

// Curated pool of high-effort daily rituals tailored to company and architectural topic
const RITUAL_TEMPLATES = [
  {
    themeSuffix: "Core Invariants & Asymptotic Bounds",
    ritual: (company: string) => `Morning 25m: Formulate Big-O time and space constraints on paper before writing code for ${company}. Identify tightest upper bounds and edge invariants.`
  },
  {
    themeSuffix: "State Isolation & Mutex Boundaries",
    ritual: (company: string) => `Map optimistic state transitions and rollback boundaries on paper. Verify conflict resolution and lock release during concurrent ${company} mutations.`
  },
  {
    themeSuffix: "High-Concurrency Sliding Windows",
    ritual: (_company: string) => `Implement sliding window rate-limiting guards. Trace edge cases where concurrent requests arrive at the exact millisecond mark.`
  },
  {
    themeSuffix: "Virtualized Data Pipelines & Recycled Nodes",
    ritual: (_company: string) => `Calculate window overscan offsets and DOM node recycling ratios. Verify heap memory footprint remains strictly O(1) during infinite scroll.`
  },
  {
    themeSuffix: "Defensive Engineering & Boundary Radar",
    ritual: (_company: string) => `Stress-test null payloads, duplicate key mutations, and unhandled exception barriers. Verify zero unhandled promise rejections under high load.`
  },
  {
    themeSuffix: "Cache Hierarchy & O(1) Eviction Pipelines",
    ritual: (_company: string) => `Trace doubly-linked list node splicing for LRU/LFU cache hits and misses. Prove O(1) time complexity for both get and put operations.`
  },
  {
    themeSuffix: "Event-Driven Pub/Sub & Stream Deduplication",
    ritual: (_company: string) => `Trace message idempotency and out-of-order packet arrival handling. Prove zero double-spend or duplicate event processing.`
  },
  {
    themeSuffix: "Optimistic UI Rollback & WebSockets",
    ritual: (_company: string) => `Simulate socket disconnection mid-flight and verify optimistic rollback. Ensure UI state never desynchronizes from server truth.`
  },
  {
    themeSuffix: "Database Index Ordering & B-Tree Bounds",
    ritual: (_company: string) => `Model composite index scan patterns vs table scans. Identify index column ordering to eliminate filesorts and memory sorts.`
  },
  {
    themeSuffix: "Circuit Breakers & Exponential Jitter",
    ritual: (_company: string) => `Implement exponential backoff with full jitter for failed external API calls. Verify circuit breaker trips correctly on 5xx thresholds.`
  },
  {
    themeSuffix: "Debounced Search & In-Flight Cancellation",
    ritual: (_company: string) => `Measure debounce leading/trailing edge execution. Ensure keystroke bursts issue zero redundant in-flight network requests.`
  },
  {
    themeSuffix: "Memory Leaks & DOM Lifecycle Cleanups",
    ritual: (_company: string) => `Profile browser memory allocations. Ensure event listeners, timers, and WebSockets cleanly dispose on unmount.`
  },
  {
    themeSuffix: "Security Hardening & Replay Guard",
    ritual: (_company: string) => `Validate payload schemas against injection vectors, token expiration edge cases, and replay attacks under high load.`
  },
  {
    themeSuffix: "Principal Architect Mock Screen Rehearsal",
    ritual: (company: string) => `Execute a full 45-minute timed interview simulation for ${company}. Articulate trade-offs to the AI interviewer, defend edge cases, and review your score receipt.`
  }
];

export function generateHighEffortRoadmap(
  company: string,
  _role: string,
  daysCount: number = 7,
  customFocusAreas: string[] = []
): DayPlan[] {
  const targetCompany = company || 'Tech Company';
  const totalDays = Math.min(14, Math.max(3, daysCount));
  const plans: DayPlan[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const isFirst = d === 1;
    const isLast = d === totalDays;
    const templateIndex = isFirst 
      ? 0 
      : isLast 
        ? RITUAL_TEMPLATES.length - 1 
        : (d - 1) % (RITUAL_TEMPLATES.length - 2) + 1;
    
    const template = RITUAL_TEMPLATES[templateIndex];
    const customFocus = customFocusAreas.length > 0 ? customFocusAreas[(d - 1) % customFocusAreas.length] : null;

    const theme = isFirst
      ? `${targetCompany} Core Invariants & Complexity`
      : customFocus
        ? `${customFocus} — ${template.themeSuffix}`
        : `${targetCompany} ${template.themeSuffix}`;

    const dateLabel = isFirst
      ? `Day 1 — Diagnostic & Constraints`
      : isLast
        ? `Day ${d} — Final Mock Simulation`
        : `Day ${d} — Deep Mastery`;

    plans.push({
      dayNumber: d,
      dateLabel,
      theme,
      dsaProblemId: isFirst ? 'distributed-rate-limiter' : (d % 2 === 0 ? 'idempotent-transaction-ledger' : 'lru-cache-eviction'),
      uiChallengeId: isFirst ? 'linear-command-palette' : (d % 2 === 0 ? 'airbnb-filter-drawer' : 'spotify-queue-drawer'),
      dailyRitual: template.ritual(targetCompany),
      isCompleted: isFirst
    });
  }

  return plans;
}

// Generate RFC 5545 iCalendar (.ics) string containing all roadmap days
export function buildRoadmapIcsString(
  roadmap: DayPlan[],
  company: string,
  role: string
): string {
  const targetCompany = company || 'Tech Company';
  const targetRole = role || 'Software Engineer';
  const now = new Date();

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatIcsDate = (date: Date) => {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  };

  const dtstamp = formatIcsDate(now);

  const events = roadmap.map((day, idx) => {
    // Schedule event starting from today (or tomorrow if today is late)
    const eventDate = new Date();
    eventDate.setDate(now.getDate() + idx);
    eventDate.setHours(9, 0, 0, 0); // 9:00 AM

    const endDate = new Date(eventDate);
    endDate.setMinutes(45); // 9:45 AM (45 min session)

    const summary = `Stackwa Prep [Day ${day.dayNumber}]: ${day.theme}`;
    const description = `Target: ${targetCompany} • ${targetRole}\\n\\nDaily Practice Ritual:\\n${day.dailyRitual}\\n\\nPlatform: https://gen-lang-client-0953455656.web.app`;

    return [
      'BEGIN:VEVENT',
      `UID:stackwa-${day.dayNumber}-${eventDate.getTime()}@stackwa.app`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatIcsDate(eventDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:Stackwa Interview OS (Web)`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: Stackwa ${targetCompany} Prep Day ${day.dayNumber}`,
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stackwa//Spatial Interview OS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Stackwa — ${targetCompany} (${targetRole}) Roadmap`,
    'X-WR-TIMEZONE:UTC',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

// Download .ics file in browser to import entire roadmap into Apple Calendar, Google Calendar, or Outlook
export function downloadRoadmapIcs(
  roadmap: DayPlan[],
  company: string,
  role: string
): void {
  const icsContent = buildRoadmapIcsString(roadmap, company, role);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeName = (company || 'Interview').replace(/[^a-zA-Z0-9_-]/g, '_');
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Stackwa_${safeName}_Roadmap.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Dedicated 1-click export of entire roadmap to Google Calendar
export function exportAllToGoogleCalendar(
  roadmap: DayPlan[],
  company: string,
  role: string
): { success: boolean; message: string; filename: string } {
  const safeName = (company || 'Interview').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Stackwa_${safeName}_GoogleCalendar.ics`;
  const icsContent = buildRoadmapIcsString(roadmap, company, role);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Direct user to Google Calendar's import page in a new window/tab
  try {
    window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank');
  } catch (e) {
    console.warn('Could not automatically open Google Calendar settings:', e);
  }

  return {
    success: true,
    message: `Downloaded ${filename} and opened Google Calendar Import settings in a new tab!`,
    filename
  };
}
