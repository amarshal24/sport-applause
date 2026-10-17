import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export class PageLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6 text-center">
        <h1 className="text-2xl">This page couldn’t load</h1>
        <p className="text-muted-foreground">Check your connection and try again.</p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </main>
    );
  }
}