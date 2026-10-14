import { Moon, Sun } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { getTheme, setTheme, subscribeTheme } from "@/lib/theme";

/** On/off switch for dark mode. Works on the navy header and on a light card alike. */
export function ThemeSwitch({ className, label = "Dark mode" }: { className?: string; label?: string }) {
  const dark = useSyncExternalStore(subscribeTheme, () => getTheme() === "dark", () => false);
  // slide only when tapped, so a saved choice does not visibly flip on page load
  const [tapped, setTapped] = useState(false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={label}
      title={dark ? "Dark mode is on" : "Dark mode is off"}
      onClick={() => {
        setTapped(true);
        setTheme(dark ? "light" : "dark");
      }}
      className={cn("grid min-h-11 min-w-11 shrink-0 place-items-center", className)}
    >
      <span
        className={cn(
          "relative block h-7 w-12 rounded-full ring-1 ring-inset",
          tapped && "transition-colors duration-200",
          dark ? "bg-gold ring-gold" : "bg-black/25 ring-white/35",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 grid size-6 place-items-center rounded-full bg-white text-on-gold shadow",
            tapped && "transition-transform duration-200 ease-out",
            dark ? "translate-x-5" : "translate-x-0",
          )}
        >
          {dark ? <Moon className="size-3.5" strokeWidth={2.4} aria-hidden /> : <Sun className="size-3.5" strokeWidth={2.4} aria-hidden />}
        </span>
      </span>
    </button>
  );
}
