export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  direction: "ltr" | "rtl";
  geminiInstruction: string;
  examplePhrase: string;
}

export interface DialectConfig {
  code: string;
  name: string;
  region: "North" | "South" | "East" | "West";
  description: string;
  fillerSample: string;
}

export interface PersonaConfig {
  code: string;
  name: string;
  avatar: string;
  themeColor: string;
  bgGradient: string;
  description: string;
  tagline: string;
  systemPrompt: string;
}

export interface MatchPreset {
  id: string;
  title: string;
  description: string;
  matchEvent: string;
  iconEmoji: string;
  category: "legendary" | "modern" | "gully" | "historic";
}

export interface GeneratedCommentary {
  id: string;
  matchEvent: string;
  script: string;
  language: string;
  dialect?: string;
  hybridMode?: string;
  persona: string;
  wordCount: number;
  estimatedDuration: number;
  createdAt: string;
}
