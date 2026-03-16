"use client";

import Link from "next/link";
import { ApiKeySettings } from "./api-key-settings";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
    >
      {children}
    </Link>
  );
}

export function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-xs font-bold text-white">
            CFL
          </div>
          <span className="font-semibold text-sm hidden sm:inline">
            Causal Forecast Lab
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/explore">Pre-Selected Questions</NavLink>
          <NavLink href="/live">Custom Question</NavLink>
          <NavLink href="/about">About</NavLink>
          <ApiKeySettings />
        </div>
      </div>
    </nav>
  );
}
