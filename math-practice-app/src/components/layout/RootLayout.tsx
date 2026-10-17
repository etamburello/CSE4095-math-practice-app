import { useNavigate } from "react-router-dom";
import { Outlet, useLocation } from "react-router-dom";
import { useApp } from "../../hooks/useApp";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { Button } from "../common/Button";
import { Header } from "./Header";
import { PageContainer } from "./PageContainer";

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {state.storageWarning ? (
        <div className="banner" role="status">
          <p>{state.storageWarning}</p>
          <Button variant="ghost" onClick={() => dispatch({ type: "setWarning", warning: null })}>
            Dismiss
          </Button>
        </div>
      ) : null}
      <main id="main" className="page">
        <ErrorBoundary key={location.pathname} onHome={() => navigate("/")}>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </ErrorBoundary>
      </main>
      <footer className="footer">
        <p>
          Your practice stays on this device. Clearing this browser's site data erases progress.
        </p>
      </footer>
    </div>
  );
}
