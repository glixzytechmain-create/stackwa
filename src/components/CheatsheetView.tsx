import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Code2, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  Copy, 
  Check, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InvariantCard {
  id: string;
  category: 'algorithms' | 'concurrency' | 'frontend' | 'pitfalls';
  title: string;
  subtitle: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  invariantStatement: string;
  explanation: string;
  codeSnippet?: string;
  interviewTrap?: string;
  tags: string[];
}

const INVARIANTS_DATA: InvariantCard[] = [
  // -------------------------------------------------------------
  // 1. ALGORITHMIC INVARIANTS & COMPLEXITIES
  // -------------------------------------------------------------
  {
    id: 'algo-hash-table',
    category: 'algorithms',
    title: 'Hash Table (Collision Clustering & Load Factor)',
    subtitle: 'Amortized O(1) Dictionary Lookup',
    timeComplexity: 'Avg: O(1) | Worst: O(n)',
    spaceComplexity: 'O(n) auxiliary',
    invariantStatement: 'Load factor α = n / m must remain below threshold (typically 0.75). When α exceeds threshold, dynamic array resizes to 2m and all entries are re-hashed in O(n) amortized time.',
    explanation: 'In open addressing with linear probing, primary clustering occurs when filled slots group together. In separate chaining, worst-case lookups degrade to O(n) if all keys hash to the same bucket (or O(log n) in Java 8+ TreeMap bins).',
    codeSnippet: `// Load factor invariant
const LOAD_FACTOR_THRESHOLD = 0.75;
if (this.size / this.buckets.length > LOAD_FACTOR_THRESHOLD) {
  this.rehash(this.buckets.length * 2);
}`,
    interviewTrap: 'Never assume hash tables are strictly O(1) worst-case. In an interview, always mention adversaries crafting hash-collision inputs (HashDoS) to degrade search to O(n).',
    tags: ['Hash Table', 'Amortized O(1)', 'Load Factor', 'Rehashing']
  },
  {
    id: 'algo-binary-heap',
    category: 'algorithms',
    title: 'Binary Heap / Priority Queue',
    subtitle: 'Complete Binary Tree Invariant',
    timeComplexity: 'Peek: O(1) | Insert: O(log n) | Extract-Min: O(log n)',
    spaceComplexity: 'O(n) in compact array',
    invariantStatement: 'Min-Heap Invariant: For every node i other than root, A[Parent(i)] <= A[i]. Zero pointer overhead: Parent at (i-1)>>1, Left child at 2i+1, Right child at 2i+2.',
    explanation: 'Building a heap from an unordered array using bottom-up sift-down takes O(n) time, NOT O(n log n), because the majority of nodes reside at shallow levels with small heights.',
    codeSnippet: `// Sift-down maintaining min-heap invariant
function siftDown(heap: number[], i: number, n: number) {
  let smallest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  if (left < n && heap[left] < heap[smallest]) smallest = left;
  if (right < n && heap[right] < heap[smallest]) smallest = right;
  if (smallest !== i) {
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    siftDown(heap, smallest, n);
  }
}`,
    interviewTrap: 'Claiming heapify takes O(n log n). Top-down insertions take O(n log n), but bottom-up heapify (starting at n/2 down to 0) mathematically sums to O(n).',
    tags: ['Priority Queue', 'Heapify O(n)', 'Complete Tree', 'Sift-Down']
  },
  {
    id: 'algo-sliding-window',
    category: 'algorithms',
    title: 'Sliding Window & Two Pointers',
    subtitle: 'Monotonic Search Space Compression',
    timeComplexity: 'Strictly O(n) Amortized',
    spaceComplexity: 'O(1) to O(k) for state map',
    invariantStatement: 'The right pointer expands the window monotonically; the left pointer contracts it until the valid invariant is restored. Each element enters and exits the window at most once.',
    explanation: 'Used for contiguous subarray problems (e.g. longest substring without repeating characters, minimum window substring). Instead of recalculating subarrays in O(n²), maintain a rolling frequency map or sum in O(1) per step.',
    codeSnippet: `function longestUniqueSubstr(s: string): number {
  const lastIndex = new Map<string, number>();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (lastIndex.has(char) && lastIndex.get(char)! >= left) {
      left = lastIndex.get(char)! + 1; // Contract window
    }
    lastIndex.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
    interviewTrap: 'Resetting the left pointer backwards inside the loop destroys the O(n) bound and turns it into O(n²). Left pointer must move monotonically forward.',
    tags: ['Sliding Window', 'Two Pointers', 'Contiguous Subarrays', 'O(n)']
  },
  {
    id: 'algo-monotonic-stack',
    category: 'algorithms',
    title: 'Monotonic Stack / Queue',
    subtitle: 'Next Greater Element & Histogram Extrema',
    timeComplexity: 'O(n) Amortized Total',
    spaceComplexity: 'O(n) Auxiliary',
    invariantStatement: 'Elements in the stack are strictly ordered (either strictly increasing or strictly decreasing). Elements violating the invariant are popped before pushing the current element.',
    explanation: 'Solves Next Greater Element, Largest Rectangle in Histogram, and Trapping Rain Water. Because every element is pushed once and popped at most once, total time is linear O(n).',
    codeSnippet: `// Monotonic Decreasing Stack for Next Greater Element
function nextGreater(nums: number[]): number[] {
  const res = new Array(nums.length).fill(-1);
  const stack: number[] = []; // stores indices
  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {
      const idx = stack.pop()!;
      res[idx] = nums[i];
    }
    stack.push(i);
  }
  return res;
}`,
    interviewTrap: 'Assuming nested while loop inside for loop implies O(n²). The stack can only pop elements that were pushed, bounding total operations across the entire array to 2n.',
    tags: ['Monotonic Stack', 'Next Greater Element', 'Amortized O(n)']
  },
  {
    id: 'algo-union-find',
    category: 'algorithms',
    title: 'Disjoint Set Union (Union-Find / DSU)',
    subtitle: 'Near-O(1) Dynamic Graph Connectivity',
    timeComplexity: 'O(α(n)) ≈ O(1) Amortized (Inverse Ackermann)',
    spaceComplexity: 'O(n) Parent & Rank Arrays',
    invariantStatement: 'Path Compression flattens the tree during find(); Union by Rank attaches smaller trees under the root of deeper trees, maintaining max tree depth bounded by α(n) < 5.',
    explanation: 'Optimal for dynamic connectivity queries, Kruskal’s minimum spanning tree, and detecting cycles in undirected graphs. In practice, α(n) <= 4 for all n < 10^80.',
    codeSnippet: `class UnionFind {
  private parent: number[];
  private rank: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(i: number): number {
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]); // Path compression
    }
    return this.parent[i];
  }
  union(i: number, j: number): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return false;
    if (this.rank[rootI] < this.rank[rootJ]) this.parent[rootI] = rootJ;
    else if (this.rank[rootI] > this.rank[rootJ]) this.parent[rootJ] = rootI;
    else { this.parent[rootJ] = rootI; this.rank[rootI]++; }
    return true;
  }
}`,
    interviewTrap: 'Omitting path compression. Without path compression, union by rank alone gives O(log n); without both, trees degrade to linked lists with O(n) per query.',
    tags: ['Union-Find', 'DSU', 'Graph Connectivity', 'Ackermann']
  },

  // -------------------------------------------------------------
  // 2. CONCURRENCY & DISTRIBUTED SYSTEMS
  // -------------------------------------------------------------
  {
    id: 'conc-idempotency',
    category: 'concurrency',
    title: 'Idempotency Keys & Deduplication Window',
    subtitle: 'Safe Retries Under Network Timeouts',
    timeComplexity: 'O(1) Cache Verification',
    spaceComplexity: 'O(k) in Redis / Memcached with TTL',
    invariantStatement: 'f(f(x)) = f(x). Multiple identical payment or mutation requests execute the side-effect EXACTLY ONCE. Subsequent retries return the cached original response.',
    explanation: 'When clients experience a 504 Gateway Timeout or dropped TCP connection, they cannot distinguish whether the server failed before or after mutating the database. An idempotency key (UUIDv4) stored with state (PENDING -> COMMITTED) prevents double charges.',
    codeSnippet: `// Atomic Idempotency Pattern (Redis / SQL Transaction)
