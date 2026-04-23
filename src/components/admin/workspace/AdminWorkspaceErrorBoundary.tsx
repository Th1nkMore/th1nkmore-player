"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";

type State = {
  error: Error | null;
};

export class AdminWorkspaceErrorBoundary extends Component<
  {
    children: ReactNode;
    title: string;
    description: string;
    resetLabel: string;
  },
  State
> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin workspace boundary caught an error", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[24rem] items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-rose-500/8 p-6 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-200">
              {this.props.title}
            </div>
            <p className="mt-3 text-sm text-rose-100/80">
              {this.props.description}
            </p>
            <p className="mt-2 text-xs text-rose-200/70">
              {this.state.error.message}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={this.handleReset}
              >
                {this.props.resetLabel}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
