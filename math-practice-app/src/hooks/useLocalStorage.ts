import { useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validate?: (value: unknown) => value is T,
): [T, (value: T) => void, string | null] {
  const [warning, setWarning] = useState<string | null>(null);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return initialValue;
      }
      const parsed: unknown = JSON.parse(raw);
      if (validate && !validate(parsed)) {
        return initialValue;
      }
      return parsed as T;
    } catch {
      return initialValue;
    }
  });

  const save = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      setWarning(null);
    } catch {
      setWarning("This browser could not save that change.");
    }
  };

  return [value, save, warning];
}
