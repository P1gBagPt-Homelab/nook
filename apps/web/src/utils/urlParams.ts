import { useState, useEffect, useCallback } from "react";

export function getSearchParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function updateSearchParams(
  updates: Record<string, string | null>,
  replace = false
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;

  for (const [key, value] of Object.entries(updates)) {
    const current = url.searchParams.get(key);
    if (value === null) {
      if (current !== null) {
        url.searchParams.delete(key);
        changed = true;
      }
    } else if (current !== value) {
      url.searchParams.set(key, value);
      changed = true;
    }
  }

  if (!changed) return;
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (replace) {
    window.history.replaceState({}, "", nextUrl);
  } else {
    window.history.pushState({}, "", nextUrl);
  }
}

export function useUrlSubTab<T extends string>(
  paramKey: string,
  validValues: readonly T[],
  defaultValue: T
): [T, (next: T) => void] {
  const readValue = useCallback((): T => {
    const raw = getSearchParam(paramKey);
    return raw && (validValues as readonly string[]).includes(raw)
      ? (raw as T)
      : defaultValue;
  }, [paramKey, validValues, defaultValue]);

  const [value, setValue] = useState<T>(readValue);

  useEffect(() => {
    const handlePopState = () => {
      setValue(readValue());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [readValue]);

  const updateValue = useCallback(
    (next: T) => {
      setValue(next);
      updateSearchParams({ [paramKey]: next });
    },
    [paramKey]
  );

  return [value, updateValue];
}
