/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { RootLayout } from "../components/layout/RootLayout";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import PracticePage from "../pages/PracticePage";
import PracticeSetupPage from "../pages/PracticeSetupPage";
import SessionSummaryPage from "../pages/SessionSummaryPage";

const StatisticsPage = lazy(() => import("../pages/StatisticsPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));

function PageFallback() {
  return <p className="welcome">Loading…</p>;
}

export const appRoutes = [
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/practice/setup", element: <PracticeSetupPage /> },
      { path: "/practice/session", element: <PracticePage /> },
      { path: "/practice/summary", element: <SessionSummaryPage /> },
      {
        path: "/statistics",
        element: (
          <Suspense fallback={<PageFallback />}>
            <StatisticsPage />
          </Suspense>
        ),
      },
      {
        path: "/settings",
        element: (
          <Suspense fallback={<PageFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
