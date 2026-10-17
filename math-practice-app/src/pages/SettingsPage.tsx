import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { DifficultySelector } from "../components/practice/DifficultySelector";
import { OperationSelector } from "../components/practice/OperationSelector";
import { SessionLengthSelector } from "../components/practice/SessionLengthSelector";
import { useApp } from "../hooks/useApp";
import type { AppSettings } from "../types/settings";

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  const settings = state.settings;

  const update = (patch: Partial<AppSettings>) => {
    dispatch({ type: "updateSettings", settings: { ...settings, ...patch } });
  };

  return (
    <section className="settings">
      <h1>Settings</h1>
      <p className="welcome">
        These choices are saved in this browser. The app does not ask for a name and does not send
        answers anywhere.
      </p>
      <fieldset className="selector">
        <legend>Practice comfort</legend>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.soundEffects}
            onChange={(event) => update({ soundEffects: event.target.checked })}
          />
          <span>Sound effects</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.cardAnimation}
            onChange={(event) => update({ cardAnimation: event.target.checked })}
          />
          <span>Card animation</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.showExplanations}
            onChange={(event) => update({ showExplanations: event.target.checked })}
          />
          <span>Show explanations</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.feedbackMessages}
            onChange={(event) => update({ feedbackMessages: event.target.checked })}
          />
          <span>Feedback messages</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.allowNegativeAnswers}
            onChange={(event) => update({ allowNegativeAnswers: event.target.checked })}
          />
          <span>Allow negative answers on advanced subtraction</span>
        </label>
      </fieldset>
      <OperationSelector
        selected={settings.defaultOperations}
        onChange={(defaultOperations) => {
          if (defaultOperations.length > 0) {
            update({ defaultOperations });
          }
        }}
      />
      <DifficultySelector
        selected={settings.defaultDifficulty}
        onChange={(defaultDifficulty) => update({ defaultDifficulty })}
      />
      <SessionLengthSelector
        selected={settings.defaultSessionLength}
        onChange={(defaultSessionLength) => update({ defaultSessionLength })}
      />
      <label className="mastery-field">
        <span>Correct similar questions needed for mastery</span>
        <input
          type="number"
          min={1}
          max={10}
          value={settings.masteryThreshold}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isInteger(next)) {
              update({ masteryThreshold: Math.min(10, Math.max(1, next)) });
            }
          }}
        />
      </label>
      <Button variant="danger" onClick={() => setConfirmClear(true)}>
        Clear All Application Data
      </Button>
      {confirmClear ? (
        <ConfirmDialog
          title="Clear all application data?"
          message="This deletes settings, practice history, statistics, and saved mistakes. This cannot be undone."
          confirmLabel="Clear everything"
          tone="danger"
          onConfirm={() => {
            dispatch({ type: "clearAll" });
            setConfirmClear(false);
            navigate("/");
          }}
          onCancel={() => setConfirmClear(false)}
        />
      ) : null}
    </section>
  );
}
