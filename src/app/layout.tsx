import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FOCURA | Own Your Focus",
  description:
    "FOCURA helps students take control of their time, build distraction-free study habits, and make measurable progress every day.",
};

import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const THEME_STORAGE_KEY = "arrise-theme-preference";
                const THEME_ATTRIBUTE = "data-theme";
                function getTheme() {
                  const stored = localStorage.getItem(THEME_STORAGE_KEY);
                  if (stored === "dark" || stored === "light") return stored;
                  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                }
                function applyTheme(theme) {
                  document.documentElement.classList.remove("light", "dark");
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
                }
                const theme = getTheme();
                applyTheme(theme);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[var(--background)] text-[var(--text-primary)]">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
