import type { PracticeMode } from "../../types/session";

interface ModeSelectorProps {
  selected: PracticeMode;
  activeCount: number;
  levelCount: number;
  onChange: (mode: PracticeMode) => void;
}

export function ModeSelector({ selected, activeCount, levelCount, onChange }: ModeSelectorProps) {
  const reviewDisabled = activeCount === 0;
  return (
    <fieldset className="selector">
      <legend>Practice type</legend>
      <div className="option-list">
        <label className={selected === "regular" ? "radio-card is-selected" : "radio-card"}>
          <input
            type="radio"
            name="practice-mode"
            value="regular"
            checked={selected === "regular"}
            onChange={() => onChange("regular")}
          />
          <span>
            <strong>Regular practice</strong>
            <span className="option-description">
              New questions from the operations you picked.
            </span>
          </span>
        </label>
        <label className={selected === "mistake-review" ? "radio-card is-selected" : "radio-card"}>
          <input
            type="radio"
            name="practice-mode"
            value="mistake-review"
            checked={selected === "mistake-review"}
            disabled={reviewDisabled}
            onChange={() => onChange("mistake-review")}
          />
          <span>
            <strong>Practice mistakes</strong>
            <span className="option-description">
              {activeCount === 0
                ? "This is unavailable until a question is marked wrong."
                : `${activeCount} saved mistake${activeCount === 1 ? "" : "s"}. ${levelCount} match this level.`}
            </span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
