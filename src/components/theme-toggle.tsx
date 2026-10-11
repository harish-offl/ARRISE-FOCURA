"use client";

import { Moon, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle theme">
      {isDark ? <Sparkles size={18} className="text-[var(--text-primary)]" /> : <Moon size={18} />}
    </Button>
  );
}
