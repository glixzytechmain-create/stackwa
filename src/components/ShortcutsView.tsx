import React from 'react';
import { 
  Keyboard, 
  Bookmark
} from 'lucide-react';

export const ShortcutsView: React.FC = () => {
  const shortcuts = [
    {
      keys: ['⌘', 'Enter'],
      windowsKeys: ['Ctrl', 'Enter'],
      action: 'Run Test Suite & Live Execution Dialogue',
      category: 'Code Sandbox',
      description: 'Executes your solution against automated test cases and opens the execution terminal / UI preview.'
    },
    {
      keys: ['⌘', 'K'],
      windowsKeys: ['Ctrl', 'K'],
      action: 'Open Socratic AI Command Bar',
      category: 'Global',
      description: 'Triggers the floating Socratic AI Lead pill to ask clarifying questions or get hint evaluations.'
    },
    {
      keys: ['⌘', 'H'],
      windowsKeys: ['Ctrl', 'H'],
      action: 'Shatter Next Vault Hint',
      category: 'Pedagogy',
      description: 'Progressively unlocks the next tier anti-spoiler clue without revealing full code.'
    },
    {
      keys: ['⌘', 'B'],
      windowsKeys: ['Ctrl', 'B'],
      action: 'Flip Holo-Deck Explainer (3D Flip)',
      category: 'Code Sandbox',
      description: 'Flips the 3D code editor card to reveal the spatial solution code and time complexity radar.'
    },
    {
      keys: ['⌘', 'P'],
      windowsKeys: ['Ctrl', 'P'],
      action: 'Toggle Live UI Sandbox Preview',
      category: 'Frontend / Full-Stack',
      description: 'Opens the live 60fps sandboxed iframe to inspect rendered UI components or DOM elements.'
    },
    {
      keys: ['Esc'],
      windowsKeys: ['Esc'],
      action: 'Close Active Dialogue / Exit Sub-Modal',
      category: 'Global',
      description: 'Dismisses open preview modals, raise-hand dialogues, and command palettes.'
    }
  ];

  const guidelines = [
    {
      step: '01',
      title: 'Clarify Boundaries Before Code',
      badge: 'Pedagogy Rule 1',
      description: 'Always click "✋ Raise Hand" to ask about input lengths, duplicate keys, memory constraints, and negative numbers. Interviewers dock points for coding before clarifying.'
    },
    {
      step: '02',
      title: 'Articulate Big-O Invariants Out Loud',
      badge: 'Pedagogy Rule 2',
      description: 'Speak your target time and space complexity before drafting. A sliding-window deque is O(N) amortized time and O(K) space. Anchor these expectations in your opening minute.'
    },
    {
      step: '03',
      title: 'Decouple Optimistic UI from Server State',
      badge: 'Round 2 Rule',
      description: 'In Mobbin UI screens, never mix optimistic client updates with persistent backend data. Use rollback snapshots if network requests abort with 409 or 500 status codes.'
    },
    {
      step: '04',
      title: 'Defend Split-Brain Edge Cases Socratically',
      badge: 'Round 4 Rule',
      description: 'When the AI lead probes your ledger or rate-limiter design, consider clock drift across distributed datacenters. Propose monotonic clocks or raft-replicated logs.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            ENGINEERING WORKFLOW
          </span>
          <span className="text-xs text-neutral-400 font-mono">Tactile Muscle Memory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Shortcuts & Spatial Guidelines</h1>
        <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
          Master the keyboard shortcuts and Socratic interview mental models that turn technical screens into predictable, high-scoring conversations.
        </p>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Keyboard Accelerators</h2>
              <p className="text-[11px] text-neutral-400">Fast tactile navigation during live screens</p>
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">Mac & Windows Supported</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {shortcuts.map((sc, i) => (
            <div 
              key={i} 
              className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 hover:border-white/15 transition flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                  {sc.category}
                </span>
                
                {/* Key Badges */}
                <div className="flex items-center space-x-1 font-mono text-xs">
                  {sc.keys.map((k, ki) => (
                    <kbd 
                      key={ki} 
                      className="px-2 py-1 rounded-lg bg-black/80 border border-white/20 text-white font-bold text-[11px] shadow-sm shadow-black"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-rose-300 transition">
                  {sc.action}
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                  {sc.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Socratic Interview Guidelines */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5">
          <Bookmark className="w-4 h-4 text-rose-500" />
          <h2 className="text-base font-bold text-white tracking-tight">The 4 Socratic Interview Invariants</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {guidelines.map((g, i) => (
            <div 
              key={i}
              className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-white/10">{g.step}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {g.badge}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white">{g.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{g.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Quote */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/30 to-black border border-rose-500/30 text-center space-y-2">
        <p className="text-xs text-neutral-300 font-mono italic">
          "Great engineers do not memorize leetcode questions; they master the spatial invariants that make any problem solvable under pressure."
        </p>
        <span className="text-[10px] text-rose-400 font-mono tracking-widest uppercase block">— Stackwa Pedagogy Engine</span>
      </div>
    </div>
  );
};
