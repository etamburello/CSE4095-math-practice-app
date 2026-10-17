import type { MistakePattern } from "../types/mistake";
import type { MathOperation, Question } from "../types/question";
import { MATH_OPERATIONS } from "../types/question";
import { createId } from "../utils/ids";
import type { Rng } from "../utils/math";

export function patternKey(pattern: {
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  difficulty: number;
}): string {
  return `${pattern.operation}:${pattern.firstOperand}:${pattern.secondOperand}:${pattern.difficulty}`;
}

export function upsertIncorrectPattern(
  patterns: readonly MistakePattern[],
  question: Question,
  now: string,
): MistakePattern[] {
  const key = patternKey(question);
  const existing = patterns.find((pattern) => patternKey(pattern) === key);
  if (!existing) {
    return [
      ...patterns,
      {
        id: createId(),
        operation: question.operation,
        firstOperand: question.firstOperand,
        secondOperand: question.secondOperand,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        incorrectCount: 1,
        similarCorrectCount: 0,
        lastIncorrectAt: now,
        mastered: false,
      },
    ];
  }
  return patterns.map((pattern) =>
    pattern.id === existing.id
      ? {
          ...pattern,
          incorrectCount: pattern.incorrectCount + 1,
          similarCorrectCount: 0,
          lastIncorrectAt: now,
          mastered: false,
        }
      : pattern,
  );
}

export function applyReviewOutcome(
  pattern: MistakePattern,
  correct: boolean,
  masteryThreshold: number,
  now: string,
): MistakePattern {
  if (correct) {
    const similarCorrectCount = pattern.similarCorrectCount + 1;
    return {
      ...pattern,
      similarCorrectCount,
      mastered: similarCorrectCount >= masteryThreshold,
    };
  }
  return {
    ...pattern,
    incorrectCount: pattern.incorrectCount + 1,
    similarCorrectCount: 0,
    lastIncorrectAt: now,
    mastered: false,
  };
}

export function updatePatternById(
  patterns: readonly MistakePattern[],
  patternId: string,
  correct: boolean,
  masteryThreshold: number,
  now: string,
): MistakePattern[] {
  return patterns.map((pattern) =>
    pattern.id === patternId
      ? applyReviewOutcome(pattern, correct, masteryThreshold, now)
      : pattern,
  );
}

export function priorityScore(pattern: MistakePattern, nowMs: number): number {
  const missedAt = Date.parse(pattern.lastIncorrectAt);
  const ageMs = Number.isNaN(missedAt) ? Number.POSITIVE_INFINITY : Math.max(0, nowMs - missedAt);
  const day = 1000 * 60 * 60 * 24;
  const recency = Math.max(0, 14 - ageMs / day);
  const needsPractice = Math.max(0, 3 - pattern.similarCorrectCount) * 5;
  return pattern.incorrectCount * 10 + recency + needsPractice;
}

export function prioritizePatterns(
  patterns: readonly MistakePattern[],
  rng: Rng = Math.random,
  nowMs = Date.now(),
): MistakePattern[] {
  const active = patterns.filter((pattern) => !pattern.mastered);
  const groups = new Map<number, MistakePattern[]>();
  for (const pattern of active) {
    const score = Math.round(priorityScore(pattern, nowMs));
    const group = groups.get(score) ?? [];
    group.push(pattern);
    groups.set(score, group);
  }
  const scores = [...groups.keys()].sort((left, right) => right - left);
  const ranked: MistakePattern[] = [];
  for (const score of scores) {
    const group = groups.get(score) ?? [];
    ranked.push(...shuffleGroup(group, rng));
  }
  return ranked;
}

function shuffleGroup(patterns: MistakePattern[], rng: Rng): MistakePattern[] {
  const copy = [...patterns];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }
  return copy;
}

export function activePatterns(patterns: readonly MistakePattern[]): MistakePattern[] {
  return patterns.filter((pattern) => !pattern.mastered);
}

export function masteredPatterns(patterns: readonly MistakePattern[]): MistakePattern[] {
  return patterns.filter((pattern) => pattern.mastered);
}

export function mostMissedOperations(patterns: readonly MistakePattern[]): MathOperation[] {
  const totals = new Map<MathOperation, number>();
  for (const operation of MATH_OPERATIONS) {
    totals.set(operation, 0);
  }
  for (const pattern of patterns) {
    totals.set(pattern.operation, (totals.get(pattern.operation) ?? 0) + pattern.incorrectCount);
  }
  let best = 0;
  for (const total of totals.values()) {
    if (total > best) {
      best = total;
    }
  }
  if (best === 0) {
    return [];
  }
  return MATH_OPERATIONS.filter((operation) => totals.get(operation) === best);
}

export function topMissedFacts(patterns: readonly MistakePattern[], limit = 5): MistakePattern[] {
  return [...patterns]
    .sort((left, right) => {
      if (right.incorrectCount !== left.incorrectCount) {
        return right.incorrectCount - left.incorrectCount;
      }
      return Date.parse(right.lastIncorrectAt) - Date.parse(left.lastIncorrectAt);
    })
    .slice(0, limit);
}
