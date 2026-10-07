import "./style.css";
import { icon } from "./icons.js";
import {
  BREEDS,
  SAVE_KEY,
  freshState,
  applyAction,
  INGREDIENTS,
  FAVORITES,
  PERSONALITIES,
  FURNITURE,
  FURNITURE_BY_ID,
  MAX_FURNITURE,
  WALL_THEMES,
  FLOOR_THEMES,
  REGIONS,
  TREASURES,
  BONDS,
  bondLevel,
  reward,
  purchase,
  placeFurniture,
  newFurnitureUid,
  removeFurniture,
  ownsFurniture,
  serveRecipe,
  makeOuting,
  collectTreasure,
} from "./state.js";
import {
  restartGame,
  previousGame,
  restoreGame,
  loadGame,
} from "./save-manager.js";
import { installSaveTools } from "./save-ui.js";
import { createSaveScheduler, saveQuality } from "./performance.js";
import {
  WISHES,
  normalizeDaily,
  recordWish,
  claimWishes,
} from "./daily-wishes.js";
import { toggleTreasureDisplay } from "./state.js";
import {
  MAX_PHOTOS,
  addPhoto,
  removePhoto,
  capturePhoto,
} from "./photo-album.js";
import { WARDROBE, SLOT_QUIPS, wearItem, randomOutfit } from "./wardrobe.js";
import {
  initSound,
  setSoundEnabled,
  soundEnabled,
  tone,
  speak,
  content,
} from "./sound.js";
import {
  SPECIES_BY_ID,
  SPECIES_GROUPS,
  groupOf,
  speciesText,
} from "./species.js";
import { LivingWorld } from "./living-world.js";
import {
  PORTRAIT_ACTIONS,
  createPortraitSession,
  beginPortraitAction,
  finishPortraitAction,
} from "./portrait.js";
import { $, $$, esc } from "./ui-dom.js";
import { kitchenView, bathView, televisionView } from "./care-view.js";
import { wardrobeView } from "./wardrobe-view.js";
import {
  mapView,
  explorationView,
  explorationMarkers,
} from "./exploration-view.js";
let { state, error: loadError } = loadGame(() => localStorage);
let saveOK = !loadError,
  saveBlocked = !!loadError;
function renderSaveStatus(ok) {
  saveOK = ok;
  $("#save-status").textContent = !ok
    ? "暂时无法保存"
    : state.adopted
      ? T("✓ 已保存小猫的日常")
      : "✓ 已保存你的选择";
  $("#save-warning").hidden = ok;
  $("#save-warning-text").textContent = saveBlocked
    ? "无法读取原存档，已停止自动覆盖。请在存档设置中导出原文件，再导入备份或确认重新开始。"
    : "进度尚未保存。请检查浏览器存储权限或空间；也可以在存档设置中导出当前进度。";
}
let mode = "adopt",
  selected = state.breed,
  speciesTab = "all",
  homeTab = "care",
  toastTimer,
  world,
  busy = false,
  activity = null,
  timer = null,
  raf = null,
  lastPet = 0,
  lastMeow = 0,
  session = null,
  outing = null,
  selectedIngredients = ["fish"],
  bathPhase = "scrub",
  bathValue = 0,
  tvChannel = 0,
  pendingSpot = null,
  slotTab = "head",
  selectedUid = state.furniture[0]?.uid || null,
  catScreen = null,
  pressed = new Set(),
  driveX = 0,
  driveZ = 0;
let giftChecked = false;
const runId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const breedOf = () => BREEDS.find((b) => b.id === state.breed) || BREEDS[0];
const speciesOf = () =>
  SPECIES_BY_ID.get(breedOf().species) || SPECIES_BY_ID.get("cat");
// Every line of copy written while a pet lives here passes through T, so 喵 becomes 汪 for a dog.
// A pet the player named 「喵喵」 keeps its name: the name is masked before the rewrite.
const T = (text) => {
  if (!state.adopted || typeof text !== "string") return text;
  const name = state.name;
  if (name && /[猫喵]/.test(name) && text.includes(name)) {
    const mark = "\u0001";
    return speciesText(text.split(name).join(mark), breedOf().species)
      .split(mark)
      .join(name);
  }
  return speciesText(text, breedOf().species);
};
const save = () => {
  state.updatedAt = Date.now();
  if (saveBlocked) {
    renderSaveStatus(false);
    return false;
  }
  let ok = true;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    ok = false;
  }
  renderSaveStatus(ok);
  if ($("#wallet")) $("#wallet").textContent = `♡ ${state.hearts}`;
  return ok;
};
const placementSave = createSaveScheduler(() => {
  if (save()) flashSaved();
});
const say = (text) => {
  $("#bubble").textContent = T(text);
};
const toast = (text) => {
  clearTimeout(toastTimer);
  text = T(text);
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  // Native dialogs live above the page's z-index stack; keep their feedback inside the top layer.
  const dialog = $("dialog[open]");
  if (dialog) {
    let feedback = dialog.querySelector(".dialog-feedback");
    if (!feedback) {
      feedback = document.createElement("p");
      feedback.className = "dialog-feedback";
      feedback.setAttribute("role", "status");
      dialog.append(feedback);
      dialog.addEventListener("close", () => feedback.remove(), { once: true });
    }
    feedback.textContent = text;
  }
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3100);
};
function hearts(symbol = "♡") {
  for (let i = 0; i < 6; i++) {
    const e = document.createElement("span");
    e.className = "particle";
    e.textContent = symbol;
    e.style.setProperty("--drift", `${(i - 2.5) * 25}px`);
    e.style.marginLeft = `${(i - 2.5) * 9}px`;
    e.style.animationDelay = `${i * 0.07}s`;
    $("#fx-layer").append(e);
    setTimeout(() => e.remove(), 2200);
  }
}
// Floating '喵～' above the pet's head, positioned from the latest frame event.
function floatMeow() {
  const box = $("#fx-layer").getBoundingClientRect();
  const x = catScreen ? catScreen.x : box.width / 2,
    y = (catScreen ? catScreen.y : box.height * 0.42) - 24;
  const el = document.createElement("span");
  el.className = "meow-pop";
  el.textContent = `${speciesOf().sound}～`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  $("#fx-layer").append(el);
  setTimeout(() => el.remove(), 1500);
}
function meowNow(mood = "happy", text) {
  if (Date.now() - lastMeow < 1200) return false;
  lastMeow = Date.now();
  world?.meow?.();
  speak(breedOf().voice, speciesOf().voice, mood);
  floatMeow();
  if (text) say(text);
  return true;
}
function updateStats() {
  const el = $("#stats");
  el.hidden = !state.adopted;
  el.innerHTML = [
    ["fullness", "饱腹", "#c58d65"],
    ["clean", "清洁", "#78a9c7"],
    ["mood", "心情", "#9dac78"],
  ]
    .map(
      ([key, label, color]) =>
        `<div class="stat" data-stat="${key}" style="--stat-color:${color}">${label}<b>${state[key]}</b><div class="stat-track" role="meter" aria-label="${label}" aria-valuenow="${state[key]}" aria-valuemin="0" aria-valuemax="100"><i style="width:${state[key]}%"></i></div></div>`,
    )
    .join("");
  $("#wallet").hidden = !state.adopted;
  $("#wallet").textContent = `♡ ${state.hearts}`;
  if ($("#bond-label"))
    $("#bond-label").textContent = `${bondLevel(state).name} · ${state.bond}`;
}
function commit(next, celebrate = false, wish) {
  const prev = bondLevel(state);
  state = wish && next !== state ? recordWish(next, wish) : next;
  save();
  updateStats();
  world.syncState(state);
  if (celebrate) {
    hearts();
    tone(720);
  }
  if (bondLevel(state).at > prev.at) {
    toast(`关系升级：${bondLevel(state).name}！${bondLevel(state).hint}`);
  }
}
function heading(kicker, title, desc = "") {
  $("#scene-kicker").textContent = T(kicker);
  $("#scene-title").textContent = T(title);
  $("#scene-description").textContent = T(desc);
}
function shelf(html, cls = "") {
  $("#shelf").className = `shelf expanded-shelf ${cls}`;
  const steps =
    mode === "toy"
      ? {
          wand: [
            ["feather", "晃晃羽毛"],
            ["paw", "抓住它"],
            ["gift", "集满 5 爪"],
          ],
          fetch: [
            ["ball", "抛小球"],
            ["cat", "叼回来"],
            ["gift", "送达 3 次"],
          ],
          hide: [
            ["box", "观察纸箱"],
            ["search", "找小猫"],
            ["gift", "找到 2 次"],
          ],
        }[session?.kind]
      : guides[mode];
  if (steps) {
    const marker = "</span></div>";
    const at = html.indexOf(marker);
    if (at >= 0)
      html =
        html.slice(0, at + marker.length) +
        guide(steps) +
        html.slice(at + marker.length);
  }
  $("#shelf").innerHTML = T(html);
}
const button = (id, label, symbol, extra = "") =>
  `<button class="action-button" data-action="${id}" aria-label="${esc(label)}" ${extra}><span class="action-icon">${symbol?.startsWith("<") ? symbol : esc(symbol || "✧")}</span><span>${esc(label)}</span></button>`;
