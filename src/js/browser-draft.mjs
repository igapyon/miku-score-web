export const BROWSER_DRAFT_STORAGE_KEY = "miku-score-web.localDraft.v1";

const defaultStorage = () => {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
};

const validDraft = (value) => (
  value
  && typeof value.xml === "string"
  && value.xml.trim().length > 0
  && Number.isFinite(value.updatedAt)
    ? { xml: value.xml.trim(), updatedAt: Number(value.updatedAt) }
    : null
);

export const readBrowserDraft = (storage = defaultStorage()) => {
  try {
    const raw = storage?.getItem(BROWSER_DRAFT_STORAGE_KEY);
    return raw ? validDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

export const writeBrowserDraft = (xml, { storage = defaultStorage(), now = Date.now() } = {}) => {
  const draft = validDraft({ xml, updatedAt: now });
  if (!draft) return false;
  try {
    storage?.setItem(BROWSER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
};

export const clearBrowserDraft = (storage = defaultStorage()) => {
  try {
    storage?.removeItem(BROWSER_DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};
