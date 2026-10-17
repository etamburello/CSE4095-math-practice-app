import type { DifficultyLevel, MathOperation } from "./question";
import type { SessionLength } from "./session";

export interface AppSettings {
  soundEffects: boolean;
  cardAnimation: boolean;
  showExplanations: boolean;
  feedbackMessages: boolean;
  allowNegativeAnswers: boolean;
  defaultSessionLength: SessionLength;
  defaultDifficulty: DifficultyLevel;
  defaultOperations: MathOperation[];
  masteryThreshold: number;
}

export const DEFAULT_MASTERY_THRESHOLD = 3;

export const DEFAULT_SETTINGS: AppSettings = {
  soundEffects: true,
  cardAnimation: true,
  showExplanations: true,
  feedbackMessages: true,
  allowNegativeAnswers: false,
  defaultSessionLength: 10,
  defaultDifficulty: 1,
  defaultOperations: ["addition"],
  masteryThreshold: DEFAULT_MASTERY_THRESHOLD,
};
