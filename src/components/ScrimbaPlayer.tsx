import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Code2, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { DsaProblem } from '../types';

interface ScrimbaPlayerProps {
  problem: DsaProblem;
}

interface StepFrame {
  index: number;
  timeSeconds: number;
  codeLine: number;
  subtitle: string;
  pointers: { [key: string]: number | string };
  arrayHighlights?: { [index: number]: 'active' | 'min' | 'done' };
}

// Curated step-by-step frames for each problem
const PROBLEM_FRAMES: { [problemId: string]: { array: number[]; frames: StepFrame[]; codeLines: string[] } } = {
  'stock-price-maximizer': {
    array: [10, 7, 5, 8, 11, 9],
    codeLines: [
      'function getMaxProfit(stockPrices) {',
      '  let minPrice = stockPrices[0];',
      '  let maxProfit = stockPrices[1] - stockPrices[0];',
      '',
      '  for (let i = 1; i < stockPrices.length; i++) {',
      '    const currentPrice = stockPrices[i];',
      '    const potentialProfit = currentPrice - minPrice;',
      '    maxProfit = Math.max(maxProfit, potentialProfit);',
      '    minPrice = Math.min(minPrice, currentPrice);',
      '  }',
      '  return maxProfit;',
      '}'
    ],
    frames: [
      {
        index: 0,
        timeSeconds: 0,
        codeLine: 2,
        subtitle: 'Step 1: Initialize minPrice to stockPrices[0] ($10) and maxProfit to ($7 - $10 = -$3).',
        pointers: { i: 'start', currentPrice: '-', minPrice: '$10', potentialProfit: '-', maxProfit: '-$3' },
        arrayHighlights: { 0: 'min', 1: 'active' }
      },
      {
        index: 1,
        timeSeconds: 4,
        codeLine: 6,
        subtitle: 'Step 2: At i=1 ($7), potential profit is $7 - $10 = -$3. minPrice updates from $10 down to $7.',
        pointers: { i: 1, currentPrice: '$7', minPrice: '$7', potentialProfit: '-$3', maxProfit: '-$3' },
        arrayHighlights: { 1: 'min' }
      },
      {
        index: 2,
        timeSeconds: 8,
        codeLine: 7,
        subtitle: 'Step 3: At i=2 ($5), price falls further. Potential profit is $5 - $7 = -$2 (new best!). minPrice becomes $5.',
        pointers: { i: 2, currentPrice: '$5', minPrice: '$5', potentialProfit: '-$2', maxProfit: '-$2' },
        arrayHighlights: { 2: 'min' }
      },
      {
        index: 3,
        timeSeconds: 12,
        codeLine: 8,
        subtitle: 'Step 4: At i=3 ($8), potential profit is $8 - $5 = +$3! maxProfit jumps to +$3.',
        pointers: { i: 3, currentPrice: '$8', minPrice: '$5', potentialProfit: '+$3', maxProfit: '+$3' },
        arrayHighlights: { 2: 'min', 3: 'active' }
      },
      {
        index: 4,
        timeSeconds: 16,
        codeLine: 8,
        subtitle: 'Step 5: At i=4 ($11), peak day! Potential profit is $11 - $5 = +$6! maxProfit updates to +$6.',
        pointers: { i: 4, currentPrice: '$11', minPrice: '$5', potentialProfit: '+$6', maxProfit: '+$6' },
        arrayHighlights: { 2: 'min', 4: 'active' }
      },
      {
        index: 5,
        timeSeconds: 20,
        codeLine: 11,
        subtitle: 'Step 6: At i=5 ($9), profit is $4 (does not beat $6). Loop ends and returns maximum profit $6 in O(n) time!',
        pointers: { i: 5, currentPrice: '$9', minPrice: '$5', potentialProfit: '+$4', maxProfit: '+$6' },
        arrayHighlights: { 2: 'min', 4: 'done' }
      }
    ]
  },
  'merging-meeting-times': {
    array: [1, 3, 2, 4, 7, 9],
    codeLines: [
      'function mergeRanges(meetings) {',
      '  const sorted = [...meetings].sort((a,b) => a.start - b.start);',
      '  const merged = [sorted[0]];',
      '  for (let i = 1; i < sorted.length; i++) {',
      '    const current = sorted[i];',
      '    const last = merged[merged.length - 1];',
      '    if (current.start <= last.end) {',
      '      last.end = Math.max(last.end, current.end);',
      '    } else {',
      '      merged.push(current);',
      '    }',
      '  }',
      '  return merged;',
      '}'
    ],
    frames: [
      {
        index: 0,
        timeSeconds: 0,
        codeLine: 2,
        subtitle: 'Step 1: Sort all meeting ranges by start time so potential overlaps are adjacent.',
        pointers: { sortedCount: 4, mergedRanges: '[ {0, 1} ]' }
      },
      {
        index: 1,
        timeSeconds: 5,
        codeLine: 7,
        subtitle: 'Step 2: Meeting {3, 5} does not overlap with {0, 1}. Push as a separate distinct interval.',
        pointers: { current: '{3, 5}', lastMerged: '{0, 1}', action: 'push separate' }
      },
      {
        index: 2,
        timeSeconds: 10,
        codeLine: 8,
        subtitle: 'Step 3: Meeting {4, 8} starts at 4 (<= 5). Overlap detected! Merge into {3, 8}.',
        pointers: { current: '{4, 8}', lastMerged: '{3, 5}', action: 'merge -> {3, 8}' }
      },
      {
        index: 3,
        timeSeconds: 15,
        codeLine: 13,
        subtitle: 'Step 4: All ranges processed in O(n log n) time. Result condensed cleanly.',
        pointers: { totalMerged: 3, status: 'complete' }
      }
    ]
  },
  'inflight-entertainment': {
    array: [60, 40, 75, 80],
    codeLines: [
      'function canTwoMoviesFillFlight(flightLength, movieLengths) {',
      '  const seen = new Set();',
      '  for (let len of movieLengths) {',
      '    const matching = flightLength - len;',
      '    if (seen.has(matching)) return true;',
      '    seen.add(len);',
      '  }',
      '  return false;',
      '}'
    ],
    frames: [
      {
        index: 0,
        timeSeconds: 0,
        codeLine: 2,
        subtitle: 'Step 1: Target flightLength is 120 mins. Initialize empty Hash Set `seen`.',
        pointers: { flightLength: 120, seenSet: '{ }', matching: '-' }
      },
      {
        index: 1,
        timeSeconds: 4,
        codeLine: 4,
        subtitle: 'Step 2: Movie 1 is 60m. Needed matching is (120 - 60 = 60m). Not in set yet. Add 60.',
        pointers: { current: 60, needed: 60, inSet: 'false', seenSet: '{ 60 }' }
      },
      {
        index: 2,
        timeSeconds: 8,
        codeLine: 4,
        subtitle: 'Step 3: Movie 2 is 40m. Needed matching is (120 - 40 = 80m). Not in set yet. Add 40.',
        pointers: { current: 40, needed: 80, inSet: 'false', seenSet: '{ 60, 40 }' }
      },
      {
        index: 3,
        timeSeconds: 12,
        codeLine: 5,
        subtitle: 'Step 4: Movie 4 is 80m. Needed matching is (120 - 80 = 40m). 40 IS in set! Return true in O(n) time!',
        pointers: { current: 80, needed: 40, inSet: 'TRUE!', matchPair: '40m + 80m = 120m' }
      }
    ]
  }
};

