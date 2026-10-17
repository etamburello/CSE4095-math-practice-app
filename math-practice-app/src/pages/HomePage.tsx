import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useApp } from "../hooks/useApp";

export default function HomePage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const inProgress = Boolean(state.currentSession && !state.currentSession.completedAt);

  return (
    <section className="home">
      <h1>Math Practice</h1>
      <p className="welcome">
        Hi! Pick an operation, answer the question, and flip the card to check your work.
      </p>
      <div className="home-actions">
        {inProgress ? (
          <Button onClick={() => navigate("/practice/session")}>Continue Practice</Button>
        ) : null}
        <Button onClick={() => navigate("/practice/setup")}>Start Practice</Button>
        <Button variant="secondary" onClick={() => navigate("/statistics")}>
          View Statistics
        </Button>
        <Button variant="ghost" onClick={() => navigate("/settings")}>
          Settings
        </Button>
      </div>
    </section>
  );
}
