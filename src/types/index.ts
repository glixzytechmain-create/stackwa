export type TabType = 'dsa' | 'ui-design' | 'mock-interview' | 'dashboard';

export interface ProgressiveHint {
  id: number;
  tier: 'Clarifying Questions' | 'Data Structure Clue' | 'Edge Case & Complexity';
  title: string;
  content: string;
  revealed: boolean;
}

export interface DsaProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  companyTags: string[];
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  starterCode: {
    javascript: string;
    python: string;
  };
  solutionCode: {
    javascript: string;
    python: string;
  };
  timeComplexity: string;
  spaceComplexity: string;
  interviewCakePedagogy: {
    conceptBreakdown: string;
    commonPitfalls: string[];
  };
  scrimbaEmbedId?: string; // Scrimba interactive embed ID
  hints: ProgressiveHint[];
}

export interface UiComponentItem {
  id: string;
  name: string;
  type: 'container' | 'atom' | 'molecule' | 'organism';
  description: string;
  stateUsed: string[];
  props: string[];
}

export interface UiDesignChallenge {
  id: string;
  title: string;
  company: string;
  patternType: 'Modal Flow' | 'Feed & Infinite Scroll' | 'Checkout & Cart' | 'Command Palette' | 'Filter & Drawer';
  mobbinScreenUrl: string; // Screenshot or SVG representation
  appContext: string;
  userStory: string;
  keyRequirements: string[];
  edgeCases: {
    scenario: string;
    expectedBehavior: string;
  }[];
  recommendedComponentTree: UiComponentItem[];
  stateArchitectureGuide: {
    localState: string[];
    globalState: string[];
    serverCacheState: string[];
  };
  interactiveQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  isHint?: boolean;
}

export interface InterviewScorecard {
  overallScore: number; // 0-100
  problemSolving: number; // 0-100
  systemArchitecture: number; // 0-100
  communication: number; // 0-100
  strengths: string[];
  improvements: string[];
  summary: string;
}
