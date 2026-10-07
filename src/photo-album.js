import { normalizeOutfit } from "./wardrobe.js";
export const MAX_PHOTOS = 8,
  MAX_PHOTO_DATA = 140000,
  MAX_PHOTO_EDGE = 960;
export function jpegDimensions(image) {
  if (
    typeof image !== "string" ||
    image.length > MAX_PHOTO_DATA ||
    !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image)
  )
    return null;
  let bytes;
  try {
    bytes = Uint8Array.from(atob(image.slice(23)), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  if (
    bytes[0] !== 255 ||
    bytes[1] !== 216 ||
    bytes.at(-2) !== 255 ||
    bytes.at(-1) !== 217
  )
    return null;
  for (let i = 2; i + 3 < bytes.length; ) {
    if (bytes[i++] !== 255) return null;
    while (bytes[i] === 255) i++;
    const marker = bytes[i++];
    if (marker === 218 || marker === 217) return null;
    const length = (bytes[i] << 8) | bytes[i + 1];
    if (length < 2 || i + length > bytes.length) return null;
    if (
      [
        192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
      ].includes(marker)
    ) {
      if (length < 8) return null;
      return {
        height: (bytes[i + 3] << 8) | bytes[i + 4],
        width: (bytes[i + 5] << 8) | bytes[i + 6],
      };
    }
    i += length;
  }
  return null;
}
export function validPhoto(p) {
  if (
    !p ||
    typeof p.id !== "string" ||
    !/^[-\w]{1,60}$/.test(p.id) ||
    typeof p.name !== "string" ||
    p.name.length > 12 ||
    typeof p.at !== "string" ||
    !Number.isFinite(Date.parse(p.at)) ||
    !p.outfit ||
    typeof p.outfit !== "object" ||
    Array.isArray(p.outfit)
  )
    return false;
  const size = jpegDimensions(p.image);
  return (
    !!size &&
    Number.isInteger(p.width) &&
    Number.isInteger(p.height) &&
    p.width > 0 &&
    p.height > 0 &&
    p.width <= MAX_PHOTO_EDGE &&
    p.height <= MAX_PHOTO_EDGE &&
    size.width === p.width &&
    size.height === p.height
  );
}
export function normalizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  const seen = new Set();
  return photos
    .filter((p) => validPhoto(p) && !seen.has(p.id) && seen.add(p.id))
    .slice(0, MAX_PHOTOS)
    .map((p) => ({
      id: p.id,
      name: p.name,
      at: new Date(p.at).toISOString(),
      outfit: normalizeOutfit(p.outfit),
      width: p.width,
      height: p.height,
      image: p.image,
    }));
}
export function validatePhotos(photos) {
  if (photos === undefined) return;
  if (
    !Array.isArray(photos) ||
    photos.length > MAX_PHOTOS ||
    photos.some((p) => !validPhoto(p)) ||
    new Set(photos.map((p) => p.id)).size !== photos.length
  )
    throw new Error("照片格式、大小或张数不符合要求，未覆盖当前存档。");
}
export function addPhoto(state, photo) {
  if (
    !validPhoto(photo) ||
    state.photos.length >= MAX_PHOTOS ||
    state.photos.some((p) => p.id === photo.id)
  )
    return state;
  return { ...state, photos: [...state.photos, ...normalizePhotos([photo])] };
}
export function removePhoto(state, id) {
  return { ...state, photos: state.photos.filter((p) => p.id !== id) };
}
export function capturePhoto(canvas, state, now = Date.now()) {
  const frame = document.createElement("canvas"),
    scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(canvas.width, canvas.height));
  frame.width = Math.max(1, Math.round(canvas.width * scale));
  frame.height = Math.max(1, Math.round(canvas.height * scale));
  frame.getContext("2d").drawImage(canvas, 0, 0, frame.width, frame.height);
  let image;
  for (const quality of [0.78, 0.62, 0.46, 0.3]) {
    image = frame.toDataURL("image/jpeg", quality);
    if (image.length <= MAX_PHOTO_DATA) break;
  }
  const photo = {
    id: `photo-${now}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date(now).toISOString(),
    name: state.name,
    outfit: { ...state.outfit },
    width: frame.width,
    height: frame.height,
    image,
  };
  if (!validPhoto(photo))
    throw new Error("这张照片太大了，请切换省电画质后再试。");
  return photo;
}