const guide = (steps) =>
  `<div class="how-to" aria-label="玩法图解">${steps.map(([picture, label], i) => `<div class="guide-step"><span>${icon(picture)}</span><small>${label}</small></div>${i < steps.length - 1 ? "<i>›</i>" : ""}`).join("")}</div>`;
const guides = {
  kitchen: [
    ["feed", "选食材"],
    ["cat", "尝一口"],
    ["heart", "发现最爱"],
  ],
  bath: [
    ["sponge", "搓泡泡"],
    ["shower", "冲干净"],
    ["paw", "香香完成"],
  ],
  tv: [
    ["tv", "选频道"],
    ["cat", "一起看"],
    ["heart", "收获陪伴"],
  ],
  map: [
    ["map", "选目的地"],
    ["search", "找宝物"],
    ["gift", "带回家"],
  ],
};
const line = (text, progress = false) =>
  `<div class="shelf-line"><span id="action-status">${esc(text)}</span>${progress ? '<span class="progress-track"><i></i></span>' : ""}<span id="bond-label">${bondLevel(state).name} · ${state.bond}</span></div>`;
function cleanup() {
  placementSave.flush();
  clearTimeout(timer);
  cancelAnimationFrame(raf);
  timer = null;
  busy = false;
  activity = null;
  pendingSpot = null;
  clearDrive();
  world.finishAction();
  world.clearExploration();
  $("#world-labels").replaceChildren();
  $("#bath-splash").classList.remove("show");
  session = null;
  outing = null;
}
function scene(name, sceneName, title, kicker, desc = "") {
  cleanup();
  mode = name;
  $("#app").dataset.mode = name;
  $("#app").className =
    `game-mode expansion-mode ${name === "wardrobe" ? "wardrobe-mode" : ""}`;
  world.setScene(sceneName);
  $("#home").hidden = false;
  $("#scene-hotspot").hidden = true;
  $("#world-labels").hidden = name !== "explore";
  heading(kicker, title, desc);
  updateStats();
  setPad();
}
try {
  world = new LivingWorld($("#world"), pet, openWardrobe, worldEvent);
} catch (err) {
  $("#loading").innerHTML =
    "<span>☁</span><div>这台浏览器暂时没能打开 3D 场景。<br>请开启硬件加速，或换用较新的 Chrome / Safari 后刷新。</div>";
  console.error(err);
  throw err;
}
// Progressive thumbnails: each breed arrives one task at a time and fills its card in place.
const thumbs = {};
let thumbsStarted = false;
function ensureThumbnails() {
  if (thumbsStarted) return;
  thumbsStarted = true;
  world.thumbnails((id, url) => {
    thumbs[id] = url;
    const img = $(`img[data-breed="${id}"]`);
    if (img) {
      img.src = url;
      img.closest(".cat-option")?.classList.add("ready");
    }
  });
}
// Adoption tab glyphs; the per-species ones come from SPECIES, the two synthetic groups need their own.
const GROUP_ICON = { all: "✿", small: "🦔" };
const breedCard = (b) =>
  `<button class="cat-option ${thumbs[b.id] ? "ready" : ""}${b.id === selected ? " selected" : ""}" data-breed="${b.id}" aria-label="选择${b.name}" aria-pressed="${b.id === selected}"><span class="thumb" style="--breed:${b.color}"><img data-breed="${b.id}" alt="${b.name}的三维外观" ${thumbs[b.id] ? `src="${thumbs[b.id]}"` : ""}></span><span><strong>${b.name}</strong><small>${b.tag}</small></span><span class="check" ${b.id === selected ? "" : "hidden"}>✓</span></button>`;
