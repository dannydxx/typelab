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

export interface PersonalityMetric {
  label: string;
  value: number;
  level: string;
  description: string;
}

export interface RelationshipPositionDefinition {
  key: Dimension;
  label: string;
  left: string;
  right: string;
  interpretation: string;
}

export interface PersonalityV2 {
  englishName: string;
  shortDescription: string;
  summary: {
    headline: string;
    description: string;
    metrics: [PersonalityMetric, PersonalityMetric, PersonalityMetric];
  };
  relationshipPosition: [
    RelationshipPositionDefinition,
    RelationshipPositionDefinition,
    RelationshipPositionDefinition,
    RelationshipPositionDefinition,
  ];
  base: {
    headline: string;
    insight: string;
    description: string;
    keywords: [string, string, string];
    quote: string;
  };
  heart: {
    headline: string;
    insight: string;
    description: string;
    stages: [string, string, string, string, string];
  };
  safety: {
    headline: string;
    insight: string;
    description: string;
    formula: [string, string, string];
    quote: string;
  };
  boundaries: {
    headline: string;
    intro: string;
    items: [
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
    ];
  };
  attraction: {
    headline: string;
    description: string;
    tags: [string, string, string, string, string];
    hiddenAttraction: string;
  };
  needs: {
    headline: string;
    description: string;
    needs: [string, string, string, string];
    quote: string;
    outerVoice: string;
    innerVoice: string;
  };
  innerOS: [
    { situation: string; outer: string; inner: string },
    { situation: string; outer: string; inner: string },
  ];
  advice: [
    { situation: string; title: string; explanation: string; dontSay: string; trySay: string },
    { situation: string; title: string; explanation: string; dontSay: string; trySay: string },
    { situation: string; title: string; explanation: string; dontSay: string; trySay: string },
  ];
  share: {
    headline: string;
    quote: string;
    shortCopy: string;
  };
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
  v2?: PersonalityV2;
  report: PersonalityReport;
}

export interface StoredResult {
  attemptId: string;
  personalityId: string;
  scores: DimensionScores;
  completedAt: string;
}
