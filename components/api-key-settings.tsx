"use client";

import { useState } from "react";
import { useApiKey } from "@/lib/api-key-context";

export function ApiKeySettings() {
  const { apiKey, setApiKey } = useApiKey();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          apiKey
            ? "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            : "text-[var(--color-primary)] hover:text-[var(--color-primary)]/80"
        }`}
        title="API Key Settings"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
        {apiKey ? (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" />
        ) : null}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg">
            <h3 className="text-sm font-semibold mb-2">OpenRouter API Key</h3>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <p className="mt-2 text-[10px] text-[var(--color-muted-foreground)]">
              Required for interactive probes and custom questions. Stored
              locally in your browser. We recommend regenerating it on{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:underline"
              >
                OpenRouter
              </a>{" "}
              when you&apos;re done.
            </p>
            {apiKey && (
              <button
                onClick={() => {
                  setApiKey("");
                  setOpen(false);
                }}
                className="mt-2 text-xs text-[var(--color-destructive)] hover:underline"
              >
                Clear key
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
