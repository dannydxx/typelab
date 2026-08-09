export type Dimension = "security" | "closeness" | "expression" | "conflict";
export type AnswerValue = -2 | -1 | 1 | 2;

export interface QuestionOption {
  label: string;
  value: AnswerValue;
}

export interface Question {
  id: number;
  dimension: Dimension;
  prompt: string;
  options: QuestionOption[];
}

export interface DimensionScores {
  security: number;
  closeness: number;
  expression: number;
  conflict: number;
}

export interface PersonalityReport {
  base: string;
  inLove: string;
  securityNeed: string;
  pitfalls: string[];
  attraction: string;
  hiddenNeed: string;
  advice: string[];
}

export interface Personality {
  id: string;
  typeNumber: number;
  slug: string;
  name: string;
  animal: string;
  dimensions: [string, string, string, string];
  keywords: [string, string, string, string];
  tagline: string;
  poles: ["stable" | "sensitive", "independent" | "close", "restrained" | "direct", "calm" | "resolve"];
  image: string;
  primaryColor: string;
  secondaryColor: string;
  darkColor: string;
  visualKeywords: string[];
  report: PersonalityReport;
}

export interface StoredResult {
  attemptId: string;
  personalityId: string;
  scores: DimensionScores;
  completedAt: string;
}
