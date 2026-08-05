"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("accent-blue", "accent-red", "accent-purple", "accent-neon", "accent-gold", "accent-aqua");
    root.classList.add(`accent-${settings.accentColor}`);
    if (settings.trueBlack) root.classList.add("true-black");
    else root.classList.remove("true-black");
    if (settings.glassMode) root.classList.add("glass-mode");
    else root.classList.remove("glass-mode");
  }, [settings.accentColor, settings.trueBlack, settings.glassMode]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={settings.theme}
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