// 34 pets is a long list, so the tab row narrows it to one family at a time.
function renderBreedList() {
  const list = $(".cat-options");
  if (!list) return;
  list.innerHTML = BREEDS.filter(
    (b) => speciesTab === "all" || groupOf(b.species) === speciesTab,
  )
    .map(breedCard)
    .join("");
  $$(".cat-option[data-breed]").forEach(
    (b) => (b.onclick = () => selectBreed(b.dataset.breed)),
  );
  $$("[data-species-tab]").forEach((b) => {
    const yes = b.dataset.speciesTab === speciesTab;
    b.classList.toggle("selected", yes);
    b.setAttribute("aria-pressed", String(yes));
  });
  list.scrollTop = 0;
  list.scrollLeft = 0;
}
function selectBreed(id) {
  if (state.adopted) return;
  selected = id;
  world.setCat(id, {});
  const b = BREEDS.find((x) => x.id === id);
  say(b.quote);
  $(".shelf-caption strong").textContent = b.description;
  $$(".cat-option").forEach((btn) => {
    const yes = btn.dataset.breed === id;
    btn.classList.toggle("selected", yes);
    btn.setAttribute("aria-pressed", String(yes));
    btn.querySelector(".check").hidden = !yes;
  });
  tone(390);
}
function showAdopt() {
  ensureThumbnails();
  mode = "adopt";
  $("#app").dataset.mode = "adopt";
  $("#app").className = "";
  $("#stats").hidden = true;
  $("#wallet").hidden = true;
  $("#home").hidden = true;
  $("#scene-hotspot").hidden = true;
  $("#world-labels").hidden = true;
  $("#move-pad").hidden = true;
  heading(
    "初次见面，请多关照",
    "想把哪只小可爱\n带回家？",
    "三十四种小可爱：猫猫、狗狗、兔兔，还有刺猬、仓鼠、龙猫……挑一只带回家。",
  );
  $("#scene-title").style.whiteSpace = "pre-line";
  // 'all' first: every family is visible before the tabs narrow things down.
  speciesTab = "all";
  $("#shelf").className = "shelf adopt-shelf";
  $("#shelf").innerHTML =
    `<div class="shelf-caption"><span>挑一只，先打个招呼</span><strong></strong></div><div class="species-tabs" role="group" aria-label="按种类筛选">${SPECIES_GROUPS.map((g) => {
      const glyph =
        g.icon || SPECIES_BY_ID.get(g.id)?.icon || GROUP_ICON[g.id] || "";
      return `<button type="button" data-species-tab="${g.id}" aria-pressed="false" aria-label="${g.name}">${glyph ? `<span>${glyph}</span>` : ""}<small>${g.name}</small></button>`;
    }).join("")}</div><div class="cat-options" role="group" aria-label="选择宠物"></div><form class="adopt-row" id="adopt-form"><label class="name-label">给它取个名字<input id="cat-name" maxlength="12" value="糯米" autocomplete="off" aria-label="宠物名字"></label><button class="primary" type="submit">♡ 带它回家</button><span class="adopt-note welcome-loot"><span>♡ 6 颗爱心</span><span>▣ 纸箱城堡</span></span></form>`;
  $$("[data-species-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        speciesTab = b.dataset.speciesTab;
        renderBreedList();
      }),
  );
  renderBreedList();
  $("#adopt-form").onsubmit = (e) => {
    e.preventDefault();
    if (saveBlocked) {
      toast("原存档尚未恢复，请先打开存档设置。");
      openSettings();
      return;
    }
    state = {
      ...freshState(),
      adopted: true,
      breed: selected,
      name: $("#cat-name").value.trim().slice(0, 12) || "糯米",
      outfit: {},
      memories: ["相遇的第一天：从此，家里多了一个小祖宗。"],
    };
    world.setCat(state.breed, state.outfit);
    save();
    showHome();
    meowNow("happy", "新家不错！先陪我玩，还是一起去探险？");
    hearts();
  };
  world.setScene("adopt");
  world.setMode("adopt");
  selectBreed(selected);
}
function showHome() {
  scene(
    "home",
    "home",
    `${state.name}的甜梦小屋`,
    PERSONALITIES[state.breed].name,
    "猫咪会自己活动。点地面带它散步，点家具邀请它试一试。",
  );
  world.setMode("free");
  world.syncState(state);
  $("#home").hidden = true;
  $("#scene-hotspot").hidden = false;
  renderHome();
  say("小屋巡逻准备中。陪玩、寻宝、布置，今天先做哪件？");
  $("#footer-note").textContent = saveOK
    ? "本机自动保存 · 慢慢玩，随时回来"
    : "请允许浏览器存储以保存进度";
}
function renderHome() {
  const groups = {
    care: [
      ["feed", "搭配猫饭", icon("feed")],
      ["bath", "泡泡洗澡", icon("bath")],
      ["tv", "一起追剧", icon("tv")],
      ["explore", "外出探险", icon("play")],
      ["wardrobe", "换衣服", icon("wardrobe")],
      [
        "daily",
        `今日心愿 ${normalizeDaily(state.dailyWishes).completed.length}/3`,
        icon("heart"),
      ],
    ],
    play: [
      ["wand", "逗猫棒", icon("feather")],
      ["fetch", "抛球捡球", icon("ball")],
      ["hide", "纸箱捉迷藏", icon("box")],
      ["call", "叫名字", "♫"],
      ["nuzzle", "蹭蹭", "♡"],
      ["meow", "喵一声", "🐾"],
    ],
    house: [
      ["decorate", "布置小屋", icon("box")],
      ["collection", "宝物收藏", "✧"],
      ["bond", "感情成长", "♡"],
      ["wardrobe", "换衣服", icon("wardrobe")],
      ["album", "纪念册", icon("memory")],
      ["portrait", "近看小猫", icon("cat")],
    ],
  };
  shelf(
    `<div class="home-tabs" role="group" aria-label="玩法分类">${[
      ["care", "日常照顾"],
      ["play", "陪它玩"],
      ["house", "我们的小屋"],
    ]
      .map(
        ([id, name]) =>
          `<button data-tab="${id}" aria-pressed="${id === homeTab}" class="${id === homeTab ? "selected" : ""}">${name}</button>`,
      )
      .join(
        "",
      )}</div><div class="action-row">${groups[homeTab].map(([id, label, symbol]) => button(id, label, symbol)).join("")}</div>${line("一起玩赚爱心，装扮属于你们的小屋。")}`,
  );
  $$("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        homeTab = b.dataset.tab;
        renderHome();
      }),
  );
  $$("[data-action]").forEach(
    (b) => (b.onclick = () => dispatch(b.dataset.action)),
  );
}
function showWishes() {
  const daily = normalizeDaily(state.dailyWishes),
    claimed = daily.claimedDays.includes(daily.day);
  $("#wish-list").innerHTML = WISHES.map(
    (w) =>
      `<button class="wish-row ${daily.completed.includes(w.id) ? "done" : ""}" data-wish="${w.action}"><span>${daily.completed.includes(w.id) ? "✓" : "○"}</span><span><b>${w.label}</b><small>${w.hint}</small></span></button>`,
  ).join("");
  $("#wish-claim").disabled = claimed || daily.completed.length < 3;
  $("#wish-claim").textContent = claimed
    ? "今天的小奖励已领取"
    : "领取 3 颗爱心";
  $$("[data-wish]").forEach(
    (b) =>
      (b.onclick = () => {
        $("#wishes").close();
        dispatch(b.dataset.wish);
      }),
  );
  $("#wish-claim").onclick = () => {
    const next = claimWishes(state);
    if (next !== state) {
      commit(next, true);
      renderHome();
      showWishes();
      toast("三件小事，攒成今天的快乐。爱心 +3！");
    }
  };
  if (!$("#wishes").open) $("#wishes").showModal();
  pauseForDialog();
}
function dispatch(id) {
  if (id === "daily") showWishes();
  if (id === "portrait") openPortrait();
  if (id === "feed") openKitchen();
  if (id === "bath") openBath();
  if (id === "tv") openTV();
  if (id === "explore") openMap();
  if (id === "wardrobe") openWardrobe();
  if (id === "album") showAlbum();
  if (id === "collection") showCollection();
  if (id === "bond") showBond();
  if (id === "decorate") openDecorate();
  if (id === "meow") meowAction();
  if (["wand", "fetch", "hide"].includes(id)) openToy(id);
  if (id === "call") {
    if (state.bond < 12) {
      toast(`再增加 ${12 - state.bond} 点亲密，它就能认出自己的名字啦。`);
      return;
    }
    world.callCat();
    say(`${state.name}，过来呀！`);
  }
  if (id === "nuzzle") {
    if (state.bond < 35) {
      toast(`亲密到 35 就能解锁蹭蹭，现在可以点小猫摸摸。`);
      return;
    }
    world.pose("nuzzle", 4);
    say("蹭蹭专属人类，确认过味道，是自己家。");
    hearts();
  }
}
function meowAction() {
  const mood =
    state.fullness < 35 ? "hungry" : state.mood < 40 ? "sleepy" : "happy";
  lastMeow = 0;
  meowNow(
    mood,
    {
      hungry: "饿饿喵！碗的方向，本喵很清楚。",
      sleepy: "喵……（小声）困了，但还想陪你。",
      happy: "喵一声，心情分你一半。",
    }[mood],
  );
  world.pose("nuzzle", 1.2);
}
function openToy(kind) {
  const spec = {
    wand: ["逗猫棒追逐赛", "拖动羽毛逗猫，抓到 5 次就完成。"],
    fetch: ["小球快递员", "点地面抛球，等小猫叼回来；完成 3 次。"],
    hide: ["纸箱里藏着谁", "观察哪只箱子在动，也可以听听呼噜声。"],
  }[kind];
  scene("toy", "home", spec[0], "一起动起来", spec[1]);
  session = {
    kind,
    id: `${kind}-${runId()}`,
    count: 0,
    goal: kind === "wand" ? 5 : kind === "fetch" ? 3 : 2,
    done: false,
  };
  world.setMode(kind);
  shelf(
    `<div class="activity-heading"><b>${spec[0]}</b><span>${spec[1]}</span></div><div class="paw-score" id="toy-score" aria-label="本轮完成进度"></div><div class="activity-controls" id="toy-controls"></div>${line("开始吧，小猫已经准备好了！", true)}`,
  );
  renderToyControls();
  updateToyProgress();
  say(
    kind === "fetch"
      ? "发货地址：你手里。运费：摸摸头。"
      : kind === "hide"
        ? "本喵藏得很隐蔽。除了呼噜声有点大。"
        : "这根羽毛，今天必须拿下！",
  );
}
function renderToyControls() {
  if (!session) return;
  const { kind, done } = session;
  if (done) {
    $("#toy-controls").innerHTML =
      '<button class="primary" id="toy-again">再玩一轮</button><button class="soft-button" id="toy-home">带着爱心回家</button>';
    $("#toy-again").onclick = () => openToy(kind);
    $("#toy-home").onclick = showHome;
    return;
  }
  if (kind === "wand") {
    $("#toy-controls").innerHTML =
      '<button class="primary" id="wiggle">晃晃逗猫棒</button><span class="control-tip">也可以在场景中拖动羽毛</span>';
    $("#wiggle").onclick = () => world.wiggleWand();
  }
  if (kind === "fetch") {
    $("#toy-controls").innerHTML =
      '<button class="primary" id="throw-ball">抛出小球</button><span class="control-tip">也可以点地面选择落点</span>';
    $("#throw-ball").onclick = () =>
      world.throwBall(session.count % 2 ? -2.2 : 2.2, 0.55);
  }
  if (kind === "hide") {
    $("#toy-controls").innerHTML =
      `${["左边箱子", "中间箱子", "右边箱子"].map((s, i) => `<button class="soft-button" data-box="${i}">${s}</button>`).join("")}<button class="hint-button" id="listen">听听呼噜声</button>`;
    $$("[data-box]").forEach(
      (b) => (b.onclick = () => world.chooseBox(Number(b.dataset.box))),
    );
    $("#listen").onclick = () => {
      say(`嘘……呼噜声从${world.hideHint()}箱子传来！`);
      tone(250, 0.3);
    };
  }
}
function updateToyProgress() {
  if (!session) return;
  $("#toy-score").innerHTML = Array.from(
    { length: session.goal },
    (_, i) =>
      `<span class="${i < session.count ? "earned" : ""}">${icon("paw")}</span>`,
  ).join("");
  $("#action-status").textContent =
    `${session.kind === "hide" ? "找到" : session.kind === "fetch" ? "捡回" : "抓到"} ${session.count} / ${session.goal} 次`;
  $(" .progress-track>i").style.width =
    `${Math.min(100, (session.count / session.goal) * 100)}%`;
}
function toyPoint() {
  if (!session || session.done) return;
  session.count++;
  updateToyProgress();
  hearts("✧");
  tone(600);
  if (session.count >= session.goal) {
    session.done = true;
    commit(
      reward(state, {
        id: session.id,
        hearts: 3,
        bond: 6,
        stat: "mood",
        amount: 14,
        memory: {
          wand: "逗猫棒首胜：猫抓到了羽毛，也抓到了快乐。",
          fetch: "第一次叼球回来：小球快递，货到摸头。",
          hide: "第一次捉迷藏：纸箱保密，呼噜泄密。",
        }[session.kind],
      }),
      true,
      "play",
    );
    world.setMode("toy-done");
    say("任务完成！爱心 +3，亲密 +6。再来一局也奉陪！");
    $("#action-status").textContent = "完成！爱心 +3 · 亲密 +6";
    renderToyControls();
  } else if (session.kind === "hide") {
    $("#toy-controls").innerHTML =
      '<button class="primary" id="next-hide">再藏一次</button>';
    $("#next-hide").onclick = () => {
      world.newHideRound();
      renderToyControls();
    };
    say("被发现了！刚才一定是纸箱告的密。");
  }
}
function openKitchen() {
  scene(
    "kitchen",
    "home",
    "今天的小猫私房菜",
    "两种食材，随你搭配",
    "发现最爱口味，获得额外爱心。",
  );
  world.setMode("meal");
  world.bowl.visible = true;
  world.food.visible = false;
  selectedIngredients = ["fish"];
  kitchenView({
    shelf,
    line,
    hint: tasteHint(),
    isBusy: () => busy,
    onSelection: (items) => (selectedIngredients = items),
    onServe: serveMeal,
    toast,
  });
  say("主厨你好，我负责认真吃和认真点评。");
}
function tasteHint() {
  const fav = FAVORITES[state.breed];
  return state.discoveredFoods.includes(fav)
    ? `已发现最爱：${INGREDIENTS.find((i) => i.id === fav).name}`
    : "它的最爱还是秘密，试着发现吧。";
}
function serveMeal() {
  if (busy || !selectedIngredients.length) return;
  busy = true;
  const token = `meal-${runId()}`,
    recipe = [...selectedIngredients];
  $("#serve").disabled = true;
  $$("[data-ingredient]").forEach((b) => (b.disabled = true));
  world.startAction("feed");
  say("让我先用鼻子投个票……");
  $("#action-status").textContent = "认真品尝中…";
  timer = setTimeout(() => {
    if (mode !== "kitchen") return;
    const result = serveRecipe(state, recipe, token);
    commit(result.state, true, "care");
    world.finishAction();
    world.pose(result.liked ? "pounce" : "sniff", 3);
    busy = false;
    say(
      result.liked
        ? "就是这个味！喜欢到耳朵都要起飞了。爱心 +2！"
        : "这碗也不错！最爱口味还等着你发现。爱心 +1。",
    );
    $("#taste-note").textContent = tasteHint();
    $("#action-status").textContent = result.liked
      ? "发现最爱口味 · 饱腹 +26 · 亲密 +7"
      : "吃饱啦 · 饱腹 +26 · 亲密 +5";
    $("#serve").textContent = "再做一碗";
    $("#serve").disabled = false;
    $$("[data-ingredient]").forEach((b) => (b.disabled = false));
  }, 3200);
}
function openBath() {
  scene(
    "bath",
    "bath",
    "把小猫洗成香香云",
    "动手泡泡浴",
    "拖海绵在猫咪身上搓，再用花洒冲干净。",
  );
  world.setMode("scrub");
  bathPhase = "scrub";
  bathValue = 0;
  activity = `bath-${runId()}`;
  renderBath();
  say("耳朵可以湿，尊严……算了，泡泡好玩。");
}
function renderBath() {
  bathView({
    shelf,
    line,
    phase: bathPhase,
    onStroke: () => bathStroke(12),
    onRinse: () => {
      bathPhase = "rinse";
      bathValue = 0;
      world.setMode("rinse");
      world.bathProgress(0, "rinse");
      renderBath();
      say("准备冲水！泡泡胡子申请保留失败。");
    },
  });
}
function bathStroke(amount) {
  if (mode !== "bath" || bathPhase === "done" || bathValue >= 100) return;
  bathValue = Math.min(100, bathValue + amount);
  world.bathProgress(bathValue / 100, bathPhase);
  $(".progress-track>i").style.width = `${bathValue}%`;
  $("#action-status").textContent =
    `${bathPhase === "scrub" ? "泡泡覆盖" : "冲洗进度"} ${Math.floor(bathValue)}%`;
  if (bathValue >= 100) {
    if (bathPhase === "scrub") {
      $("#bath-next").hidden = false;
      $("#bath-work").disabled = true;
      say("泡泡足够啦，拿花洒把它们冲走。");
    } else {
      bathPhase = "done";
      $("#bath-work").disabled = true;
      commit(applyAction(state, "bath", activity), true, "care");
      world.setMode("bath-done");
      world.pose("sneeze", 3);
      $("#bath-splash").classList.add("show");
      say("甩甩毛！好了，现在你也洗过澡了。");
      $("#action-status").textContent = "香香完成 · 清洁 +35 · 爱心 +1";
      timer = setTimeout(
        () => $("#bath-splash").classList.remove("show"),
        2000,
      );
    }
  }
}
function openTV() {
  scene(
    "tv",
    "tv",
    "今天追哪一档？",
    "喵喵家庭影院",
    "切换频道，看看小猫喜欢什么。",
  );
  world.setMode("tv");
  world.setTVChannel(0);
  tvChannel = 0;
  televisionView({
    shelf,
    line,
    isBusy: () => busy,
    onChannel: (channel) => {
      tvChannel = channel;
      say(
        [
          "这条鱼演技不错，就是游不出来。",
          "蝴蝶请别乱飞，猫的眼睛跟不上了！",
          "跟唱失败，但呼噜声已经加入合唱。",
        ][tvChannel],
      );
      world.setTVChannel(tvChannel);
    },
  });
  $("#watch").onclick = () => {
    if (busy) return;
    busy = true;
    const id = `tv-${runId()}`;
    world.startAction("tv");
    $$("[data-channel],#watch").forEach((b) => (b.disabled = true));
    const begin = performance.now();
    const tick = () => {
      if (mode !== "tv") return;
      $(".progress-track>i").style.width =
        `${Math.min(100, (performance.now() - begin) / 48)}%`;
      if (busy) raf = requestAnimationFrame(tick);
    };
    tick();
    timer = setTimeout(() => {
      if (mode !== "tv") return;
      busy = false;
      world.finishAction();
      commit(applyAction(state, "tv", id), true, "care");
      say("追完啦！猫决定把节目给五个爪爪好评。");
      $("#action-status").textContent = "陪伴完成 · 心情 +23 · 爱心 +1";
      $$("[data-channel],#watch").forEach((b) => (b.disabled = false));
    }, 4800);
  };
  say("遥控器交给你，沙发归本喵。");
}
function openMap() {
  scene(
    "map",
    "park",
    "今天去哪里散步？",
    "把小世界走大一点",
    "每次出发都有不同宝物与小插曲。",
  );
  world.setMode("map");
  mapView({
    shelf,
    line,
    collection: state.collection,
    onRegion: startExploration,
  });
  say("出门记得带上好奇心，饭碗就先不带了。");
}
function startExploration(region) {
  scene(
    "explore",
    region,
    REGIONS.find((r) => r.id === region).name,
    "小小探险家",
    REGIONS.find((r) => r.id === region).intro,
  );
  state.journeys++;
  save();
  outing = makeOuting(region, state.journeys);
  world.setMode("explore");
  world.setupExploration(outing);
  explorationView({
    shelf,
    line,
    onHint: () => {
      const spot = outing.spots
        .filter((s) => !outing.found.includes(s.id))
        .sort(
          (a, b) =>
            Math.hypot(a.x - world.pos.x, a.z - world.pos.z) -
            Math.hypot(b.x - world.pos.x, b.z - world.pos.z),
        )[0];
      if (spot) visitSpot(spot.id);
      else say("宝物都找到啦，再和猫朋友打个招呼吧。");
    },
    onChange: openMap,
  });
  renderMarkers();
  say(REGIONS.find((r) => r.id === region).intro);
}
function renderMarkers() {
  explorationMarkers(outing, visitSpot, T);
}
function visitSpot(id) {
  if (mode !== "explore" || !outing) return;
  if (
    (id === "friend" && outing.friendDone) ||
    (id === "event" && outing.eventDone) ||
    outing.found.includes(id)
  )
    return;
  const spot =
    id === "friend"
      ? { x: 2.05, z: -0.35 }
      : id === "event"
        ? { x: -2.15, z: -0.6 }
        : outing.spots.find((s) => s.id === id);
  if (!spot) return;
  pendingSpot = id;
  say("收到！小爪爪正在赶往现场。");
  world.moveTo(spot.x, spot.z, () => {
    if (mode !== "explore" || pendingSpot !== id) return;
    pendingSpot = null;
    arriveSpot(id);
  });
}
function arriveSpot(id) {
  if (!outing) return;
  world.pose(id === "event" ? outing.event.pose : "sniff", 3);
  if (id === "friend") {
    const isNew = !state.friends.includes(outing.region);
    outing.friendDone = true;
    let n = reward(state, {
      id: `${outing.id}-friend`,
      hearts: 1,
      bond: 3,
      memory: isNew
        ? `认识了${REGIONS.find((r) => r.id === outing.region).name}的猫朋友：先碰鼻子，再交换呼噜。`
        : undefined,
    });
    n = { ...n, friends: [...new Set([...n.friends, outing.region])] };
    commit(n, true);
    say("碰鼻子，交朋友！它推荐你去看看附近的闪光点。");
    meowNow("happy");
  } else if (id === "event") {
    outing.eventDone = true;
    commit(
      reward(state, {
        id: `${outing.id}-event`,
        hearts: 1,
        bond: 3,
        memory: `${outing.event.title}：${outing.event.text}`,
      }),
      true,
    );
    say(outing.event.text);
    world.pose(outing.event.pose, 5);
  } else {
    const result = collectTreasure(state, outing, id);
    outing = result.outing;
    commit(result.state, true, "explore");
    world.hideSpot(id);
    say(`找到${TREASURES.find((t) => t.id === id).name}！猫：这个必须带回家。`);
    $("#explore-count").innerHTML =
      `<span class="treasure-pips">${[0, 1, 2].map((i) => `<i class="${i < outing.found.length ? "found" : ""}">✦</i>`).join("")}</span> ${outing.found.length} / 3`;
    if (outing.found.length === 3 && !outing.finished) {
      outing.finished = true;
      commit(
        reward(state, {
          id: `${outing.id}-complete`,
          hearts: 3,
          bond: 5,
          stat: "mood",
          amount: 15,
          memory: "第一次寻宝大成功：兜里装着宝物，心里装着快乐。",
        }),
        true,
      );
      state.fullness = Math.max(10, state.fullness - 6);
      state.clean = Math.max(10, state.clean - 9);
      save();
      updateStats();
      $("#action-status").textContent =
        "寻宝完成！额外爱心 +3 · 还可以继续散步";
      toast("三件宝物到手！额外获得 3 颗爱心。");
    }
  }
  world.outing = outing;
  renderMarkers();
}

