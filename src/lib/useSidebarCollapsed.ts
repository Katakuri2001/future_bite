"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "sidebar-collapsed";
const CHANGE_EVENT = "sidebar-collapsed-change";

function subscribe(onStoreChange: () => void): () => void {
  // `storage` covers other tabs.
  window.addEventListener("storage", onStoreChange);
  // Browsers do NOT fire `storage` in the tab that made the write, so this
  // event covers same-tab updates. Without it the sidebar collapses but the
  // main content area never shrinks.
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Must match the server render, otherwise React reports a hydration mismatch.
 * The persisted value is picked up immediately after hydration.
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Collapsed state of the admin sidebar, shared between `AdminLayout` and
 * `AdminSidebar` so both stay in sync. Reading through
 * `useSyncExternalStore` keeps this hydration-safe without a `mounted` flag.
 */
export function useSidebarCollapsed(): [boolean, () => void] {
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(!getSnapshot()));
    } catch {
      /* storage unavailable — keep in-memory state only */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [isCollapsed, toggle];
}
