export const QUALITY_KEY = "cococat-quality";
export const normalizeQuality = (value) =>
  value === "low" ? "low" : "standard";
export function qualitySettings(value, dpr = 1) {
  return value === "low"
    ? { pixelRatio: Math.min(dpr, 1), shadowSize: 512 }
    : { pixelRatio: Math.min(dpr, 2), shadowSize: 2048 };
}
export function loadQuality(getStorage = () => localStorage) {
  try {
    return normalizeQuality(getStorage().getItem(QUALITY_KEY));
  } catch {
    return "standard";
  }
}
export function saveQuality(value, getStorage = () => localStorage) {
  try {
    getStorage().setItem(QUALITY_KEY, normalizeQuality(value));
    return true;
  } catch {
    return false;
  }
}

// A trailing save coalesces drag events; explicit boundaries flush the latest live state.
export function createSaveScheduler(
  save,
  { delay = 250, setTimer = setTimeout, clearTimer = clearTimeout } = {},
) {
  let pending = false,
    timer = null;
  const flush = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    if (!pending) return;
    pending = false;
    return save();
  };
  return {
    schedule() {
      pending = true;
      if (timer !== null) clearTimer(timer);
      timer = setTimer(flush, delay);
    },
    flush,
    cancel() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      pending = false;
    },
    get pending() {
      return pending;
    },
  };
}
