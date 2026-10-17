import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppProvider } from "../app/AppProvider";
import { appRoutes } from "../app/AppRoutes";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../services/storageService";
import { DEFAULT_SETTINGS } from "../types/settings";
import { createEmptyStatistics } from "../types/statistics";

function renderApp(path = "/") {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>,
  );
}

function seedFastSettings() {
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
    }),
  );
  localStorage.setItem(STORAGE_KEYS.version, JSON.stringify({ version: 1 }));
}

describe("App", () => {
  it("shows the home page", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Math Practice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Practice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Statistics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("completes an addition session and stores a mistake", async () => {
    seedFastSettings();
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Start Practice" }));
    await user.click(screen.getByRole("button", { name: "Start Session" }));
    for (let count = 0; count < 5; count += 1) {
      const choices = await screen.findAllByRole("button", { name: /answer \d/i });
      await user.click(choices[0]);
      await user.click(screen.getByRole("button", { name: "Flip Card" }));
      await user.click(screen.getByRole("button", { name: "I Got It Wrong" }));
    }
    expect(await screen.findByRole("heading", { name: "Session summary" })).toBeInTheDocument();
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
