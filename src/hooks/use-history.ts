"use client";

import { useCallback, useEffect, useState } from "react";
import builtinHistoryBase64 from "@/lib/builtin-history";

const STORAGE_KEY = "nooc-history";
const SEEDED_KEY = "nooc-history-seeded";
const BUILTIN_SAMPLE_KEYWORD = "白夜";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  title: string;
  files: Record<string, string>;
}

function decodeBuiltinHistory(): HistoryEntry[] {
  const binary = atob(builtinHistoryBase64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function getStoredEntries(): HistoryEntry[] | null {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadEntries(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const storedEntries = getStoredEntries();
  if (storedEntries !== null) return storedEntries;
  if (localStorage.getItem(SEEDED_KEY) === "true") return [];

  const seededEntries = decodeBuiltinHistory();
  saveEntries(seededEntries);
  localStorage.setItem(SEEDED_KEY, "true");
  return seededEntries;
}

function saveEntries(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function findBuiltinHistoryEntry(entries: HistoryEntry[]): HistoryEntry | undefined {
  return entries.find((entry) => entry.title.includes(BUILTIN_SAMPLE_KEYWORD));
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
    localStorage.setItem(SEEDED_KEY, "true");
    setEntries([]);
  }, []);

  return { entries, loaded, addEntry, getEntry, deleteEntry, clearAll };
}
