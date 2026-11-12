"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { decodeOrDefault, encode } from "@/lib/create/code";
import { type CreateConfig, DEFAULT_CONFIG } from "@/lib/create/config";
import { CODE_PARAM, type CreateAction, createReducer, urlWithCode } from "@/lib/create/state";

/** How long the URL waits after the last change: one history entry per slider drag. */
export const URL_WRITE_DELAY = 400;

/** The configuration a URL's `?c=` gives, and why its code was refused (null if it was not). */
export function readUrlConfig(search: string): { config: CreateConfig; reason: string | null } {
  const code = new URLSearchParams(search).get(CODE_PARAM);
  // No code at all is the default, not a refusal.
  if (code === null) return { config: DEFAULT_CONFIG, reason: null };
  return decodeOrDefault(code);
}

export interface CreateState {
  config: CreateConfig;
  /** The canonical code of `config`. */
  code: string;
  dispatch: (action: CreateAction) => void;
  /** Why the code in the address was refused, until the visitor changes something. */
  refused: string | null;
  /** False until the URL has been read (the server renders the default). */
  ready: boolean;
}

/**
 * The page's one configuration. Read from `?c=` after hydration (the shell stays static), then
 * every change writes its canonical code back: a new history entry once the changes stop for
 * `URL_WRITE_DELAY`, so a slider drag is one entry and Back returns to the code before it.
 * Back and Forward read the code again. Nothing is kept anywhere but the URL.
 */
export function useCreateConfig(): CreateState {
  const [config, rawDispatch] = useReducer(createReducer, DEFAULT_CONFIG);
  const [refused, setRefused] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const code = useMemo(() => encode(config), [config]);
  /** The code the address bar stands for: a change to anything else is the visitor's. */
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const read = () => {
      const result = readUrlConfig(window.location.search);
      shown.current = encode(result.config);
      rawDispatch({ type: "replace", config: result.config });
      setRefused(result.reason);
    };
    read();
    setReady(true);
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  useEffect(() => {
    if (!ready || shown.current === code) return;
    const timer = window.setTimeout(() => {
      shown.current = code;
      window.history.pushState(null, "", urlWithCode(window.location.href, code));
    }, URL_WRITE_DELAY);
    return () => window.clearTimeout(timer);
  }, [code, ready]);

  // Any choice of the visitor's answers the note about a refused code.
  const dispatch = useCallback((action: CreateAction) => {
    setRefused(null);
    rawDispatch(action);
  }, []);
  return { config, code, dispatch, refused, ready };
}
