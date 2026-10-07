import { $, $$, esc } from "./ui-dom.js";
import { SLOTS, WARDROBE } from "./wardrobe.js";

export function wardrobeView({
  shelf,
  outfit,
  slot,
  summary,
  onSlot,
  onWear,
  onRandom,
  onClear,
}) {
  const items = WARDROBE.filter((w) => w.slot === slot),
    current = outfit[slot];
  shelf(
    `<div class="activity-heading wardrobe-head"><b>百变衣橱 · 100 件全免费</b><span>已穿 ${Object.keys(outfit).length} 件 · 点一下就换</span></div><div class="slot-tabs" role="group" aria-label="部位">${SLOTS.map((s) => `<button data-slot="${s.id}" class="${s.id === slot ? "selected" : ""}" aria-pressed="${s.id === slot}" aria-label="${s.name}"><span>${s.icon}</span><small>${s.name}</small>${Object.values(outfit).some((id) => WARDROBE.find((w) => w.id === id)?.slot === s.id) ? '<i class="dot"></i>' : ""}</button>`).join("")}</div><div class="item-grid" role="group" aria-label="${SLOTS.find((s) => s.id === slot).name}">${items.map((w) => `<button class="item-card ${current === w.id ? "selected" : ""}" data-item="${w.id}" aria-pressed="${current === w.id}" aria-label="${current === w.id ? "脱下" : "穿上"}${w.name}"><span class="item-icon">${w.icon}</span><small>${w.name}</small></button>`).join("")}</div><div class="wardrobe-actions"><button class="soft-button" id="wardrobe-random">随机搭配</button><button class="soft-button" id="wardrobe-clear">一键换回原味</button></div><div class="outfit-summary"><span>当前搭配</span><b>${esc(summary)}</b></div>`,
  );
  $$("[data-slot]").forEach((b) => (b.onclick = () => onSlot(b.dataset.slot)));
  $$("[data-item]").forEach((b) => (b.onclick = () => onWear(b.dataset.item)));
  $("#wardrobe-random").onclick = onRandom;
  $("#wardrobe-clear").onclick = onClear;
}
