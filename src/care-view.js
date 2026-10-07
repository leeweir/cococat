import { $, $$ } from "./ui-dom.js";
import { INGREDIENTS } from "./state.js";

export function kitchenView({
  shelf,
  line,
  hint,
  isBusy,
  onSelection,
  onServe,
  toast,
}) {
  let selected = ["fish"];
  shelf(
    `<div class="activity-heading"><b>选 1–2 种食材</b><span id="taste-note">${hint}</span></div><div class="ingredient-row">${INGREDIENTS.map((i) => `<button class="ingredient ${selected.includes(i.id) ? "selected" : ""}" data-ingredient="${i.id}" aria-pressed="${selected.includes(i.id)}"><span>${i.icon}</span>${i.name}</button>`).join("")}<button class="primary" id="serve">开饭啦</button></div>${line("猫饭配方会记在纪念册里。")}`,
  );
  $$("[data-ingredient]").forEach(
    (b) =>
      (b.onclick = () => {
        if (isBusy()) return;
        const id = b.dataset.ingredient;
        if (selected.includes(id)) selected = selected.filter((x) => x !== id);
        else if (selected.length < 2) selected.push(id);
        else {
          toast("一碗放两种就很丰盛啦，先取消一种再换。");
          return;
        }
        onSelection([...selected]);
        $$("[data-ingredient]").forEach((x) => {
          const yes = selected.includes(x.dataset.ingredient);
          x.classList.toggle("selected", yes);
          x.setAttribute("aria-pressed", String(yes));
        });
        $("#serve").disabled = !selected.length;
      }),
  );
  $("#serve").onclick = onServe;
}
export function bathView({ shelf, line, phase, onStroke, onRinse }) {
  shelf(
    `<div class="activity-heading"><b id="bath-step">${phase === "scrub" ? "第一步：搓出泡泡" : "第二步：冲掉泡泡"}</b><span>在小猫身上拖动工具，或点下面按钮</span></div><div class="activity-controls"><button class="primary" id="bath-work">${phase === "scrub" ? "搓一搓" : "冲一冲"}</button><button class="soft-button" id="bath-next" hidden>拿起花洒</button></div>${line("慢慢来，小猫不赶时间。", true)}`,
  );
  $("#bath-work").onclick = onStroke;
  $("#bath-next").onclick = onRinse;
}
export function televisionView({ shelf, line, isBusy, onChannel, onWatch }) {
  shelf(
    `<div class="activity-heading"><b>猫咪遥控器</b><span>选择频道，陪它看完一小段</span></div><div class="activity-controls">${["鱼鱼频道", "蝴蝶纪录片", "鸟鸟音乐会"].map((s, i) => `<button class="soft-button channel ${i === 0 ? "selected" : ""}" data-channel="${i}"><span>${["🐟", "🦋", "🐦"][i]}</span>${s}</button>`).join("")}<button class="primary" id="watch">一起看</button></div>${line("没有广告，只有猫的弹幕。", true)}`,
  );
  $$("[data-channel]").forEach(
    (b) =>
      (b.onclick = () => {
        if (isBusy()) return;
        $$("[data-channel]").forEach((x) =>
          x.classList.toggle("selected", x === b),
        );
        onChannel(Number(b.dataset.channel));
      }),
  );
  $("#watch").onclick = onWatch;
}
