"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/16/solid";
import { Button } from "@nextui-org/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div>
      <Button variant="light" onClick={() => setTheme(theme === "light" ? "dark" : "light")} isIconOnly>
        {theme === "light" ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />} 
      </Button>
    </div>
  );
}
