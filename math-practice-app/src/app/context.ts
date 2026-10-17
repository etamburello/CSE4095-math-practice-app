import { createContext, type Dispatch } from "react";
import type { Action } from "./reducer";
import type { AppState } from "../types/state";

export interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export const AppContext = createContext<AppContextValue | null>(null);