// ── 衣橱：8 个部位，100 件全免费 ──────────────────────────────
function outfitSummary(outfit = state.outfit) {
  const ids = Object.values(outfit || {});
  if (!ids.length) return "素颜原味，什么也没戴。";
  return ids
    .map((id) => {
      const w = WARDROBE.find((x) => x.id === id);
      return w ? `${w.icon}${w.name}` : "";
    })
    .filter(Boolean)
    .join(" · ");
}
function renderWardrobe() {
  wardrobeView({
    shelf,
    outfit: state.outfit,
    slot: slotTab,
    summary: outfitSummary(),
    onSlot: (id) => {
      slotTab = id;
      renderWardrobe();
    },
    onWear: (id) => {
      const piece = WARDROBE.find((w) => w.id === id);
      const wearing = state.outfit[piece.slot] === id;
      state = { ...state, outfit: wearItem(state.outfit, id) };
      world.dress(state.outfit);
      save();
      tone(wearing ? 330 : 640, 0.1);
      say(SLOT_QUIPS[piece.slot][Math.floor(Math.random() * 3)]);
      if (Math.random() < 0.25) meowNow("happy");
      else content(0.9, speciesOf().voice);
      renderWardrobe();
    },
    onRandom: () => {
      state = { ...state, outfit: randomOutfit() };
      world.dress(state.outfit);
      save();
      hearts("✧");
      meowNow("happy", "随机完毕！这套是本喵凭直觉挑的。");
      renderWardrobe();
    },
    onClear: () => {
      state = { ...state, outfit: {} };
      world.dress(state.outfit);
      save();
      say("原味小猫限时返场，毛毛才是本体。");
      renderWardrobe();
    },
  });
}
function openWardrobe() {
  if (!state.adopted) return;
  scene(
    "wardrobe",
    "wardrobe",
    "今天，穿哪件？",
    "百变衣橱 · 100 件全免费",
    "八个部位，一百件配饰，随便搭。",
  );
  world.setMode("wardrobe");
  renderWardrobe();
  say("今天要穿出可爱，还是穿出饭量？");
}

