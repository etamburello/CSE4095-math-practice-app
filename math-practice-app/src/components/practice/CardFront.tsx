import type { Question } from "../../types/question";
import { spokenQuestion } from "../../utils/format";
import { AnswerChoice } from "./AnswerChoice";
import { Button } from "../common/Button";

interface CardFrontProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number | null;
  selectedAnswer: number | null;
  onSelect: (choice: number) => void;
  onFlip: () => void;
  hidden?: boolean;
}

export function CardFront({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelect,
  onFlip,
  hidden = false,
}: CardFrontProps) {
  const progressLabel =
    totalQuestions === null
      ? `Question ${questionNumber}`
      : `Question ${questionNumber} of ${totalQuestions}`;

  return (
    <div className="card-face card-front" id="card-front" aria-hidden={hidden} inert={hidden}>
      <p className="question-count">{progressLabel}</p>
      <p
        className="question-text"
        aria-label={spokenQuestion(
          question.operation,
          question.firstOperand,
          question.secondOperand,
        )}
      >
        {question.displayText} = ?
      </p>
      <div className="choice-grid">
        {question.choices.map((choice, index) => (
          <AnswerChoice
            key={`${question.id}-${choice}`}
            choice={choice}
            index={index}
            selected={selectedAnswer === choice}
            disabled={false}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="card-actions">
        <Button
          onClick={onFlip}
          disabled={selectedAnswer === null}
          aria-expanded={false}
          aria-controls="card-back"
        >
          Flip Card
        </Button>
      </div>
      <p className="hint">Choose an answer, then flip the card. Keys 1 to 4 pick an answer.</p>
    </div>
  );
}
