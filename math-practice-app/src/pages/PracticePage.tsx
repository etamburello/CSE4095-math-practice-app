import { useEffect, useRef, useState } from "react";
import { Navigate, useBlocker } from "react-router-dom";
import { Button } from "../components/common/Button";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { ProgressBar } from "../components/practice/ProgressBar";
import { QuestionCard } from "../components/practice/QuestionCard";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { spokenQuestion } from "../utils/format";

export default function PracticePage() {
  const practice = usePracticeSession();
  const reducedMotion = usePrefersReducedMotion();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { state, selectAnswer, flip, report, finish } = practice;
  const session = state.currentSession;
  const question = state.currentQuestion;

  const skipBlock = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (skipBlock.current || nextLocation.pathname === "/practice/summary") {
      return false;
    }
    return Boolean(
      session && !session.completedAt && currentLocation.pathname !== nextLocation.pathname,
    );
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (!question || state.isCardFlipped || state.feedbackMessage) {
        return;
      }
      const index = ["1", "2", "3", "4"].indexOf(event.key);
      if (index === -1) {
        return;
      }
      const choice = question.choices[index];
      if (choice === undefined) {
        return;
      }
      event.preventDefault();
      selectAnswer(choice);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, selectAnswer, state.feedbackMessage, state.isCardFlipped]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [session]);

  if (!session || !question) {
    if (leaving) {
      return null;
    }
    if (state.summarySession) {
      return <Navigate to="/practice/summary" replace />;
    }
    return <Navigate to="/practice/setup" replace />;
  }

  const total = session.sessionLength === "continuous" ? null : session.sessionLength;
  const questionNumber = state.currentQuestionIndex + 1;
  const announcement = state.isCardFlipped
    ? `The correct answer is ${question.correctAnswer}. You selected ${state.selectedAnswer}.`
    : `Question ${questionNumber}. ${spokenQuestion(question.operation, question.firstOperand, question.secondOperand)}.`;
  const animations = state.settings.cardAnimation && !reducedMotion;

  return (
    <section className="practice">
      <h1 className="sr-only">Practice session</h1>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {total !== null ? (
        <ProgressBar
          completed={session.attempted}
          total={total}
          label={`Completed ${session.attempted} of ${total} questions`}
        />
      ) : (
        <div className="continuous-bar">
          <p>Question {questionNumber}</p>
          <Button variant="ghost" onClick={() => setConfirmEnd(true)}>
            End Session
          </Button>
        </div>
      )}
      <QuestionCard
        question={question}
        questionNumber={questionNumber}
        totalQuestions={total}
        selectedAnswer={state.selectedAnswer}
        isFlipped={state.isCardFlipped}
        showExplanation={state.settings.showExplanations}
        feedbackMessage={state.feedbackMessage}
        animationsEnabled={animations}
        onSelect={selectAnswer}
        onFlip={flip}
        onResult={report}
      />
      <p className="session-score">
        Correct {session.correct}. Incorrect {session.incorrect}.
      </p>
      {confirmEnd ? (
        <ConfirmDialog
          title="End this session?"
          message="You can stop now and see a summary of the questions you already answered."
          confirmLabel="End session"
          onConfirm={() => {
            skipBlock.current = true;
            setConfirmEnd(false);
            finish();
          }}
          onCancel={() => setConfirmEnd(false)}
        />
      ) : null}
      {blocker.state === "blocked" ? (
        <ConfirmDialog
          title="Leave this practice?"
          message="Your current session is still going. You can stay, or end it and leave."
          confirmLabel="End and leave"
          cancelLabel="Keep practicing"
          onConfirm={() => {
            skipBlock.current = true;
            setLeaving(true);
            finish({ summary: false });
            blocker.proceed();
          }}
          onCancel={() => blocker.reset()}
        />
      ) : null}
    </section>
  );
}
