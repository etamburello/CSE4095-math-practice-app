interface AnswerChoiceProps {
  choice: number;
  index: number;
  selected: boolean;
  disabled: boolean;
  onSelect: (choice: number) => void;
}

export function AnswerChoice({ choice, index, selected, disabled, onSelect }: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className={selected ? "choice is-selected" : "choice"}
      aria-pressed={selected}
      aria-label={`Answer ${index + 1}: ${choice}`}
      disabled={disabled}
      onClick={() => onSelect(choice)}
    >
      <span className="choice-index" aria-hidden="true">
        {index + 1}
      </span>
      <span className="choice-value">{choice}</span>
      {selected ? (
        <span className="choice-status">Selected</span>
      ) : (
        <span className="choice-status"> </span>
      )}
    </button>
  );
}