// ── 布置小屋：23 件家具、墙纸地板，改动实时保存 ──────────────
function flashSaved() {
  const el = $("#decorate-saved");
  if (!el) return;
  el.textContent = "✓ 已自动保存";
  el.classList.remove("flash");
  void el.offsetWidth;
  el.classList.add("flash");
}
const selectedPiece = () =>
  state.furniture.find((f) => f.uid === selectedUid) || null;
function itemSub(id) {
  const f = FURNITURE_BY_ID.get(id);
  if (ownsFurniture(state, id)) return "＋ 摆一个";
  return `♡ ${f.cost} 解锁`;
}
function renderDecorate() {
  const piece = selectedPiece();
  const info = piece ? FURNITURE_BY_ID.get(piece.id) : null;
  shelf(
    `<div class="activity-heading decorate-head"><b>布置小屋 · 已摆 ${state.furniture.length}/${MAX_FURNITURE} 件</b><span id="decorate-saved">✓ 已自动保存</span></div><div class="catalog-grid">${FURNITURE.map((f) => `<button class="furniture-option ${piece?.id === f.id ? "selected" : ""}" data-furniture="${f.id}" aria-label="${ownsFurniture(state, f.id) ? "摆放" : "解锁"}${f.name}"><span>${f.icon}</span><b>${f.name}</b><small>${itemSub(f.id)}</small></button>`).join("")}</div><div class="swatch-row" role="group" aria-label="墙面颜色"><span class="swatch-label">墙面</span>${WALL_THEMES.map((t) => `<button class="swatch ${state.roomTheme.wall === t.id ? "selected" : ""}" data-wall="${t.id}" style="--swatch:${t.color}" aria-pressed="${state.roomTheme.wall === t.id}" aria-label="墙面${t.name}" title="${t.name}"></button>`).join("")}</div><div class="swatch-row" role="group" aria-label="地板材质"><span class="swatch-label">地板</span>${FLOOR_THEMES.map((t) => `<button class="swatch ${state.roomTheme.floor === t.id ? "selected" : ""}" data-floor="${t.id}" style="--swatch:${t.colors[0]}" aria-pressed="${state.roomTheme.floor === t.id}" aria-label="地板${t.name}" title="${t.name}"></button>`).join("")}</div><div class="piece-row"><span class="piece-name">${info ? `正在摆放：${info.icon} ${info.name}` : "点家具选中，或拖动家具摆放"}</span><div class="placement-row"><button class="soft-button" id="furniture-rotate" ${info ? "" : "disabled"}>旋转</button><button class="soft-button" id="furniture-copy" ${info ? "" : "disabled"}>复制</button><button class="soft-button" id="furniture-remove" ${info ? "" : "disabled"}>收起</button><button class="primary" id="furniture-done">完成</button></div></div>${line("拖动家具摆放，自动保存。")}`,
  );
  $$("[data-furniture]").forEach(
    (b) => (b.onclick = () => addPiece(b.dataset.furniture)),
  );
  $$("[data-wall]").forEach(
    (b) =>
      (b.onclick = () => {
        state = {
          ...state,
          roomTheme: { ...state.roomTheme, wall: b.dataset.wall },
        };
        world.setRoomTheme(state.roomTheme);
        save();
        flashSaved();
        renderDecorate();
      }),
  );
  $$("[data-floor]").forEach(
    (b) =>
      (b.onclick = () => {
        state = {
          ...state,
          roomTheme: { ...state.roomTheme, floor: b.dataset.floor },
        };
        world.setRoomTheme(state.roomTheme);
        save();
        flashSaved();
        renderDecorate();
      }),
  );
  $("#furniture-rotate").onclick = () => {
    const p = selectedPiece();
    if (p)
      world.placeSelected(
        p.x,
        p.z,
        Math.round((p.rotation + Math.PI / 4) / (Math.PI / 4)) * (Math.PI / 4),
      );
  };
  $("#furniture-copy").onclick = () => {
    const p = selectedPiece();
    if (p) addPiece(p.id);
  };
  $("#furniture-remove").onclick = () => {
    const p = selectedPiece();
    if (!p) return;
    state = removeFurniture(state, p.uid);
    selectedUid = state.furniture[0]?.uid || null;
    save();
    world.syncState(state);
    world.selectFurniture(selectedUid);
    renderDecorate();
    say("收好啦，想它了就再摆出来。");
  };
  $("#furniture-done").onclick = () => {
    const uid = selectedUid;
    showHome();
    if (uid) world.useFurniture(uid);
  };
}
function addPiece(id) {
  const f = FURNITURE_BY_ID.get(id);
  if (!f) return;
  if (!ownsFurniture(state, id)) {
    const result = purchase(state, "furniture", id);
    if (!result.ok) {
      toast(result.reason);
      return;
    }
    state = result.state;
    toast(result.reason);
  }
  if (state.furniture.length >= MAX_FURNITURE) {
    toast("房间放不下啦，先收起一件吧");
    return;
  }
  const spot = world.freeSpot(id);
  if (!spot) {
    toast("房间放不下啦，先收起一件吧");
    return;
  }
  const uid = newFurnitureUid(state, id);
  state = placeFurniture(state, { uid, id, x: spot.x, z: spot.z, rotation: 0 });
  selectedUid = uid;
  save();
  world.syncState(state);
  world.selectFurniture(uid);
  renderDecorate();
  flashSaved();
  say(`${f.name}准备好了，拖动它换个位置吧。`);
}
function openDecorate() {
  scene(
    "decorate",
    "home",
    "把小屋摆成喜欢的样子",
    "家里的每一件，都能玩",
    "点家具摆进房间，拖动摆放，随时自动保存。",
  );
  world.setMode("decorate");
  world.syncState(state);
  selectedUid = state.furniture[0]?.uid || null;
  world.selectFurniture(selectedUid);
  renderDecorate();
  say("家具你来摆，使用权本喵全包。");
}