async function executePayment(idempotencyKey: string, payload: any) {
  // SETNX key with 24h TTL
  const acquired = await (globalThis as any).redis?.set(\`idemp:\${idempotencyKey}\`, 'PROCESSING', 'NX', 'EX', 86400);
  if (!acquired) {
    return await pollForCommittedResult(idempotencyKey);
  }
  try {
    const chargeResult = await dbTransaction(payload);
    await (globalThis as any).redis?.set(\`idemp:\${idempotencyKey}\`, JSON.stringify(chargeResult), 'EX', 86400);
    return chargeResult;
  } catch (err) {
    await (globalThis as any).redis?.del(\`idemp:\${idempotencyKey}\`);
    throw err;
  }
}`,
    interviewTrap: 'Believing standard REST POST is inherently non-idempotent. While HTTP defines POST as non-idempotent, enterprise APIs (Stripe, Adyen, Linear) enforce idempotency via header keys.',
    tags: ['Idempotency', 'Distributed Transactions', 'Redis SETNX', 'Retries']
  },
  {
    id: 'conc-cap-pacelc',
    category: 'concurrency',
    title: 'CAP Theorem & PACELC Theorem',
    subtitle: 'Partition Trade-Offs & Latency Bounds',
    timeComplexity: 'Consensus Round Trips: 1 RTT (Fast Paxos/Raft)',
    spaceComplexity: 'Quorum Q = floor(N/2) + 1',
    invariantStatement: 'If Partition (P): choose Availability (A) or Consistency (C). ELSE (E): choose Latency (L) or Consistency (C).',
    explanation: 'CAP only applies during network partitions. In normal operation (99.99% of time), systems trade off Latency vs Consistency. DynamoDB/Cassandra are PA/EL (Partition-Available, Else-Low Latency); Spanner/CockroachDB are PC/EC (Partition-Consistent, Else-Consistent).',
    interviewTrap: 'Stating "we pick CA". In distributed networks, partitions (P) are an unpreventable physical reality (cable cuts, switch restarts). You cannot choose "CA" over network boundaries.',
    tags: ['CAP Theorem', 'PACELC', 'Quorum', 'Distributed Systems']
  },
  {
    id: 'conc-optimistic-locking',
    category: 'concurrency',
    title: 'Optimistic vs Pessimistic Concurrency Control',
    subtitle: 'Atomic Versioning vs Exclusive Row Locks',
    timeComplexity: 'O(1) Conditional Write',
    spaceComplexity: '1 Integer Column (version / revision)',
    invariantStatement: 'UPDATE table SET balance = balance - 10, version = version + 1 WHERE id = ? AND version = ?; Affected rows must equal 1, or concurrent mutation conflict detected.',
    explanation: 'Pessimistic locking (SELECT FOR UPDATE) blocks other readers/writers, risking deadlocks under high read throughput. Optimistic locking avoids locks entirely, allowing high concurrency with retry loops upon collision.',
    codeSnippet: `// Optimistic concurrency retry loop
async function transferFunds(accountNumber: string, amount: number) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const account = await dbFindAccount(accountNumber);
    if (account.balance < amount) throw new Error("Insufficient funds");

    const updated = await dbQuery(
      "UPDATE accounts SET balance = balance - $1, version = version + 1 WHERE id = $2 AND version = $3",
      [amount, account.id, account.version]
    );

    if (updated.rowCount === 1) return true; // Mutation committed
    await new Promise(r => setTimeout(r, Math.random() * 50));
  }
  throw new Error("Conflict: high contention write failed");
}`,
    interviewTrap: 'Using optimistic locking for highly contended hotspot records (e.g. flash-sale ticket counters). High contention causes 99% of optimistic retries to abort; use Redis atomic DECR or pessimistic token buckets instead.',
    tags: ['Optimistic Locking', 'Pessimistic Locking', 'Deadlocks', 'ACID']
  },

  // -------------------------------------------------------------
  // 3. FRONTEND & BROWSER RUNTIME INVARIANTS
  // -------------------------------------------------------------
  {
    id: 'fe-event-loop',
    category: 'frontend',
    title: 'V8 Event Loop Priority Order',
    subtitle: 'Microtask Queue Starvation Invariant',
    timeComplexity: 'Microtask Queue drained before Macrotask',
    spaceComplexity: 'Call Stack & Heap Frames',
    invariantStatement: 'The Microtask queue (Promise.then, queueMicrotask, MutationObserver) is emptied COMPLETELY before the browser yields to rendering or executes the next Macrotask (setTimeout, I/O).',
    explanation: 'Recursive microtasks (e.g. Promise chains scheduling new microtasks) will completely freeze the UI thread and prevent garbage collection, animation frame rendering, and user input handlers.',
    codeSnippet: `console.log('1'); // Synchronous
setTimeout(() => console.log('2'), 0); // Macrotask
Promise.resolve().then(() => console.log('3')); // Microtask
queueMicrotask(() => console.log('4')); // Microtask
console.log('5'); // Synchronous
// Deterministic Output: 1 -> 5 -> 3 -> 4 -> 2`,
    interviewTrap: 'Assuming setTimeout(fn, 0) executes immediately after synchronous code. All pending microtasks run BEFORE setTimeout(fn, 0).',
    tags: ['Event Loop', 'Microtasks', 'Macrotasks', 'V8 Runtime']
  },
  {
    id: 'fe-reconciliation',
    category: 'frontend',
    title: 'React Fiber Reconciliation Invariants',
    subtitle: 'Pure Render Phase vs Synchronous Commit',
    timeComplexity: 'O(n) Linear Diffing (Keyed Invariant)',
    spaceComplexity: 'Double-Buffered Fiber Tree (WorkInProgress)',
    invariantStatement: 'The Render phase is pure, idempotent, and may be paused/aborted by React Concurrent scheduler. The Commit phase is synchronous and applies DOM mutations atomically.',
    explanation: 'Never cause side effects (API calls, subscriptions, mutating global variables) inside component bodies or useMemo. Side effects must reside inside useEffect or event handlers.',
    codeSnippet: `// Keyed list reconciliation invariant
// Bad: key={index} causes state leaks on delete/insert at head
// Good: Stable unique domain ID
{todos.map(todo => (
  <TodoItem key={todo.id} item={todo} />
))}`,
    interviewTrap: 'Using array index as key for dynamic lists with deletions or sorting. Index keys break component identity, causing inputs and local state to bind to the wrong items.',
    tags: ['React Fiber', 'Reconciliation', 'Keys', 'Concurrent Mode']
  },
  {
    id: 'fe-layout-thrashing',
    category: 'frontend',
    title: 'Forced Synchronous Layout (Layout Thrashing)',
    subtitle: 'Read/Write Batching Invariant',
    timeComplexity: 'Degrades 60fps (16ms) to <10fps',
    spaceComplexity: 'DOM Tree Geometry Recalculation',
    invariantStatement: 'Reading layout geometry properties (offsetWidth, clientHeight, getBoundingClientRect) immediately after writing style properties forces the browser to synchronously recalculate layout.',
    explanation: 'Batch all reads first, then batch all writes. Alternatively, delegate geometry measurements to ResizeObserver or animation updates to requestAnimationFrame.',
    codeSnippet: `// ❌ Bad: Layout Thrashing (N forced reflows)
for (const el of elements) {
  const width = el.offsetWidth; // READ forces reflow!
  el.style.width = (width + 10) + 'px'; // WRITE invalidates!
}

// ✅ Good: Batched Reads then Writes (1 reflow)
const widths = elements.map(el => el.offsetWidth); // Batch READS
elements.forEach((el, i) => {
  el.style.width = (widths[i] + 10) + 'px'; // Batch WRITES
});`,
    interviewTrap: 'Forgetting that window.getComputedStyle(el) and window.scrollY also trigger synchronous layout recalculation when styles are dirty.',
    tags: ['Layout Thrashing', 'Reflow', 'Performance', 'DOM Engine']
  },

  // -------------------------------------------------------------
  // 4. BIG-O TRAPS & COMMON PITFALLS
  // -------------------------------------------------------------
  {
    id: 'trap-shift-unshift',
    category: 'pitfalls',
    title: 'Array.prototype.shift() / unshift() is O(n)',
    subtitle: 'Linear Element Re-indexing in V8',
    timeComplexity: 'O(n) per call — NOT O(1)!',
    spaceComplexity: 'In-place contiguous memory shift',
    invariantStatement: 'Calling .shift() on a standard JavaScript Array re-indexes all n-1 remaining elements in memory. Using .shift() in a loop turns an O(n) algorithm into O(n²)!',
    explanation: 'JavaScript Arrays are backed by contiguous linear memory (Fast Elements) or hash tables (Dictionary Elements). They are NOT linked lists. For FIFO queues, use a pointer index or circular buffer.',
    codeSnippet: `// ❌ Accidental O(n²) Queue using shift()
while (queue.length > 0) {
  const item = queue.shift(); // O(n) each iteration!
}

// ✅ Correct O(n) Queue using pointer
let head = 0;
while (head < queue.length) {
  const item = queue[head++]; // O(1) amortized
  if (head > 10000 && head > queue.length / 2) {
    queue = queue.slice(head);
    head = 0;
  }
}`,
    interviewTrap: 'Implementing BFS or sliding window using array.shift(). In FAANG screens, this immediately fails time limit benchmarks (TLE on n=10^5).',
    tags: ['Array.shift()', 'Queue', 'V8 Engine', 'Accidental O(n²)']
  },
  {
    id: 'trap-string-concat',
    category: 'pitfalls',
    title: 'String Concatenation in Loops (Immutable Allocation)',
    subtitle: 'Quadratic Copy Overhead',
    timeComplexity: 'Repeated string + string is O(n²)',
    spaceComplexity: 'O(n²) intermediate garbage allocated',
    invariantStatement: 'Strings are immutable in JavaScript and Python. Concatenating characters in a loop copies the entire accumulated string repeatedly: 1 + 2 + ... + n = O(n²).',
    explanation: 'Push parts to an array and execute .join("") in JavaScript, or "".join(list) in Python. Modern V8 has Ropes/ConsString optimizations, but strict algorithms must not rely on engine heuristics.',
    codeSnippet: `// ❌ O(n²) string creation
let s = "";
for (let i = 0; i < n; i++) {
  s += tokens[i]; // Copies s every step!
}

// ✅ O(n) buffer join
const parts = [];
for (let i = 0; i < n; i++) {
  parts.push(tokens[i]);
}
const s = parts.join('');`,
    interviewTrap: 'Saying "V8 fixes string concatenation so it is O(n)". V8 ropes reduce copying, but converting ropes to flat strings upon substring or regex matching forces an expensive O(n) flattening.',
    tags: ['Strings', 'Immutability', 'Quadratic Memory', 'Join']
  },
  {
    id: 'trap-python-list-insert',
    category: 'pitfalls',
    title: 'Python list.insert(0, val) vs collections.deque',
    subtitle: 'Dynamic Array Left Insertion Penalty',
    timeComplexity: 'list.insert(0) is O(n) | deque.appendleft() is O(1)',
    spaceComplexity: 'Doubly Linked Block Array in deque',
    invariantStatement: 'Python lists are dynamic arrays (like std::vector in C++). Inserting at index 0 shifts all pointers right by 1 position. Use collections.deque for O(1) two-ended operations.',
    explanation: 'collections.deque allocates a doubly-linked list of fixed-size blocks (typically 64 elements each), providing true O(1) amortized pops and appends from both ends.',
    codeSnippet: `# Python Invariant:
from collections import deque

# ❌ O(n²) BFS queue
q = []
q.insert(0, root) # O(n)

# ✅ O(n) BFS queue
q = deque([root])
q.append(child)     # O(1)
curr = q.popleft()  # O(1)`,
    interviewTrap: 'Using Python list.pop(0) in graph traversal algorithms. It is O(n) per step; always use collections.deque.popleft().',
    tags: ['Python', 'deque', 'popleft', 'Data Structure Traps']
  }
];

