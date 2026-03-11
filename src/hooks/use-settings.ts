"use client";

import { useState, useEffect, useCallback } from "react";

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

const STORAGE_KEY = "nooc-api-settings";

const defaultSettings: ApiSettings = {
  baseUrl: "",
  apiKey: "",
  modelName: "",
};

export function useSettings() {
  const [settings, setSettingsState] = useState<ApiSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettingsState(JSON.parse(stored));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const setSettings = useCallback((newSettings: ApiSettings) => {
    setSettingsState(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  const isConfigured = loaded && !!settings.baseUrl && !!settings.apiKey && !!settings.modelName;

  return { settings, setSettings, isConfigured, loaded };
}