function openPortrait() {
  scene(
    "portrait",
    "adopt",
    `${state.name}的可爱特写`,
    "靠近一点，看见小表情",
    "拖动转视角，轻轻回应小猫的三个心愿。",
  );
  world.setMode("portrait");
  session = createPortraitSession(`portrait-${runId()}`);
  shelf(
    `<div class="portrait-wish" aria-live="polite" aria-atomic="true">
  <div class="portrait-wish-heading"><span id="portrait-wish-label">小猫的小心愿</span><div id="portrait-progress" class="portrait-progress" role="progressbar" aria-label="本轮小心愿" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0"><span class="portrait-marks" aria-hidden="true">${session.requests.map(() => `<i>${icon("paw")}</i>`).join("")}</span><b id="portrait-count">0 / 3</b></div></div>
  <strong id="portrait-wish-text"></strong>
 </div>
 <div class="portrait-actions" role="group" aria-label="轻轻回应小猫">${PORTRAIT_ACTIONS.map((action) => `<button type="button" class="portrait-action" data-portrait-action="${action.id}" aria-label="${esc(action.label)}" aria-disabled="false"><span class="portrait-action-icon" aria-hidden="true">${icon(action.icon)}</span><span class="portrait-action-label">${esc(action.label)}</span></button>`).join("")}</div>
 <p id="portrait-response" class="portrait-response" role="status" aria-live="polite" aria-atomic="true"></p>
 <div class="portrait-footer"><span id="portrait-reassurance">摸错也没关系，慢慢来。</span><button type="button" class="primary" id="portrait-again" hidden>再陪一轮</button><button type="button" class="soft-button" id="portrait-home">回到小屋</button></div>`,
    "portrait-shelf",
  );
  $$("[data-portrait-action]").forEach(
    (button) =>
      (button.onclick = () =>
        startPortraitAction(button.dataset.portraitAction)),
  );
  $("#portrait-again").onclick = () => {
    if (
      mode === "portrait" &&
      session?.kind === "portrait" &&
      session.done &&
      session.pending === null
    )
      openPortrait();
  };
  $("#portrait-home").onclick = showHome;
  renderPortraitStatus("点小猫或下方按钮，陪它完成三个小心愿。");
}
function renderPortraitStatus(response) {
  if (mode !== "portrait" || session?.kind !== "portrait") return;
  busy = session.pending !== null;
  const wish = PORTRAIT_ACTIONS.find(
    (action) => action.id === session.requests[session.count],
  );
  $("#portrait-wish-label").textContent = T(
    session.done ? "心愿完成 · 已获奖励" : "小猫的小心愿",
  );
  $("#portrait-wish-text").textContent = session.done
    ? "爱心 +2 · 亲密 +5 · 心情 +10"
    : T(wish.request);
  $("#portrait-wish-text").classList.toggle("is-reward", session.done);
  $("#portrait-count").textContent = `${session.count} / 3`;
  $("#portrait-progress").setAttribute("aria-valuenow", String(session.count));
  $("#portrait-progress").setAttribute(
    "aria-valuetext",
    `已完成 ${session.count} 个，共 3 个小心愿`,
  );
  $$(".portrait-marks i").forEach((mark, index) =>
    mark.classList.toggle("earned", index < session.count),
  );
  $$("[data-portrait-action]").forEach((button) => {
    const action = PORTRAIT_ACTIONS.find(
        (item) => item.id === button.dataset.portraitAction,
      ),
      active = session.pending === action.id;
    button.setAttribute("aria-disabled", String(busy));
    button.setAttribute("aria-busy", String(active));
    button.classList.toggle("is-busy", active);
    button.querySelector(".portrait-action-label").textContent = active
      ? "回应中…"
      : action.label;
  });
  $("#portrait-again").hidden = !session.done;
  $("#portrait-again").disabled = busy;
  $("#portrait-reassurance").hidden = session.done;
  $("#portrait-response").textContent = T(response);
}
function startPortraitAction(action) {
  if (
    mode !== "portrait" ||
    session?.kind !== "portrait" ||
    !beginPortraitAction(session, action)
  )
    return;
  if (!world.interactPortrait(action)) {
    session.pending = null;
    renderPortraitStatus("小猫还没准备好，等一下再试。");
    return;
  }
  const spec = PORTRAIT_ACTIONS.find((item) => item.id === action);
  renderPortraitStatus(`正在${spec.label}，等小猫回应一下。`);
  if (spec.sound === "purr") content(1.5, speciesOf().voice);
  else if (spec.sound === "meow")
    speak(breedOf().voice, speciesOf().voice, "happy");
  else tone(620, 0.18);
}
function completePortraitAction(action) {
  if (mode !== "portrait" || session?.kind !== "portrait") return;
  const result = finishPortraitAction(session, action);
  if (result === "ignored") return;
  const spec = PORTRAIT_ACTIONS.find((item) => item.id === action);
  let response = spec.response;
  if (result === "miss") {
    const wish = PORTRAIT_ACTIONS.find(
      (item) => item.id === session.requests[session.count],
    );
    response += ` 还想${wish.label}，慢慢来。`;
  } else if (result === "complete") {
    commit(
      reward(state, {
        id: session.id,
        hearts: 2,
        bond: 5,
        stat: "mood",
        amount: 10,
        memory: "第一次近景陪伴：读懂了小猫的三个心愿，和它又亲近了一点。",
      }),
      true,
    );
    response += " 喜欢的话，还可以继续陪我。";
  } else if (result === "free") response += " 这一轮完成啦，继续亲近也很好。";
  renderPortraitStatus(response);
}
function pet() {
  if (!state.adopted) {
    world.pet();
    say("摸摸可以，领回家更可以。");
    return;
  }
  if (!["home", "wardrobe"].includes(mode)) return;
  world.pet();
  if (Date.now() - lastPet > 3000) {
    lastPet = Date.now();
    commit(reward(state, { bond: 1, stat: "mood", amount: 2 }));
    hearts();
    tone(570);
  }
  if (Math.random() < 0.4) {
    meowNow(
      "happy",
      state.bond >= 35
        ? "蹭蹭你！本喵已经认定这位人类。"
        : "呼噜呼噜…已切换成小马达。",
    );
  } else {
    content(1.5, speciesOf().voice);
    say(
      [
        "再摸一下？再一下也行。",
        "你的手被本喵征用了。",
        "呼噜噜…这个位置，再久一点。",
      ][Math.floor(Math.random() * 3)],
    );
  }
}
function showDialog(title, summary, html) {
  $("#album h2").textContent = T(title);
  $("#album-summary").textContent = T(summary);
  $("#memory-list").innerHTML = T(html);
  $("#album").showModal();
  world.setPaused(true);
}
function showAlbum() {
  showDialog(
    "我们的喵喵纪念册",
    `${state.name}和你：${bondLevel(state).name}，亲密 ${state.bond}。`,
    `<div class="memory-stamps"><span>${icon("cat")}<b>${state.visits}</b><small>次回家</small></span><span>${icon("feed")}<b>${state.recipes.length}</b><small>种猫饭</small></span><span>${icon("map")}<b>${state.journeys}</b><small>次探险</small></span></div><section class="photo-album"><button class="primary" id="photo-add" ${state.photos.length >= MAX_PHOTOS ? "disabled" : ""}>拍下此刻 · ${state.photos.length}/${MAX_PHOTOS}</button><p id="photo-note" role="status">${saveOK ? "照片压缩后保存在本机，也会随存档一起导出。" : "尚未保存！照片暂存于当前页面，请先导出存档，或删除照片后重试。"}</p><div class="photo-grid">${state.photos
      .slice()
      .reverse()
      .map(
        (p) =>
          `<figure class="photo-card"><img src="${p.image}" width="${p.width}" height="${p.height}" alt="${esc(p.name)}的纪念照" loading="lazy"><figcaption><b>${esc(p.name)}</b><time datetime="${esc(p.at)}">${esc(new Date(p.at).toLocaleString("zh-CN"))}</time><small>${esc(outfitSummary(p.outfit))}</small><div><a href="${p.image}" download="cococat-${p.id}.jpg">下载照片</a><button data-delete-photo="${p.id}" aria-label="删除${esc(p.name)}的这张照片">删除</button></div></figcaption></figure>`,
      )
      .join(
        "",
      )}</div></section><div class="memory-book">${state.memories.map((m, i) => `<article class="memory-ticket"><span class="memory-seal">${icon(["cat", "heart", "paw", "gift", "map"][i % 5])}</span><div><small>回忆 ${String(i + 1).padStart(2, "0")}</small><p>${esc(m)}</p></div></article>`).join("")}</div>`,
  );
  $("#photo-add").onclick = () => {
    try {
      world.draw();
      const next = addPhoto(state, capturePhoto($("#world"), state));
      if (next === state) return;
      commit(next);
      showAlbum();
    } catch (error) {
      $("#photo-note").textContent = error.message;
    }
  };
  $$("[data-delete-photo]").forEach(
    (b) =>
      (b.onclick = () => {
        commit(removePhoto(state, b.dataset.deletePhoto));
        showAlbum();
      }),
  );
}
function showCollection() {
  showDialog(
    "小猫的宝物抽屉",
    `发现 ${state.collection.length} / ${TREASURES.length} 件宝物。挑选最多 3 件摆在小屋展示架，已展示 ${state.displayedTreasures.length}/3。`,
    `<div class="collection-grid">${TREASURES.map((t) => {
      const owned = state.collection.includes(t.id),
        shown = state.displayedTreasures.includes(t.id);
      return `<button class="collection-item ${owned ? "found" : ""}" data-display="${t.id}" aria-pressed="${shown}" ${owned ? "" : "disabled"}><span>${owned ? t.icon : "?"}</span><b>${owned ? t.name : "还没发现"}</b><small>${shown ? "✓ 展示中 · 点此收起" : owned ? "摆到小屋" : REGIONS.find((r) => r.id === t.region).name}</small></button>`;
    }).join("")}</div>`,
  );
  $$("[data-display]").forEach(
    (b) =>
      (b.onclick = () => {
        const next = toggleTreasureDisplay(state, b.dataset.display);
        if (next === state) {
          toast("展示架最多放三件，先收起一件再换吧。");
          return;
        }
        commit(next);
        showCollection();
      }),
  );
}
function showBond() {
  showDialog(
    "从小室友，到一家人",
    `现在是「${bondLevel(state).name}」，亲密 ${state.bond}。`,
    `<div class="bond-trail">${BONDS.map((t, i) => `<article class="bond-stop ${state.bond >= t.at ? "unlocked" : ""}"><span>${icon(["cat", "paw", "heart", "gift"][i % 4])}</span><div><small>${state.bond >= t.at ? "已解锁" : `再积累 ${t.at - state.bond} 点亲密`}</small><b>${t.name}</b><p>${t.hint}</p></div><em>${state.bond >= t.at ? "✓" : t.at}</em></article>`).join("")}</div>`,
  );
}

