import type { DifficultyLevel } from "../../types/question";
import { DIFFICULTY_LEVELS } from "../../types/question";
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS } from "../../utils/format";

interface DifficultySelectorProps {
  selected: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
}

export function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <fieldset className="selector">
      <legend>Difficulty</legend>
      <div className="option-list">
        {DIFFICULTY_LEVELS.map((level) => (
          <label
            key={level}
            className={selected === level ? "radio-card is-selected" : "radio-card"}
          >
            <input
              type="radio"
              name="difficulty"
              value={level}
              checked={selected === level}
              onChange={() => onChange(level)}
            />
            <span>
              <strong>
                Level {level}: {DIFFICULTY_LABELS[level]}
              </strong>
              <span className="option-description">{DIFFICULTY_DESCRIPTIONS[level]}</span>
              {selected === level ? <span className="option-status">Selected</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
