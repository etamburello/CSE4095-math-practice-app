import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onHome?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onHome }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onHome ? (
        <Button variant="primary" onClick={onHome}>
          Return Home
        </Button>
      ) : null}
    </div>
  );
}