// ── 摇杆走路 ────────────────────────────────────────────────
function setPad() {
  const el = $("#move-pad");
  if (!el) return;
  el.hidden = !["home", "explore"].includes(mode);
  if (el.hidden) clearDrive();
}
function applyDrive() {
  driveX = (pressed.has("r") ? 1 : 0) - (pressed.has("l") ? 1 : 0);
  driveZ = (pressed.has("f") ? 1 : 0) - (pressed.has("b") ? 1 : 0);
  world?.setDrive?.(driveX, driveZ);
}
function clearDrive() {
  pressed.clear();
  driveX = 0;
  driveZ = 0;
  world?.setDrive?.(0, 0);
}
$$("[data-drive]").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const k = b.dataset.drive;
    if (b.setPointerCapture)
      try {
        b.setPointerCapture(e.pointerId);
      } catch {}
    pressed.add(k);
    applyDrive();
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(ev, () => {
      pressed.delete(b.dataset.drive);
      applyDrive();
    });
  b.addEventListener("pointerleave", () => {
    if (!b.hasPointerCapture || !b.hasPointerCapture(0)) {
      pressed.delete(b.dataset.drive);
      applyDrive();
    }
  });
});
const KEYMAP = {
  ArrowUp: "f",
  ArrowDown: "b",
  ArrowLeft: "l",
  ArrowRight: "r",
  w: "f",
  s: "b",
  a: "l",
  d: "r",
};
document.addEventListener("keydown", (e) => {
  const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()];
  if (!k || e.repeat || !["home", "explore"].includes(mode)) return;
  if (
    document.querySelector("dialog[open]") ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
  )
    return;
  e.preventDefault();
  pressed.add(k);
  applyDrive();
});
document.addEventListener("keyup", (e) => {
  const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()];
  if (!k) return;
  if (pressed.delete(k)) applyDrive();
});
window.addEventListener("blur", clearDrive);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearDrive();
});