// Mock helper placeholders for code snippet display
declare const elements: HTMLElement[];
declare function dbTransaction(p: any): Promise<any>;
declare function pollForCommittedResult(k: string): Promise<any>;
declare function dbFindAccount(id: string): Promise<any>;
declare function dbQuery(sql: string, params: any[]): Promise<any>;
declare const root: any;
declare const child: any;

export const CheatsheetView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Invariants', icon: Sparkles },
    { id: 'algorithms', label: 'Algorithmic Complexities', icon: Code2 },
    { id: 'concurrency', label: 'Concurrency & Distributed', icon: Cpu },
    { id: 'frontend', label: 'Frontend Runtime & DOM', icon: Layers },
    { id: 'pitfalls', label: 'Big-O Traps & Pitfalls', icon: AlertTriangle }
  ];

  const filteredInvariants = useMemo(() => {
    return INVARIANTS_DATA.filter(item => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCat;
      const matchesSearch = 
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.invariantStatement.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6 space-y-3">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            ENGINEERING INVARIANTS MATRIX
          </span>
          <span className="text-xs text-neutral-400 font-mono">Zero Mock Data • Senior Technical Standards</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Engineering Cheatsheet & Invariants Matrix
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1 leading-relaxed">
              Algorithmic time/space complexities, distributed consistency invariants, V8 microtask rules, and interview traps to articulate before writing code.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Navigation */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-neutral-900/80 border border-white/5">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invariants, O(1), V8..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs text-white placeholder-neutral-500 focus:outline-none transition font-mono"
          />
        </div>

      </div>

      {/* Grid of Invariant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredInvariants.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Card Header & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                      {item.subtitle}
                    </span>
                    <h2 className="text-base font-extrabold text-white leading-snug">
                      {item.title}
                    </h2>
                  </div>

                  {item.timeComplexity && (
                    <div className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/10 text-[11px] font-mono text-emerald-400 font-bold">
                      {item.timeComplexity}
                    </div>
                  )}
                </div>

                {/* Core Invariant Highlight Box */}
                <div className="p-3.5 rounded-2xl bg-black/80 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Mathematical / Architectural Invariant:</span>
                  </div>
                  <p className="text-xs font-mono text-neutral-200 leading-relaxed">
                    {item.invariantStatement}
                  </p>
                </div>

                {/* Explanation */}
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {item.explanation}
                </p>

                {/* Code Snippet (if available) */}
                {item.codeSnippet && (
                  <div className="relative group rounded-xl bg-black/90 border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/80 border-b border-white/5 text-[10px] font-mono text-neutral-400">
                      <span>INVARIANT IMPLEMENTATION</span>
                      <button
                        onClick={() => handleCopySnippet(item.id, item.codeSnippet!)}
                        className="flex items-center space-x-1 hover:text-white transition"
                        title="Copy Code"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-rose-200/90 overflow-x-auto leading-relaxed">
                      <code>{item.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Interview Trap Alert */}
                {item.interviewTrap && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2 text-xs text-amber-200/90">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 font-mono text-[11px] block">Interview Pitfall & Trap:</strong>
                      <span className="text-[11px] leading-relaxed">{item.interviewTrap}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Tag Pills */}
              <div className="pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
                {item.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-neutral-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredInvariants.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="w-8 h-8 text-neutral-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No matching invariants found</h3>
          <p className="text-xs text-neutral-400">Try searching for "O(1)", "V8", "Hash", "Event Loop", or "Redis".</p>
        </div>
      )}

    </div>
  );
};
