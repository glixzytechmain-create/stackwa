import { DsaProblem } from '../types';

export const DSA_PROBLEMS: DsaProblem[] = [
  {
    id: 'distributed-rate-limiter',
    title: 'Real-Time Sliding Window Request Arbiter',
    difficulty: 'Medium',
    category: 'Sliding Window & Hash Maps',
    companyTags: ['Stripe', 'Cloudflare', 'AWS'],
    description: `You are architecting an edge API gateway rate limiter. Given a chronologically ordered array of request timestamps in milliseconds and a rate limit rule (maximum 'k' requests within any 'windowMs' time window), determine whether all requests conform to the limit without triggering rate limit drops.

Return true if all requests are allowed, or false if any burst violates the window limit.`,
    functionName: 'isRateLimitConformant',
    constraints: [
      'Timestamps are strictly non-decreasing positive integers: 1 <= timestamps.length <= 10^5',
      '1 <= k <= 1000',
      '1 <= windowMs <= 10^6',
      'Target Time Complexity: O(n) single pass.',
      'Target Space Complexity: O(1) auxiliary space.'
    ],
    examples: [
      {
        input: 'timestamps = [1000, 1200, 1500, 2100], k = 3, windowMs = 1000',
        output: 'true',
        explanation: 'At any point, within 1000ms there are at most 3 requests.'
      },
      {
        input: 'timestamps = [1000, 1100, 1200, 1300], k = 3, windowMs = 1000',
        output: 'false',
        explanation: '4 requests arrive between 1000ms and 1300ms, exceeding k=3.'
      }
    ],
    testCases: [
      {
        title: 'Test 1: Steady traffic conformant',
        input: [[1000, 1200, 1500, 2100], 3, 1000],
        expected: true,
        inputStr: '[1000, 1200, 1500, 2100], k=3, window=1000'
      },
      {
        title: 'Test 2: Burst window violation',
        input: [[1000, 1100, 1200, 1300], 3, 1000],
        expected: false,
        inputStr: '[1000, 1100, 1200, 1300], k=3, window=1000'
      },
      {
        title: 'Test 3: Exact boundary window',
        input: [[1000, 2000, 3000], 1, 1000],
        expected: true,
        inputStr: '[1000, 2000, 3000], k=1, window=1000'
      }
    ],
    starterCode: {
      javascript: `function isRateLimitConformant(timestamps, k, windowMs) {
  // Implement two-pointer sliding window rate check
  
  return true;
}`,
      python: `def is_rate_limit_conformant(timestamps, k, window_ms):
    # Implement two-pointer sliding window rate check
    return True`
    },
    solutionCode: {
      javascript: `function isRateLimitConformant(timestamps, k, windowMs) {
  let left = 0;
  for (let right = 0; right < timestamps.length; right++) {
    while (timestamps[right] - timestamps[left] >= windowMs) {
      left++;
    }
    const currentWindowCount = right - left + 1;
    if (currentWindowCount > k) return false;
  }
  return true;
}`,
      python: `def is_rate_limit_conformant(timestamps, k, window_ms):
    left = 0
    for right in range(len(timestamps)):
        while timestamps[right] - timestamps[left] >= window_ms:
            left += 1
        if (right - left + 1) > k:
            return False
    return True`
    },
    timeComplexity: 'O(n) time',
    spaceComplexity: 'O(1) space',
    interviewCakePedagogy: {
      conceptBreakdown: 'Avoid nested O(n²) scans by taking advantage of monotonic ordering with a two-pointer sliding window.',
      commonPitfalls: [
        'Allocating sub-arrays or queues which incurs O(k) memory allocations',
        'Off-by-one errors on boundary conditions (>= windowMs vs > windowMs)'
      ]
    },
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Vault 1: Input Guarantees & Equality',
        metaClue: 'Wondering if timestamps are guaranteed sorted?',
        content: 'Timestamps are guaranteed non-decreasing. Are window boundaries inclusive or exclusive? A window of 1000ms starting at t=1000 expires at t=2000, so timestamps[right] - timestamps[left] >= windowMs indicates expiration.',
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Vault 2: Two-Pointer Monotonic Window',
        metaClue: 'Need O(n) runtime without extra allocations?',
        content: 'Because the array is sorted, both left and right pointers only move forward. As right advances, increment left until timestamps[right] - timestamps[left] < windowMs.',
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Vault 3: Single-Pass Invariant',
        metaClue: 'Ready to prove O(n) amortized complexity?',
        content: 'Since each index enters and exits the window at most once, the amortized cost per request is O(1), achieving O(n) total time in O(1) space.',
        revealed: false
      }
    ]
  },
  {
    id: 'idempotent-transaction-ledger',
    title: 'Transactional Ledger Conflict Detector',
    difficulty: 'Medium',
    category: 'Intervals & Sorting',
    companyTags: ['FinTech', 'Coinbase', 'Stripe'],
    description: `In a high-concurrency financial ledger, transactions with overlapping processing intervals cannot execute in parallel without acquiring an exclusive mutex.
Given an array of transaction intervals with startTime and endTime, merge all overlapping transaction windows and return the consolidated list of contiguous processing periods.`,
    functionName: 'mergeTransactionWindows',
    constraints: [
      '1 <= intervals.length <= 10^4',
      '0 <= startTime < endTime <= 10^9',
      'Target Time Complexity: O(n log n).',
      'Target Space Complexity: O(n).'
    ],
    examples: [
      {
        input: 'intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]',
        output: '[[1, 6], [8, 10], [15, 18]]',
        explanation: 'Intervals [1, 3] and [2, 6] overlap into [1, 6].'
      }
    ],
    testCases: [
      {
        title: 'Test 1: Standard overlapping intervals',
        input: [[[1, 3], [2, 6], [8, 10], [15, 18]]],
        expected: [[1, 6], [8, 10], [15, 18]],
        inputStr: '[[1,3],[2,6],[8,10],[15,18]]'
      },
      {
        title: 'Test 2: Subsumed interval',
        input: [[[1, 5], [2, 3]]],
        expected: [[1, 5]],
        inputStr: '[[1,5],[2,3]]'
      },
      {
        title: 'Test 3: Contiguous abutting boundaries',
        input: [[[1, 4], [4, 5]]],
        expected: [[1, 5]],
        inputStr: '[[1,4],[4,5]]'
      }
    ],
    starterCode: {
      javascript: `function mergeTransactionWindows(intervals) {
  // Merge overlapping transaction intervals
  
  return intervals;
}`,
      python: `def merge_transaction_windows(intervals):
    # Merge overlapping transaction intervals
    return intervals`
    },
    solutionCode: {
      javascript: `function mergeTransactionWindows(intervals) {
  if (intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    if (current[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}`,
      python: `def merge_transaction_windows(intervals):
    if len(intervals) <= 1:
        return intervals
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = [sorted_intervals[0]]
    for current in sorted_intervals[1:]:
        last_merged = merged[-1]
        if current[0] <= last_merged[1]:
            last_merged[1] = max(last_merged[1], current[1])
        else:
            merged.append(current)
    return merged`
    },
    timeComplexity: 'O(n log n) time',
    spaceComplexity: 'O(n) space',
    interviewCakePedagogy: {
      conceptBreakdown: 'Sort intervals by startTime. Once ordered, any interval can only overlap with its predecessor in the output stack.',
      commonPitfalls: ['Forgetting that an interval can be completely contained within another (e.g. [1, 5] and [2, 3])']
    },
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Vault 1: Order Guarantees',
        metaClue: 'Are intervals already sorted by startTime?',
        content: 'Do not assume intervals arrive pre-sorted. You must sort by start timestamp in O(n log n) first.',
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Vault 2: Sequential Invariant',
        metaClue: 'How to compare overlapping pairs?',
        content: 'Compare current interval start against merged[-1] end. If current[0] <= lastMerged[1], update lastMerged[1] = max(lastMerged[1], current[1]).',
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Vault 3: Subsumed Boundary Edge',
        metaClue: 'What if interval B ends BEFORE interval A ends?',
        content: 'Use Math.max(lastMerged[1], current[1]) so that a short meeting inside a long meeting does not shorten the end boundary.',
        revealed: false
      }
    ]
  },
  {
    id: 'lru-cache-eviction',
    title: 'High-Throughput LRU Eviction Stream',
    difficulty: 'Hard',
    category: 'Hash Map & Doubly Linked List',
    companyTags: ['Netflix', 'Meta', 'Google'],
    description: `Design a high-throughput caching eviction pipeline. Given a capacity 'capacity' and a series of operations in format ['GET', key] or ['PUT', key, value], execute all operations and return an array of outputs (for GET operations, return value or -1 if absent; for PUT, return null).`,
    functionName: 'simulateLruPipeline',
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls to get and put.',
      'Average Time Complexity per operation: O(1).'
    ],
    examples: [
      {
        input: 'capacity = 2, ops = [["PUT", 1, 1], ["PUT", 2, 2], ["GET", 1], ["PUT", 3, 3], ["GET", 2]]',
        output: '[null, null, 1, null, -1]',
        explanation: 'Key 2 is evicted when key 3 is inserted because key 1 was accessed by GET.'
      }
    ],
    testCases: [
      {
        title: 'Test 1: Standard LRU sequence',
        input: [2, [["PUT", 1, 1], ["PUT", 2, 2], ["GET", 1], ["PUT", 3, 3], ["GET", 2]]],
        expected: [null, null, 1, null, -1],
        inputStr: 'cap=2, [PUT 1, PUT 2, GET 1, PUT 3, GET 2]'
      },
      {
        title: 'Test 2: Key overwrite updates position',
        input: [2, [["PUT", 1, 10], ["PUT", 2, 20], ["PUT", 1, 100], ["PUT", 3, 30], ["GET", 2]]],
        expected: [null, null, null, null, -1],
        inputStr: 'cap=2, key 1 updated, key 2 evicted'
      }
    ],
    starterCode: {
      javascript: `function simulateLruPipeline(capacity, operations) {
  // Implement O(1) LRU pipeline
  
  return [];
}`,
      python: `def simulate_lru_pipeline(capacity, operations):
    # Implement O(1) LRU pipeline
    return []`
    },
    solutionCode: {
      javascript: `function simulateLruPipeline(capacity, operations) {
  const map = new Map();
  const results = [];

  for (const op of operations) {
    const action = op[0];
    const key = op[1];

    if (action === 'GET') {
      if (!map.has(key)) {
        results.push(-1);
      } else {
        const val = map.get(key);
        map.delete(key);
        map.set(key, val);
        results.push(val);
      }
    } else if (action === 'PUT') {
      const val = op[2];
      if (map.has(key)) {
        map.delete(key);
      } else if (map.size >= capacity) {
        const oldestKey = map.keys().next().value;
        map.delete(oldestKey);
      }
      map.set(key, val);
      results.push(null);
    }
  }
  return results;
}`,
      python: `from collections import OrderedDict

def simulate_lru_pipeline(capacity, operations):
    cache = OrderedDict()
    results = []

    for op in operations:
        action = op[0]
        key = op[1]
        if action == 'GET':
            if key not in cache:
                results.append(-1)
            else:
                cache.move_to_end(key)
                results.append(cache[key])
        elif action == 'PUT':
            val = op[2]
            if key in cache:
                cache.move_to_end(key)
            cache[key] = val
            if len(cache) > capacity:
                cache.popitem(last=False)
            results.append(None)
    return results`
    },
    timeComplexity: 'O(1) average per operation',
    spaceComplexity: 'O(capacity) space',
    interviewCakePedagogy: {
      conceptBreakdown: 'Combine a Hash Map for O(1) key lookups with a Doubly Linked List for O(1) node repositioning.',
      commonPitfalls: ['Linear scans O(n) to find the least recently used element', 'Failing to refresh priority on GET access']
    },
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Vault 1: Eviction Priority Invariant',
        metaClue: 'Does GET update the access timestamp?',
        content: 'Yes! Both GET and PUT operations count as an access and must move the accessed key to the most recently used position.',
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Vault 2: Map Insertion Order Property',
        metaClue: 'Can JavaScript Map or Python OrderedDict achieve O(1)?',
        content: 'JavaScript Map preserves insertion order. Re-inserting with delete() and set() moves an entry to the end in O(1).',
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Vault 3: Overwriting Existing Keys',
        metaClue: 'What if a key already exists on PUT?',
        content: 'If key already exists, overwrite its value and update its position without evicting a separate key.',
        revealed: false
      }
    ]
  }
];
