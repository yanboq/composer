"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <p>Editor encountered an error.</p>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
          >
            Reload editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
