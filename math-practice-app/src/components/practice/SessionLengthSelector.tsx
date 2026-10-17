import type { SessionLength } from "../../types/session";
import { SESSION_LENGTHS } from "../../types/session";
import { formatSessionLength } from "../../utils/format";

interface SessionLengthSelectorProps {
  selected: SessionLength;
  onChange: (length: SessionLength) => void;
}

export function SessionLengthSelector({ selected, onChange }: SessionLengthSelectorProps) {
  return (
    <fieldset className="selector">
      <legend>Session length</legend>
      <div className="option-grid">
        {SESSION_LENGTHS.map((length) => (
          <label
            key={String(length)}
            className={selected === length ? "radio-card is-selected" : "radio-card"}
          >
            <input
              type="radio"
              name="session-length"
              value={String(length)}
              checked={selected === length}
              onChange={() => onChange(length)}
            />
            <span>
              <strong>{formatSessionLength(length)}</strong>
              {selected === length ? <span className="option-status">Selected</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
