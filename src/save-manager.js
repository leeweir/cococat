import { SAVE_KEY, freshState, normalizeSave } from "./state.js";
import { validatePhotos } from "./photo-album.js";
export const BACKUP_KEY = `${SAVE_KEY}-before-restart`;
export const RECOVERY_KEY = `${SAVE_KEY}-unreadable`;
export const MAX_IMPORT_BYTES = 3 * 1024 * 1024;
export function parseSave(text) {
  if (
    typeof text !== "string" ||
    new TextEncoder().encode(text).length > MAX_IMPORT_BYTES
  )
    throw new Error("存档文件太大，最多支持 3 MB。");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("不是有效的 JSON 存档，请重新选择导出的文件。");
  }
  if (data?.format === "cococat-save") data = data.state;
  if (
    !data ||
    Array.isArray(data) ||
    ![1, 2, 3].includes(data.version) ||
    typeof data.adopted !== "boolean"
  )
    throw new Error("无法识别这个存档版本，请保留原文件并使用兼容的游戏版本。");
  for (const key of [
    "fullness",
    "clean",
    "mood",
    "bond",
    "hearts",
    "visits",
    "journeys",
  ])
    if (data[key] !== undefined && !Number.isFinite(data[key]))
      throw new Error("存档中的数值不完整，未覆盖当前进度。");
  for (const key of ["furniture", "memories", "collection", "ownedFurniture"])
    if (data[key] !== undefined && !Array.isArray(data[key]))
      throw new Error("存档格式不正确，未覆盖当前进度。");
  validatePhotos(data.photos);
  return normalizeSave(data);
}
export function loadGame(getStorage) {
  try {
    const raw = getStorage().getItem(SAVE_KEY);
    return { state: raw === null ? freshState() : parseSave(raw), error: null };
  } catch (error) {
    return { state: freshState(), error };
  }
}
export function exportGame(state) {
  return JSON.stringify(
    { format: "cococat-save", exportedAt: new Date().toISOString(), state },
    null,
    2,
  );
}
export function replaceGame(storage, current, next) {
  // Archive before replacing. A failed archive or active write never advances the in-memory game.
  const raw = storage.getItem?.(SAVE_KEY) ?? null;
  if (current.adopted) storage.setItem(BACKUP_KEY, JSON.stringify(current));
  else if (raw !== null) {
    try {
      parseSave(raw);
    } catch {
      storage.setItem(RECOVERY_KEY, raw);
    }
  }
  storage.setItem(SAVE_KEY, JSON.stringify(next));
  return next;
}
export function restartGame(storage, current) {
  return replaceGame(storage, current, freshState());
}
export function previousGame(storage) {
  try {
    const raw = JSON.parse(storage.getItem(BACKUP_KEY));
    const s = normalizeSave(raw);
    return s.adopted ? s : null;
  } catch {
    return null;
  }
}
export function restoreGame(storage) {
  const previous = previousGame(storage);
  if (!previous) return null;
  storage.setItem(SAVE_KEY, JSON.stringify(previous));
  return previous;
}
