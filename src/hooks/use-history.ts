"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nooc-history";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  title: string;
  files: Record<string, string>;
}

function loadEntries(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setLoaded(true);
  }, []);

  const addEntry = useCallback((sourceText: string, files: Record<string, string>) => {
    const title = sourceText.slice(0, 50).replace(/\n/g, " ").trim() || "未命名";
    const entry: HistoryEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      title,
      files,
    };
    const updated = [entry, ...loadEntries()];
    saveEntries(updated);
    setEntries(updated);
    return entry;
  }, []);

  const getEntry = useCallback((id: string): HistoryEntry | undefined => {
    return loadEntries().find((e) => e.id === id);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    const updated = loadEntries().filter((e) => e.id !== id);
    saveEntries(updated);
    setEntries(updated);
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
  }, []);

  return { entries, loaded, addEntry, getEntry, deleteEntry, clearAll };
}
