import { ProblemTestCase } from '../services/codeExecutionService';

export type TabType = 'dsa' | 'vaults' | 'sponsors' | 'settings' | 'shortcuts' | 'ui-design' | 'mock-interview' | 'dashboard' | 'roadmap';

export interface ProgressiveHint {
  id: number;
  tier: 'Clarifying Questions' | 'Data Structure Clue' | 'Edge Case & Complexity';
  title: string;
  metaClue: string; // The teaser displayed on vault hover (e.g. "Stuck on Time Complexity?")
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
  functionName: string; // Target function name to execute
  testCases: ProblemTestCase[];
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
  scrimbaEmbedId?: string;
  hints: ProgressiveHint[];
}

export interface UiComponentItem {
  id: string;
  name: string;
  type: 'container' | 'atom' | 'molecule' | 'organism';
  description: string;
  stateUsed: string[];
  props: string[];
  // X-Ray bounding box percentage coordinates on the Mobbin mockup screen
  xRayBox: {
    top: number; // percentage (0 - 100)
    left: number;
    width: number;
    height: number;
  };
}

export interface UiDesignChallenge {
  id: string;
  title: string;
  company: string;
  patternType: 'Modal Flow' | 'Feed & Infinite Scroll' | 'Checkout & Cart' | 'Command Palette' | 'Filter & Drawer';
  mobbinScreenUrl: string;
  appContext: string;
  userStory: string;
  keyRequirements: string[];
  edgeCases: {
    scenario: string;
    expectedBehavior: string;
    category: 'offline' | 'loading' | 'error' | 'empty';
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
  contextSnippet?: string; // If triggered via highlight-to-ask
}

export interface InterviewScorecard {
  candidateName: string;
  targetCompany: string;
  role: string;
  overallScore: number; // 0-100
  problemSolving: number; // 0-100
  systemArchitecture: number; // 0-100
  communication: number; // 0-100
  edgeCaseAwareness: number; // 0-100
  strengths: string[];
  improvements: string[];
  summary: string;
  verificationHash: string;
  timestamp: string;
}

export interface UserInterviewProfile {
  targetCompany: string;
  role: string;
  seniority: 'Intern' | 'Junior' | 'Mid-Level' | 'Senior';
  interviewDate: string;
  daysRemaining: number;
  focusAreas: string[];
  calendarConnected: boolean;
  onboardingCompleted: boolean;
  isGeneralPractice?: boolean;
}

export interface DayPlan {
  dayNumber: number;
  dateLabel: string;
  theme: string;
  dsaProblemId: string;
  uiChallengeId: string;
  dailyRitual: string;
  isCompleted: boolean;
}

export interface OnboardingMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export interface InterviewClarifyingQuestion {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

