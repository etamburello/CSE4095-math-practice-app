import { useContext } from "react";
import { AppContext, type AppContextValue } from "../app/context";

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used within AppProvider");
  }
  return value;
}