export const ScrimbaPlayer: React.FC<ScrimbaPlayerProps> = ({ problem }) => {
  const data = PROBLEM_FRAMES[problem.id] || PROBLEM_FRAMES['stock-price-maximizer'];
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const currentFrame = data.frames[currentFrameIndex];
  const maxFrames = data.frames.length;

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex(prev => {
          if (prev >= maxFrames - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000 / playbackSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxFrames, playbackSpeed]);

  const togglePlay = () => {
    if (currentFrameIndex >= maxFrames - 1) {
      setCurrentFrameIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (index: number) => {
    setCurrentFrameIndex(index);
  };

  const progressPercent = Math.round(((currentFrameIndex + 1) / maxFrames) * 100);

  return (
    <div className="glass-panel rounded-2xl border border-pink-500/30 overflow-hidden flex flex-col shadow-2xl">
      
      {/* Player Topbar */}
      <div className="bg-slate-900/95 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Scrimba Codecast: {problem.title}</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-700/50 font-semibold animate-pulse">
                Interactive Player
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Synchronized visual pointer walkthrough & editable code</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <a
            href="https://scrimba.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 border border-pink-500/30 transition"
          >
            <span>Open on Scrimba</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="bg-slate-950 p-6 flex flex-col space-y-6">
        
        {/* Animated Array Bar Chart (when available) */}
        {data.array && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-indigo-400">Input Array Traversal:</span>
              <span>Step {currentFrameIndex + 1} of {maxFrames}</span>
            </div>

            <div className="flex items-end justify-center space-x-3 h-28 pt-2">
              {data.array.map((val, idx) => {
                const isMin = currentFrame.arrayHighlights?.[idx] === 'min';
                const isActive = currentFrame.arrayHighlights?.[idx] === 'active';
                const isDone = currentFrame.arrayHighlights?.[idx] === 'done';

                let barColor = 'bg-slate-800 text-slate-400 border-slate-700';
                if (isMin) barColor = 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/30';
                else if (isActive) barColor = 'bg-pink-500 text-white font-bold border-pink-400 shadow-lg shadow-pink-500/30 scale-105';
                else if (isDone) barColor = 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-lg shadow-emerald-500/30';

                return (
                  <div key={idx} className="flex flex-col items-center space-y-1.5 flex-1 max-w-[64px]">
                    <span className="text-[11px] font-mono font-bold text-slate-300">${val}</span>
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-300 border ${barColor}`}
                      style={{ height: `${Math.max(24, val * 7)}px` }}
                    />
                    <span className="text-[10px] text-slate-500 font-mono">i={idx}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Variable Inspector Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(currentFrame.pointers).map(([key, val]) => (
            <div key={key} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono">{key}:</span>
              <span className="text-sm font-extrabold text-white font-mono mt-0.5">{String(val)}</span>
            </div>
          ))}
        </div>

        {/* Synchronized Code Box with Active Line Glow */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden font-mono text-xs">
          <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>solution.js — Synchronized Execution</span>
            <span className="text-pink-400">Line {currentFrame.codeLine}</span>
          </div>
          <div className="p-3 space-y-0.5 overflow-x-auto">
            {data.codeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlight = lineNum === currentFrame.codeLine;
              return (
                <div 
                  key={idx} 
                  className={`px-3 py-1 rounded transition-colors duration-150 flex items-center space-x-3 ${
                    isHighlight 
                      ? 'bg-pink-600/25 text-pink-200 border-l-2 border-pink-500 font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-slate-600 select-none w-6 text-right text-[10px]">{lineNum}</span>
                  <span className="flex-1">{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio Subtitles / Commentary Box */}
        <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/30 flex items-start space-x-3">
          <div className="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Audio Commentary:</span>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
              {currentFrame.subtitle}
            </p>
          </div>
        </div>

      </div>

      {/* Player Timeline & Controls Bar */}
      <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex flex-col space-y-3">
        
        {/* Scrubber Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono text-slate-400">0:{currentFrameIndex * 4 < 10 ? `0${currentFrameIndex * 4}` : currentFrameIndex * 4}</span>
          <div className="flex-1 relative flex items-center cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            const targetIndex = Math.min(maxFrames - 1, Math.max(0, Math.floor(ratio * maxFrames)));
            handleSeek(targetIndex);
          }}>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-200" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">0:{maxFrames * 4}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentFrameIndex(0)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
              disabled={currentFrameIndex === 0}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              title="Previous Step"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Main Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition flex items-center space-x-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{currentFrameIndex >= maxFrames - 1 ? 'Replay' : 'Play Walkthrough'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => setCurrentFrameIndex(Math.min(maxFrames - 1, currentFrameIndex + 1))}
              disabled={currentFrameIndex >= maxFrames - 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              title="Next Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[0.5, 1, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                  playbackSpeed === speed 
                    ? 'bg-pink-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
