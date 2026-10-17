import type { MathOperation } from "../../types/question";
import { MATH_OPERATIONS } from "../../types/question";
import { OPERATION_LABELS, operationSymbol } from "../../utils/format";

interface OperationSelectorProps {
  selected: MathOperation[];
  onChange: (operations: MathOperation[]) => void;
}

export function OperationSelector({ selected, onChange }: OperationSelectorProps) {
  const toggle = (operation: MathOperation) => {
    if (selected.includes(operation)) {
      onChange(selected.filter((item) => item !== operation));
      return;
    }
    onChange([...selected, operation]);
  };

  return (
    <fieldset className="selector">
      <legend>Operations</legend>
      <p className="selector-help">Choose one or more. More than one mixes them together.</p>
      <div className="option-grid">
        {MATH_OPERATIONS.map((operation) => {
          const pressed = selected.includes(operation);
          return (
            <button
              key={operation}
              type="button"
              className={pressed ? "option is-selected" : "option"}
              aria-pressed={pressed}
              onClick={() => toggle(operation)}
            >
              <span className="option-symbol" aria-hidden="true">
                {operationSymbol(operation)}
              </span>
              <span>{OPERATION_LABELS[operation]}</span>
              {pressed ? <span className="option-status">Selected</span> : null}
            </button>
          );
        })}
      </div>
      <button type="button" className="text-button" onClick={() => onChange([...MATH_OPERATIONS])}>
        All operations
      </button>
    </fieldset>
  );
}
