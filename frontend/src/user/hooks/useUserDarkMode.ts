import { useEffect, useState } from "react";

export function useUserDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.body.classList.contains("user-dark-theme");
  });

  useEffect(() => {
    setIsDark(document.body.classList.contains("user-dark-theme"));

    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("user-dark-theme"));
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
