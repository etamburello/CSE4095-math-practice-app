import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface ErrorBoundaryProps {
  children: ReactNode;
  onHome: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(error, info);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          message="The page ran into a problem. You can go home and try again."
          onHome={() => {
            this.setState({ hasError: false });
            this.props.onHome();
          }}
        />
      );
    }
    return this.props.children;
  }
}
