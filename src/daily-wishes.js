export const WISHES = [
  {
    id: "care",
    label: "好好照顾一次",
    hint: "吃完一碗饭、洗完澡，或一起看完节目",
    action: "feed",
  },
  {
    id: "play",
    label: "一起玩完一轮",
    hint: "逗猫棒、捡球、捉迷藏，任选一种",
    action: "wand",
  },
  {
    id: "explore",
    label: "发现一件宝物",
    hint: "去任何地方散步，成功带回一件宝物",
    action: "explore",
  },
];
export function localDay(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function normalizeDaily(data, now = Date.now()) {
  const day = localDay(now),
    validDay = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  return {
    day,
    completed:
      data?.day === day && Array.isArray(data.completed)
        ? WISHES.filter((w) => data.completed.includes(w.id)).map((w) => w.id)
        : [],
    claimedDays: Array.isArray(data?.claimedDays)
      ? [...new Set(data.claimedDays.filter(validDay))].slice(-90)
      : [],
  };
}
export function recordWish(state, kind, now = Date.now()) {
  if (!WISHES.some((w) => w.id === kind)) return state;
  const daily = normalizeDaily(state.dailyWishes, now);
  if (daily.completed.includes(kind)) return state;
  return {
    ...state,
    dailyWishes: { ...daily, completed: [...daily.completed, kind] },
  };
}
export function claimWishes(state, now = Date.now()) {
  const daily = normalizeDaily(state.dailyWishes, now);
  if (daily.completed.length !== 3 || daily.claimedDays.includes(daily.day))
    return state;
  return {
    ...state,
    hearts: state.hearts + 3,
    dailyWishes: {
      ...daily,
      claimedDays: [...daily.claimedDays, daily.day].slice(-90),
    },
  };
}
