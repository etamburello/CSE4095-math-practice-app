import type { Question } from "../../types/question";
import { CardBack } from "./CardBack";
import { CardFront } from "./CardFront";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number | null;
  selectedAnswer: number | null;
  isFlipped: boolean;
  showExplanation: boolean;
  feedbackMessage: string | null;
  animationsEnabled: boolean;
  onSelect: (choice: number) => void;
  onFlip: () => void;
  onResult: (correct: boolean) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isFlipped,
  showExplanation,
  feedbackMessage,
  animationsEnabled,
  onSelect,
  onFlip,
  onResult,
}: QuestionCardProps) {
  const front = (
    <CardFront
      question={question}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      selectedAnswer={selectedAnswer}
      onSelect={onSelect}
      onFlip={onFlip}
      hidden={animationsEnabled && isFlipped}
    />
  );
  const back = (
    <CardBack
      question={question}
      selectedAnswer={selectedAnswer}
      showExplanation={showExplanation}
      feedbackMessage={feedbackMessage}
      locked={feedbackMessage !== null}
      onResult={onResult}
      hidden={animationsEnabled && !isFlipped}
    />
  );

  if (!animationsEnabled) {
    return (
      <article className="question-card" aria-live="polite">
        {isFlipped ? back : front}
      </article>
    );
  }

  return (
    <article className="question-card">
      <div className="card-scene">
        <div className={isFlipped ? "card-inner is-flipped" : "card-inner"}>
          {front}
          {back}
        </div>
      </div>
    </article>
  );
}
