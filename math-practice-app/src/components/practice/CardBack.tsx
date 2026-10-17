import type { Question } from "../../types/question";
import { explainQuestion, spokenQuestion } from "../../utils/format";
import { Button } from "../common/Button";

interface CardBackProps {
  question: Question;
  selectedAnswer: number | null;
  showExplanation: boolean;
  feedbackMessage: string | null;
  locked: boolean;
  onResult: (correct: boolean) => void;
  hidden?: boolean;
}

export function CardBack({
  question,
  selectedAnswer,
  showExplanation,
  feedbackMessage,
  locked,
  onResult,
  hidden = false,
}: CardBackProps) {
  const matches = selectedAnswer === question.correctAnswer;
  return (
    <div className="card-face card-back" id="card-back" aria-hidden={hidden} inert={hidden}>
      <p className="question-text question-text-small">
        <span className="sr-only">
          {spokenQuestion(question.operation, question.firstOperand, question.secondOperand)} equals{" "}
          {question.correctAnswer}.
        </span>
        <span aria-hidden="true">
          {question.displayText} = {question.correctAnswer}
        </span>
      </p>
      <dl className="answer-summary">
        <div>
          <dt>Correct answer</dt>
          <dd>{question.correctAnswer}</dd>
        </div>
        <div>
          <dt>Your answer</dt>
          <dd>{selectedAnswer ?? "None"}</dd>
        </div>
      </dl>
      <p className={matches ? "match-note match-yes" : "match-note match-no"}>
        {matches
          ? "Your choice matches the correct answer."
          : "Your choice is different from the correct answer."}
      </p>
      {showExplanation ? <p className="explanation">{explainQuestion(question)}</p> : null}
      {feedbackMessage ? (
        <p className="feedback" role="status">
          {feedbackMessage}
        </p>
      ) : null}
      <div className="card-actions card-actions-split">
        <Button variant="secondary" onClick={() => onResult(true)} disabled={locked}>
          I Got It Right
        </Button>
        <Button variant="ghost" onClick={() => onResult(false)} disabled={locked}>
          I Got It Wrong
        </Button>
      </div>
    </div>
  );
}