function worldEvent(type, data) {
  if (!world) return;
  if (type === "input-mode") {
    $(".view-controls span").textContent = T(
      {
        home: "方向键 / WASD 或摇杆走路 · 点地面走过去 · 点猫咪摸摸",
        wand: "拖动羽毛 · 箭头转视角",
        fetch: "点地面抛球 · 箭头转视角",
        hide: "点箱子找猫 · 箭头转视角",
        scrub: "在猫身上拖海绵",
        rinse: "在猫身上拖花洒",
        decorate: "拖动家具摆放，自动保存",
        explore: "摇杆走路 · 点地面走过去",
        portrait: "拖动转视角 · 点头、下巴、鼻尖或前爪",
      }[data.mode] || "拖动看看 · 点猫咪摸摸",
    );
    return;
  }
  if (type === "portrait-touch") {
    if (mode === "portrait" && session?.kind === "portrait")
      startPortraitAction(data.action);
    return;
  }
  if (type === "portrait-complete") {
    if (mode === "portrait" && session?.kind === "portrait")
      completePortraitAction(data.action);
    return;
  }
  if (type === "placement-blocked") {
    toast("这里放不下啦，给小猫和家具留点空间吧。");
    return;
  }
  if (type === "frame") {
    if (data.cat) catScreen = data.cat;
    for (const label of data.labels) {
      const el = $(`[data-spot="${label.id}"]`);
      if (el) {
        el.style.left = `${label.x}px`;
        el.style.top = `${label.y}px`;
      }
    }
    return;
  }
  if (type === "behavior" && mode === "home") say(data.text);
  if (type === "arrived-call" && mode === "home") {
    say("听到名字就来了！小爪爪比嘴还诚实。");
    hearts();
    meowNow("happy");
  }
  if (type === "wand-catch" && mode === "toy" && session?.kind === "wand") {
    toyPoint();
    meowNow("happy");
    if (!session.done)
      say(
        session.count % 2
          ? "抓到了！再换个位置，本喵还能追！"
          : "差点刹不住车。没事，猫的事不算出糗。",
      );
  }
  if (type === "ball-thrown" && $("#throw-ball")) {
    $("#throw-ball").disabled = true;
    say("小球已发射，快递喵出动！");
  }
  if (type === "fetch-return" && session?.kind === "fetch") {
    toyPoint();
    if ($("#throw-ball")) $("#throw-ball").disabled = false;
    if (!session.done) say("签收一下！这次运费是摸摸头。");
  }
  if (type === "hide-found" && session?.kind === "hide") toyPoint();
  if (type === "hide-miss") say("这个箱子空空的。再看看哪个箱子在偷偷动。");
  if (type === "bath-stroke") bathStroke(data.amount);
  if (type === "visit-spot") visitSpot(data.id);
  if (type === "select-furniture" && mode === "decorate") {
    selectedUid = data.uid || data.id;
    renderDecorate();
    say(`正在摆放：${FURNITURE_BY_ID.get(data.id)?.name || "家具"}`);
  }
  if (type === "placement-end") placementSave.flush();
  if (type === "place" && mode === "decorate") {
    state = placeFurniture(state, {
      uid: data.uid,
      id: data.id,
      x: data.x,
      z: data.z,
      rotation: data.rotation,
    });
    placementSave.schedule();
    if ($("#decorate-saved")) $("#decorate-saved").textContent = "正在保存…";
  }
  if (type === "gift-check" && !giftChecked && mode === "home") {
    giftChecked = true;
    const today = new Date().toLocaleDateString("en-CA");
    if (state.lastGiftDay !== today) {
      commit(
        {
          ...reward(state, {
            id: `gift-${today}`,
            hearts: 3,
            memory: "第一次收到小猫礼物：它把最宝贝的小东西叼给了你。",
          }),
          lastGiftDay: today,
        },
        true,
      );
      world.pose("gift", 5);
      say("小猫叼来一份礼物：这颗爱心，只送给最喜欢的人。爱心 +3！");
      meowNow("happy");
    }
  }
}
$("#album-done").onclick = () => $("#album").close();
$("#album").addEventListener("click", (e) => {
  if (e.target === $("#album")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.target.close();
  }
});
$("#home").onclick = () => {
  if (busy || (mode === "bath" && bathPhase !== "done"))
    toast("先回家休息，未完成的这次照顾不会发奖励。");
  showHome();
};
$("#rotate-left").onclick = () => world.rotate(-1);
$("#rotate-right").onclick = () => world.rotate(1);
$("#sound").onclick = () => {
  const on = !soundEnabled();
  setSoundEnabled(on);
  $(".sound-off").hidden = on;
  $("#sound").setAttribute("aria-label", on ? "关闭音效" : "开启音效");
  $("#sound").title = on ? "关闭音效" : "开启音效";
  if (on) tone(660);
  toast(on ? "轻轻的音效已开启" : "音效已关闭");
};
function pauseForDialog() {
  world.setPaused(!!document.querySelector("dialog[open]"));
}
for (const dialog of $$("dialog"))
  dialog.addEventListener("close", pauseForDialog);
let lastIdleMeow = performance.now();
setInterval(() => {
  if (
    !state.adopted ||
    document.hidden ||
    busy ||
    mode !== "home" ||
    document.querySelector("dialog[open]")
  )
    return;
  const now = performance.now();
  if (now - lastIdleMeow < 25000 + Math.random() * 25000) return;
  lastIdleMeow = now;
  const hungry = state.fullness < 35;
  meowNow(
    hungry
      ? "hungry"
      : ["happy", "question", "sleepy"][Math.floor(Math.random() * 3)],
    hungry ? "肚子在唱歌，喵得有点大声。" : undefined,
  );
}, 7000);
function openSettings() {
  let previous = null;
  try {
    previous = previousGame(localStorage);
  } catch {}
  $("#restore-save").hidden = !previous;
  $("#settings").showModal();
  world.setPaused(true);
}
$("#save-help").onclick = openSettings;
function activateSave(next) {
  // The replacement is already on disk; a queued placement save still holds the old game and must not land after it.
  placementSave.cancel();
  cleanup();
  state = next;
  selected = state.breed;
  homeTab = "care";
  giftChecked = false;
  lastPet = 0;
  slotTab = "head";
  selectedIngredients = ["fish"];
  selectedUid = state.furniture[0]?.uid || null;
  saveBlocked = false;
  loadError = null;
  renderSaveStatus(true);
  world.setCat(state.breed, state.outfit);
  world.syncState(state);
  if (state.adopted) showHome();
  else showAdopt();
}
installSaveTools({
  getState: () => state,
  isBlocked: () => saveBlocked,
  activate: activateSave,
  onDialog: pauseForDialog,
  toast,
});
$("#quality").value = world.quality;
$("#quality").onchange = () => {
  const value = $("#quality").value;
  world.setQuality(value);
  toast(
    saveQuality(value)
      ? "画质已保存，下次打开继续使用。"
      : "本次画质已切换，但浏览器未能保存偏好。",
  );
};
$("#settings-open").onclick = openSettings;
$("#settings-close").onclick = $("#settings-done").onclick = () =>
  $("#settings").close();
$("#camera-reset").onclick = () => {
  world.resetCamera();
  $("#settings").close();
  toast("已恢复默认视角");
};
$("#restart-open").onclick = () => {
  $("#settings").close();
  $("#restart-confirm").showModal();
  world.setPaused(true);
};
$("#restart-cancel").onclick = () => $("#restart-confirm").close();
$("#restart-confirm-button").onclick = () => {
  try {
    const next = restartGame(localStorage, state);
    $("#restart-confirm").close();
    activateSave(next);
    toast("新的故事开始了，选一只小可爱吧。");
  } catch {
    toast("暂时无法保存新进度，原来的小猫还在。");
  }
};
$("#restore-save").onclick = () => {
  try {
    const previous = restoreGame(localStorage);
    if (!previous) return;
    $("#settings").close();
    activateSave(previous);
    toast("上一次的小猫和进度已恢复");
  } catch {
    toast("暂时无法恢复，请检查浏览器存储空间。");
  }
};

{
  const on = initSound();
  $(".sound-off").hidden = on;
  $("#sound").setAttribute("aria-label", on ? "关闭音效" : "开启音效");
  $("#sound").title = on ? "关闭音效" : "开启音效";
}
world.setCat(state.breed, state.outfit);
world.syncState(state);
if (state.adopted) {
  state.visits++;
  save();
  showHome();
} else showAdopt();
$("#loading").remove();
setInterval(() => {
  if (!state.adopted || document.hidden || busy || mode !== "home") return;
  commit({
    ...state,
    fullness: Math.max(10, state.fullness - 1),
    clean: Math.max(10, state.clean - 1),
    mood: Math.max(10, state.mood - 1),
  });
}, 90000);
renderSaveStatus(saveOK);
window.addEventListener("pagehide", () => {
  placementSave.flush();
  if (state.adopted) save();
});
window.addEventListener("blur", () => placementSave.flush());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) placementSave.flush();
});
window.__miaow = {
  inspect: () => ({
    state: structuredClone(state),
    mode,
    busy,
    session,
    outing,
    drive: { x: driveX, z: driveZ, keys: [...pressed] },
    world: world.inspect(),
  }),
};
