import { $, $$ } from "./ui-dom.js";
import { REGIONS, TREASURES } from "./state.js";

export function mapView({ shelf, line, collection, onRegion }) {
  shelf(
    `<div class="activity-heading"><b>选一个目的地</b><span>点地面走路 · 调查闪光点 · 认识猫朋友</span></div><div class="region-row">${REGIONS.map((r) => `<button class="region-button" data-region="${r.id}"><span>${r.icon}</span><b>${r.name}</b><small>已收集 ${collection.filter((id) => TREASURES.find((t) => t.id === id)?.region === r.id).length} / 4</small></button>`).join("")}</div>${line("每次找到 3 件宝物，还会获得一份探险奖励。")}`,
  );
  $$("[data-region]").forEach(
    (b) => (b.onclick = () => onRegion(b.dataset.region)),
  );
}
export function explorationView({ shelf, line, onHint, onChange }) {
  shelf(
    `<div class="explore-bar"><b id="explore-count"><span class="treasure-pips"><i>✦</i><i>✦</i><i>✦</i></span> 0 / 3</b><button class="soft-button" id="explore-hint">找最近的宝物</button><button class="soft-button" id="change-region">换个地方</button></div>${line("走路找宝物，交到朋友，再带一段故事回家。")}`,
  );
  $("#explore-hint").onclick = onHint;
  $("#change-region").onclick = onChange;
}
// t rewrites the cat wording for the adopted species; markers are written straight into the DOM.
export function explorationMarkers(outing, onVisit, t = (text) => text) {
  if (!outing) return;
  $("#world-labels").innerHTML = t(`${outing.spots
    .filter((s) => !outing.found.includes(s.id))
    .map(
      (s, i) =>
        `<button class="world-marker" data-spot="${s.id}" aria-label="调查宝物${i + 1}"><b>?</b><span>调查</span></button>`,
    )
    .join(
      "",
    )}${!outing.friendDone ? '<button class="world-marker friend-marker" data-spot="friend" aria-label="和猫朋友打招呼"><b>♡</b><span>猫朋友</span></button>' : ""}${!outing.eventDone ? '<button class="world-marker event-marker" data-spot="event" aria-label="看看奇怪的动静"><b>!</b><span>小插曲</span></button>' : ""}`);
  $$("[data-spot]").forEach((b) => (b.onclick = () => onVisit(b.dataset.spot)));
}
