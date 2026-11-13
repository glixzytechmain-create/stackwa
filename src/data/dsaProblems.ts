import { DsaProblem } from '../types';

export const DSA_PROBLEMS: DsaProblem[] = [
  {
    id: 'stock-price-maximizer',
    title: 'Apple Stocks — Best Time to Buy and Sell',
    difficulty: 'Easy',
    category: 'Greedy Algorithms / Arrays',
    companyTags: ['Apple', 'Google', 'Meta'],
    description: `Suppose we could access yesterday's stock prices as an array, where the indices are the time (in minutes) past trade opening time, which was 9:30am and the values are the price (in US dollars) of one share of Apple stock.

Write an efficient function that takes an array of stock prices and returns the best profit I could have made from one purchase and one sale of one share of Apple stock yesterday.

Note: You must buy before you sell. You may not buy and sell in the same time step (at least 1 minute must pass).`,
    examples: [
      {
        input: 'stockPrices = [10, 7, 5, 8, 11, 9]',
        output: '6',
        explanation: 'Buy for $5 and sell for $11 gives a profit of $6 (11 - 5 = 6).'
      },
      {
        input: 'stockPrices = [10, 8, 6, 4, 2]',
        output: '-2',
        explanation: 'If the price keeps falling, the best profit is a loss of -$2 (buy at $4, sell at $2 or buy at $8, sell at $6).'
      }
    ],
    constraints: [
      'The array stockPrices contains at least 2 prices.',
      'Prices can be all decreasing (negative profit allowed).',
      'Time complexity target: O(n).',
      'Space complexity target: O(1).'
    ],
    starterCode: {
      javascript: `function getMaxProfit(stockPrices) {
  // Calculate the max profit
  
  return 0;
}`,
      python: `def get_max_profit(stock_prices):
    # Calculate the max profit
    pass`
    },
    solutionCode: {
      javascript: `function getMaxProfit(stockPrices) {
  if (stockPrices.length < 2) {
    throw new Error('Getting a profit requires at least 2 prices');
  }

  // We'll greedily update minPrice and maxProfit
  let minPrice = stockPrices[0];
  let maxProfit = stockPrices[1] - stockPrices[0];

  for (let i = 1; i < stockPrices.length; i++) {
    const currentPrice = stockPrices[i];
    const potentialProfit = currentPrice - minPrice;

    // Update maxProfit if we can do better
    maxProfit = Math.max(maxProfit, potentialProfit);

    // Update minPrice so it's always the lowest seen so far
    minPrice = Math.min(minPrice, currentPrice);
  }

  return maxProfit;
}`,
      python: `def get_max_profit(stock_prices):
    if len(stock_prices) < 2:
        raise ValueError('Getting a profit requires at least 2 prices')

    min_price = stock_prices[0]
    max_profit = stock_prices[1] - stock_prices[0]

    for current_price in stock_prices[1:]:
        potential_profit = current_price - min_price
        max_profit = max(max_profit, potential_profit)
        min_price = min(min_price, current_price)

    return max_profit`
    },
    timeComplexity: 'O(n) time',
    spaceComplexity: 'O(1) additional space',
    interviewCakePedagogy: {
      conceptBreakdown: `The brute force approach compares every pair of buy and sell times, taking O(n²) time.
Instead of checking every pair, we can use a Greedy Approach: loop through the list once, while tracking the lowest price seen so far and the highest profit possible so far.`,
      commonPitfalls: [
        'Initializing maxProfit to 0 instead of prices[1] - prices[0] (fails when prices only drop).',
        'Buying and selling on the exact same minute (must be at least 1 minute apart).',
        'Calculating maxProfit before updating minPrice (or vice-versa, causing you to sell before buying).'
      ]
    },
    scrimbaEmbedId: 'c2L4Nku2',
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Vault 1: Input Guarantees & Constraints',
        metaClue: 'Stuck on edge cases when prices only drop?',
        content: `What should happen if the prices keep falling all day (e.g., [9, 7, 4, 1])? Can you return 0 (no trade), or are you forced to buy and sell at the best possible time (even if it's negative profit)? In this problem, we must return the least negative loss!`,
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Vault 2: The Greedy Single-Pass Paradigm',
        metaClue: 'Want to optimize from O(n²) to O(n)?',
        content: `A brute force O(n²) tests all pairs. But as you walk through the array from left to right at index i, what is the best possible price to have bought at? It's simply the minimum price seen anywhere from index 0 to i-1! Can we track that in a single variable?`,
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Vault 3: Subsumed Losses & Initialization',
        metaClue: 'Watch out for maxProfit initialization traps!',
        content: `Be careful! If all prices are going down, maxProfit will be negative. If you initialize maxProfit to 0, your function will return 0 instead of the real maximum profit (like -2). Initialize maxProfit to stockPrices[1] - stockPrices[0] and minPrice to stockPrices[0]!`,
        revealed: false
      }
    ]
  },
  {
    id: 'merging-meeting-times',
    title: 'Calendar Sync — Merging Meeting Times',
    difficulty: 'Medium',
    category: 'Sorting & Greedy',
    companyTags: ['Google', 'Microsoft', 'Uber'],
    description: `Your company built an in-house calendar tool. They want to add a feature that shows the times in a day when everyone is available.

To do this, you’ll need to know when any team member is in a meeting. Write a function mergeRanges() that takes an array of multiple meeting time ranges and returns an array of condensed ranges.

For example, given:
  [{ startTime: 0,  endTime: 1 },
   { startTime: 3,  endTime: 5 },
   { startTime: 4,  endTime: 8 },
   { startTime: 10, endTime: 12 },
   { startTime: 9,  endTime: 10 }]

Your function should return:
  [{ startTime: 0, endTime: 1 },
   { startTime: 3, endTime: 8 },
   { startTime: 9, endTime: 12 }]`,
    examples: [
      {
        input: '[{ startTime: 1, endTime: 3 }, { startTime: 2, endTime: 4 }]',
        output: '[{ startTime: 1, endTime: 4 }]',
        explanation: 'Meetings overlap from time 2 to 3, so they merge into 1 to 4.'
      },
      {
        input: '[{ startTime: 1, endTime: 2 }, { startTime: 2, endTime: 3 }]',
        output: '[{ startTime: 1, endTime: 3 }]',
        explanation: 'Meetings touch back-to-back at 2, so they merge.'
      }
    ],
    constraints: [
      'Meeting times are given as integer numbers of 30-minute blocks past 9:00am.',
      'Meetings may be provided in arbitrary unordered sequence.',
      'Target time complexity: O(n log n) due to sorting.',
      'Target space complexity: O(n).'
    ],
    starterCode: {
      javascript: `function mergeRanges(meetings) {
  // Merge overlapping meeting ranges
  
  return [];
}`,
      python: `def merge_ranges(meetings):
    # Merge overlapping meeting ranges
    pass`
    },
    solutionCode: {
      javascript: `function mergeRanges(meetings) {
  const sortedMeetings = [...meetings].sort((a, b) => a.startTime - b.startTime);
  const mergedMeetings = [sortedMeetings[0]];

  for (let i = 1; i < sortedMeetings.length; i++) {
    const currentMeeting = sortedMeetings[i];
    const lastMergedMeeting = mergedMeetings[mergedMeetings.length - 1];

    if (currentMeeting.startTime <= lastMergedMeeting.endTime) {
      lastMergedMeeting.endTime = Math.max(lastMergedMeeting.endTime, currentMeeting.endTime);
    } else {
      mergedMeetings.push(currentMeeting);
    }
  }

  return mergedMeetings;
}`,
      python: `def merge_ranges(meetings):
    sorted_meetings = sorted(meetings, key=lambda x: x['start_time'])
    merged = [sorted_meetings[0]]

    for current in sorted_meetings[1:]:
        last_merged = merged[-1]
        if current['start_time'] <= last_merged['end_time']:
            last_merged['end_time'] = max(last_merged['end_time'], current['end_time'])
        else:
            merged.append(current)

    return merged`
    },
    timeComplexity: 'O(n log n) time',
    spaceComplexity: 'O(n) space',
    interviewCakePedagogy: {
      conceptBreakdown: `What if the meetings were already sorted by start time?
Once sorted, any meeting that could possibly overlap with our current meeting must come immediately next in line! This turns a complex search into a clean linear sweep.`,
      commonPitfalls: [
        'Assuming meetings are already ordered by start time.',
        'Not handling meetings that touch at exact boundary (startTime == endTime).',
        'Forgetting that a meeting can be completely enveloped by another (e.g. [1, 10] and [2, 5]).'
      ]
    },
    scrimbaEmbedId: 'c8D4Pka1',
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Vault 1: Unordered Interval Sequencing',
        metaClue: 'What if meetings are out of chronological order?',
        content: `What happens if the meetings aren't in order? What if a meeting later in the array starts before an earlier meeting? Sorting by startTime first simplifies this problem drastically!`,
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Vault 2: Overlap Boundary Condition',
        metaClue: 'How to test if two intervals touch or overlap?',
        content: `If we sort by startTime, how can we check if meeting B overlaps with meeting A? If B.startTime <= A.endTime, they overlap! How do you compute the new endTime? Use Math.max(A.endTime, B.endTime).`,
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Vault 3: Subsumed & Contained Meetings',
        metaClue: 'What if meeting B is completely inside meeting A?',
        content: `Notice that one meeting could be entirely inside another (e.g., [1, 8] and [2, 5]). Make sure you don't overwrite endTime with 5; always keep Math.max(last.endTime, current.endTime)!`,
        revealed: false
      }
    ]
  },
  {
    id: 'inflight-entertainment',
    title: 'Two-Movie Match — In-Flight Entertainment',
    difficulty: 'Easy',
    category: 'Hashing / Hash Sets',
    companyTags: ['Netflix', 'Amazon', 'Spotify'],
    description: `You've built an in-flight entertainment system with a catalog of movie lengths. Users want to pick exactly two movies that match their flight length perfectly so the movies fill the entire duration of the flight.

Write a function canTwoMoviesFillFlight(flightLength, movieLengths) that takes an integer flightLength (in minutes) and an array of integers movieLengths (in minutes) and returns a boolean indicating whether there are two numbers in movieLengths whose sum equals flightLength.

Assume users won't watch the same movie twice.`,
    examples: [
      {
        input: 'flightLength = 120, movieLengths = [60, 40, 75, 80]',
        output: 'true',
        explanation: '40 + 80 = 120, which matches flightLength.'
      },
      {
        input: 'flightLength = 120, movieLengths = [60, 40, 75]',
        output: 'false',
        explanation: 'No two movies add up to 120 (a user cannot pick the 60-minute movie twice).'
      }
    ],
    constraints: [
      'Target time complexity: O(n).',
      'Target space complexity: O(n).',
      'You cannot pick the same movie index twice.'
    ],
    starterCode: {
      javascript: `function canTwoMoviesFillFlight(flightLength, movieLengths) {
  // Determine if two movies sum to flightLength
  
  return false;
}`,
      python: `def can_two_movies_fill_flight(flight_length, movie_lengths):
    # Determine if two movies sum to flight_length
    pass`
    },
    solutionCode: {
      javascript: `function canTwoMoviesFillFlight(flightLength, movieLengths) {
  const movieLengthsSeen = new Set();

  for (let i = 0; i < movieLengths.length; i++) {
    const currentMovieLength = movieLengths[i];
    const matchingSecondMovieLength = flightLength - currentMovieLength;

    if (movieLengthsSeen.has(matchingSecondMovieLength)) {
      return true;
    }

    movieLengthsSeen.add(currentMovieLength);
  }

  return false;
}`,
      python: `def can_two_movies_fill_flight(flight_length, movie_lengths):
    movie_lengths_seen = set()

    for first_movie_length in movie_lengths:
        matching_second_movie_length = flight_length - first_movie_length
        if matching_second_movie_length in movie_lengths_seen:
            return True
        movie_lengths_seen.add(first_movie_length)

    return False`
    },
    timeComplexity: 'O(n) time',
    spaceComplexity: 'O(n) space',
    interviewCakePedagogy: {
      conceptBreakdown: `This is the classic Two-Sum problem. The brute force solution checks every pair in O(n²).
Instead, by using a Hash Set, we can look up the complementary movie (flightLength - currentLength) in O(1) time as we traverse.`,
      commonPitfalls: [
        'Adding the current movie to the set before checking if its complement exists (causes false positive when flightLength is 120 and movie is 60).',
        'Checking against an array with .includes() which turns lookup back into O(n), making total runtime O(n²).'
      ]
    },
    scrimbaEmbedId: 'cK6vNku9',
    hints: [
      {
        id: 1,
        tier: 'Clarifying Questions',
        title: 'Vault 1: Identical Movie Index Protection',
        metaClue: 'Can you watch the exact same movie twice?',
        content: `If flightLength is 120 and there is a 60-minute movie, can we watch that same movie twice? No! So we must ensure the pair consists of two distinct indices.`,
        revealed: false
      },
      {
        id: 2,
        tier: 'Data Structure Clue',
        title: 'Vault 2: Instant O(1) Hash Complement',
        metaClue: 'What data structure gives O(1) lookup?',
        content: `For each movie length L, what is the exact second movie length needed? Target is (flightLength - L). What data structure gives us O(1) instant lookup to see if we've already seen that complement? A Hash Set!`,
        revealed: false
      },
      {
        id: 3,
        tier: 'Edge Case & Complexity',
        title: 'Vault 3: The Insertion Order Trap',
        metaClue: 'Check complement BEFORE or AFTER set.add()?',
        content: `Check if the complement is in your set BEFORE adding the current movie to the set. That way, a 60-minute movie won't match with itself!`,
        revealed: false
      }
    ]
  }
];
