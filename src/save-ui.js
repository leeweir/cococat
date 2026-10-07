import { SAVE_KEY } from "./state.js";
import {
  MAX_IMPORT_BYTES,
  exportGame,
  parseSave,
  replaceGame,
} from "./save-manager.js";

export function downloadFile(content, name, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// DOM edges live here; importing a file never replaces progress until confirmation succeeds.
export function installSaveTools({
  getState,
  isBlocked,
  activate,
  onDialog,
  toast,
}) {
  const $ = (id) => document.getElementById(id);
  let pending = null,
    reading = false;
  $("export-save").onclick = () => {
    try {
      const raw = isBlocked()
        ? localStorage.getItem(SAVE_KEY)
        : exportGame(getState());
      if (!raw) throw new Error("没有可导出的存档。");
      downloadFile(
        raw,
        `cococat-${isBlocked() ? "original" : "save"}-${Date.now()}.json`,
      );
      toast("存档已导出，请保存在安全的位置。");
    } catch {
      toast("暂时无法导出，请检查浏览器的下载和存储权限。");
    }
  };
  $("import-save").onclick = () => $("save-file").click();
  $("save-file").onchange = async () => {
    const file = $("save-file").files[0];
    $("save-file").value = "";
    if (!file || reading) return;
    reading = true;
    $("import-save").disabled = true;
    try {
      if (file.size > MAX_IMPORT_BYTES)
        throw new Error("存档文件太大，最多支持 3 MB。");
      pending = parseSave(await file.text());
      $("import-summary").textContent = pending.adopted
        ? `将恢复「${pending.name}」的小屋，爱心 ${pending.hearts}，亲密 ${pending.bond}。当前进度会先备份。`
        : "这是尚未领养小可爱的存档，将回到领养页。当前进度会先备份。";
      $("settings").close();
      $("import-confirm").showModal();
      onDialog();
    } catch (error) {
      pending = null;
      toast(error.message);
    } finally {
      reading = false;
      $("import-save").disabled = false;
    }
  };
  $("import-cancel").onclick = () => $("import-confirm").close();
  $("import-confirm").addEventListener("close", () => {
    pending = null;
  });
  $("import-confirm-button").onclick = () => {
    if (!pending) return;
    try {
      const next = replaceGame(localStorage, getState(), pending);
      $("import-confirm").close();
      activate(next);
      toast("存档已恢复。被替换的小可爱可在设置中找回。");
    } catch {
      toast("未能备份或保存，当前进度没有被替换。请先导出进度并检查存储空间。");
    }
  };
}
