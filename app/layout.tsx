import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Belief Sensitivity Explorer",
  description:
    "Interactive exploration of how LLM forecasts shift when causal beliefs change",
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-xs font-bold text-white">
                BS
              </div>
              <span className="font-semibold text-sm hidden sm:inline">
                Belief Sensitivity Explorer
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <NavLink href="/explore">Explore</NavLink>
              <NavLink href="/compare">Compare Models</NavLink>
              <NavLink href="/live">Live Mode</NavLink>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
