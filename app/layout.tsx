import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";
import { ApiKeyProvider } from "@/lib/api-key-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Causal Forecast Lab",
  description:
    "Interactive exploration of how LLM forecasts shift when causal beliefs change",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <ApiKeyProvider>
          <NavBar />
          <main>{children}</main>
        </ApiKeyProvider>
      </body>
    </html>
  );
}
