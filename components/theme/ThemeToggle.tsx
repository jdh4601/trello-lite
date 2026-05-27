"use client";

import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: Array<{ value: Theme; label: string; icon: string }> = [
  { value: "light", label: "라이트", icon: "☀" },
  { value: "dark", label: "다크", icon: "☾" },
  { value: "system", label: "시스템", icon: "💻" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="테마"
      className="inline-flex rounded-full border border-neutral-300 bg-white p-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            className={`rounded-full px-2 py-0.5 transition ${
              active
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
