// Safe localStorage helpers.
// SWAP POINT: replace these with real DB (Neon) reads/writes later.
// Everything is namespaced under "lycee.*" keys.

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    // Notify listeners in the same tab (storage event only fires cross-tab).
    window.dispatchEvent(new CustomEvent("lycee:storage", { detail: { key } }))
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
    window.dispatchEvent(new CustomEvent("lycee:storage", { detail: { key } }))
  } catch {
    // ignore
  }
}
