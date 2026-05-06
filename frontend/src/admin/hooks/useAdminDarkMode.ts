import { useEffect, useState } from "react";

/**
 * Reactively tracks whether the admin dark mode is active by watching
 * the `admin-dark-theme` class on `.admin-theme-root` via MutationObserver.
 * Falls back to localStorage on first read (before the DOM is ready).
 */
export function useAdminDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const root = document.querySelector(".admin-theme-root");
    if (root) return root.classList.contains("admin-dark-theme");
    return localStorage.getItem("admin-layout-theme") === "dark";
  });

  useEffect(() => {
    const root = document.querySelector(".admin-theme-root");
    if (!root) return;

    setIsDark(root.classList.contains("admin-dark-theme"));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("admin-dark-theme"));
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
