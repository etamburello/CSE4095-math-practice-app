import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppProvider } from "../app/AppProvider";
import { appRoutes } from "../app/AppRoutes";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../services/storageService";
import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";
import { createEmptyStatistics } from "../types/statistics";

function renderApp(path = "/") {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>,
  );
}

function seedFastSettings(overrides: Partial<AppSettings> = {}) {
  localStorage.setItem(
    STORAGE_KEYS.settings,
    JSON.stringify({
      ...DEFAULT_SETTINGS,
      soundEffects: false,
      cardAnimation: false,
      feedbackMessages: false,
      showExplanations: false,
      defaultOperations: ["addition"],
      defaultDifficulty: 1,
      defaultSessionLength: 5,
      ...overrides,
    }),
  );
  localStorage.setItem(STORAGE_KEYS.version, JSON.stringify({ version: 1 }));
}

async function completeQuestions(
  user: ReturnType<typeof userEvent.setup>,
  count: number,
  correct: boolean,
) {
  const label = correct ? "I Got It Right" : "I Got It Wrong";
  for (let index = 0; index < count; index += 1) {
    const choices = await screen.findAllByRole("button", { name: /answer \d/i });
    await user.click(choices[0]);
    await user.click(screen.getByRole("button", { name: "Flip Card" }));
    await user.click(screen.getByRole("button", { name: label }));
  }
}

async function startSessionFromHome(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Start Practice" }));
  await user.click(screen.getByRole("button", { name: "Start Session" }));
}

describe("App", () => {
  it("shows the home page", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Math Practice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Practice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Statistics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it.each([
    ["addition", "Addition"],
    ["subtraction", "Subtraction"],
    ["multiplication", "Multiplication"],
    ["division", "Division"],
  ] as const)("completes a %s session and stores a mistake", async (operation, label) => {
    seedFastSettings({ defaultOperations: [operation] });
    const user = userEvent.setup();
    renderApp();
    await startSessionFromHome(user);
    await completeQuestions(user, 5, false);
    expect(await screen.findByRole("heading", { name: "Session summary" })).toBeInTheDocument();
    expect(screen.getByText(`Operations: ${label}`)).toBeInTheDocument();
    expect(screen.getByText("Mistake-review questions: 0")).toBeInTheDocument();
    const mistakes = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.mistakePatterns) ?? "[]",
    ) as unknown[];
    expect(mistakes.length).toBeGreaterThan(0);
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.statistics) ?? "{}") as {
      attempted: number;
      incorrect: number;
    };
    expect(stats.attempted).toBe(5);
    expect(stats.incorrect).toBe(5);
  });

  it("mixes operations in one session and keeps totals after remount", async () => {
    seedFastSettings({
      defaultOperations: ["addition", "subtraction", "multiplication", "division"],
    });
    const user = userEvent.setup();
    const view = renderApp();
    await startSessionFromHome(user);
    await completeQuestions(user, 2, true);
    await completeQuestions(user, 3, false);
    expect(await screen.findByRole("heading", { name: "Session summary" })).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText(/Operations:/)).toHaveTextContent("Addition");
    expect(screen.getByText(/Operations:/)).toHaveTextContent("Subtraction");
    view.unmount();
    renderApp("/statistics");
    expect(await screen.findByRole("heading", { name: "Statistics" })).toBeInTheDocument();
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.statistics) ?? "{}") as {
      attempted: number;
      correct: number;
      incorrect: number;
    };
    expect(stats.attempted).toBe(5);
    expect(stats.correct).toBe(2);
    expect(stats.incorrect).toBe(3);
  });

  it("ends a continuous session from the end button", async () => {
    seedFastSettings({ defaultSessionLength: "continuous" });
    const user = userEvent.setup();
    renderApp();
    await startSessionFromHome(user);
    await completeQuestions(user, 2, true);
    await user.click(await screen.findByRole("button", { name: "End Session" }));
    await user.click(screen.getByRole("button", { name: "End session" }));
    expect(await screen.findByRole("heading", { name: "Session summary" })).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) ?? "[]") as Array<{
      attempted: number;
      correct: number;
      sessionLength: string;
    }>;
    expect(sessions[0]?.sessionLength).toBe("continuous");
    expect(sessions[0]?.attempted).toBe(2);
    expect(sessions[0]?.correct).toBe(2);
  });

  it("masters a saved mistake after enough correct reviews", async () => {
    seedFastSettings();
    localStorage.setItem(
      STORAGE_KEYS.mistakePatterns,
      JSON.stringify([
        {
          id: "pattern-1",
          operation: "addition",
          firstOperand: 3,
          secondOperand: 4,
          correctAnswer: 7,
          difficulty: 1,
          incorrectCount: 2,
          similarCorrectCount: 2,
          lastIncorrectAt: "2024-01-01T00:00:00.000Z",
          mastered: false,
        },
      ]),
    );
    const user = userEvent.setup();
    renderApp("/practice/setup");
    await user.click(screen.getByRole("radio", { name: /Practice mistakes/ }));
    await user.click(screen.getByRole("button", { name: "Start Session" }));
    await completeQuestions(user, 1, true);
    await waitFor(() => {
      const patterns = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.mistakePatterns) ?? "[]",
      ) as Array<{ mastered: boolean; similarCorrectCount: number }>;
      expect(patterns[0]?.mastered).toBe(true);
      expect(patterns[0]?.similarCorrectCount).toBe(3);
    });
  });

  it("navigates between home, statistics, and settings", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "View Statistics" }));
    expect(await screen.findByRole("heading", { name: "Statistics" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Settings" }));
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(await screen.findByRole("heading", { name: "Math Practice" })).toBeInTheDocument();
  });

  it("shows statistics and waits for reset confirmation", async () => {
    localStorage.setItem(
      STORAGE_KEYS.statistics,
      JSON.stringify({
        ...createEmptyStatistics(),
        attempted: 4,
        correct: 3,
        incorrect: 1,
        byOperation: {
          ...createEmptyStatistics().byOperation,
          addition: { attempted: 4, correct: 3, incorrect: 1 },
        },
      }),
    );
    localStorage.setItem(STORAGE_KEYS.version, JSON.stringify({ version: 1 }));
    const user = userEvent.setup();
    renderApp("/statistics");
    expect(await screen.findByRole("heading", { name: "Statistics" })).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset Statistics" }));
    expect(
      screen.getByText("Are you sure you want to erase all practice history and statistics?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset Statistics" }));
    await user.click(screen.getByRole("button", { name: "Erase history" }));
    expect(screen.getByText("No practice yet")).toBeInTheDocument();
  });
});

function StorageProbe() {
  const [value, setValue] = useLocalStorage("demo-key", "start");
  return (
    <button type="button" onClick={() => setValue("saved")}>
      {value}
    </button>
  );
}

describe("useLocalStorage", () => {
  it("saves a value in the browser", async () => {
    const user = userEvent.setup();
    render(<StorageProbe />);
    await user.click(screen.getByRole("button", { name: "start" }));
    expect(screen.getByRole("button", { name: "saved" })).toBeInTheDocument();
    expect(localStorage.getItem("demo-key")).toBe(JSON.stringify("saved"));
  });
});
