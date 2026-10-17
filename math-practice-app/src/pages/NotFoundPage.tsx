import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <section className="home">
      <h1>Page not found</h1>
      <p className="welcome">That page is not part of Math Practice.</p>
      <Button onClick={() => navigate("/")}>Return Home</Button>
    </section>
  );
}
