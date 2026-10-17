import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { OperationSelector } from "./OperationSelector";
import { QuestionCard } from "./QuestionCard";
import { useState } from "react";
import type { MathOperation, Question } from "../../types/question";

const question: Question = {
  id: "q1",
  operation: "addition",
  firstOperand: 2,
  secondOperand: 2,
  displayText: "2 + 2",
  correctAnswer: 4,
  choices: [3, 4, 5, 6],
  difficulty: 1,
  source: "regular",
};

function OperationHarness() {
  const [selected, setSelected] = useState<MathOperation[]>(["addition"]);
  return <OperationSelector selected={selected} onChange={setSelected} />;
}

describe("practice controls", () => {
  it("selects operations and offers all of them", async () => {
    const user = userEvent.setup();
    render(<OperationHarness />);
    const subtraction = screen.getByRole("button", { name: /Subtraction/ });
    await user.click(subtraction);
    expect(subtraction).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "All operations" }));
    for (const name of ["Addition", "Subtraction", "Multiplication", "Division"]) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
  });

  it("requires a choice before flipping", () => {
    render(
      <QuestionCard
        question={question}
        questionNumber={1}
        totalQuestions={5}
        selectedAnswer={null}
        isFlipped={false}
        showExplanation
        feedbackMessage={null}
        animationsEnabled={false}
        onSelect={() => undefined}
        onFlip={() => undefined}
        onResult={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Flip Card" })).toBeDisabled();
    expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
  });

  it("shows the back of the card and both result buttons", async () => {
    const user = userEvent.setup();
    const results: boolean[] = [];
    const view = render(
      <QuestionCard
        question={question}
        questionNumber={2}
        totalQuestions={5}
        selectedAnswer={4}
        isFlipped
        showExplanation
        feedbackMessage={null}
        animationsEnabled={false}
        onSelect={() => undefined}
        onFlip={() => undefined}
        onResult={(correct) => results.push(correct)}
      />,
    );
    expect(screen.getByText("Correct answer")).toBeInTheDocument();
    expect(screen.getAllByText("2 plus 2 equals 4.").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "I Got It Right" }));
    await user.click(screen.getByRole("button", { name: "I Got It Wrong" }));
    expect(results).toEqual([true, false]);

    view.rerender(
      <QuestionCard
        question={question}
        questionNumber={2}
        totalQuestions={5}
        selectedAnswer={4}
        isFlipped
        showExplanation={false}
        feedbackMessage="Nice work!"
        animationsEnabled={false}
        onSelect={() => undefined}
        onFlip={() => undefined}
        onResult={(correct) => results.push(correct)}
      />,
    );
    expect(screen.getByText("Nice work!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I Got It Right" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "I Got It Wrong" })).toBeDisabled();
  });
});

describe("ConfirmDialog", () => {
  it("confirms and cancels", async () => {
    const user = userEvent.setup();
    let confirmed = false;
    let cancelled = false;
    render(
      <ConfirmDialog
        title="Reset statistics?"
        message="Are you sure you want to erase all practice history and statistics?"
        confirmLabel="Erase history"
        onConfirm={() => {
          confirmed = true;
        }}
        onCancel={() => {
          cancelled = true;
        }}
      />,
    );
    expect(
      screen.getByText("Are you sure you want to erase all practice history and statistics?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancelled).toBe(true);
    expect(confirmed).toBe(false);
  });
});
