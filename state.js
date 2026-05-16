// state.js

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    const merged = { ...structuredClone(defaultState), ...parsed };
    merged.calories = {
      ...defaultState.calories,
      ...(parsed.calories || {})
    };
    merged.weightLog = Array.isArray(parsed.weightLog) ? parsed.weightLog : [];
    merged.dailyHistory = Array.isArray(parsed.dailyHistory)
      ? parsed.dailyHistory
      : [];
    merged.customQuests = Array.isArray(parsed.customQuests)
      ? parsed.customQuests
      : [];
    merged.reminders = {
      ...defaultState.reminders,
      ...(parsed.reminders || {}),
      lastFiredDates: {
        ...(defaultState.reminders.lastFiredDates || {}),
        ...((parsed.reminders && parsed.reminders.lastFiredDates) || {})
      }
    };
    return merged;
  } catch (e) {
    console.error("Failed to load state", e);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayInfo() {
  const today = new Date();
  const dow = today.getDay(); // 0–6
  const label = [
    "Sunday – Recovery & Reset",
    "Monday – Hill Footprints Strength",
    "Tuesday – Cardio Climb",
    "Wednesday – Hill Footprints Strength",
    "Thursday – Cardio Climb",
    "Friday – Hill Footprints Strength",
    "Saturday – Recovery & Mobility"
  ][dow];
  const iso = today.toISOString().slice(0, 10);
  return { today, dow, label, iso };
}

function currentWeightKg() {
  const log = state.weightLog;
  if (Array.isArray(log) && log.length > 0) {
    return log[log.length - 1].kg;
  }
  return START_WEIGHT_KG;
}

function weightDeltaFromStart() {
  return currentWeightKg() - START_WEIGHT_KG;
}

function calcBmi() {
  const hM = HEIGHT_CM / 100;
  const weight = currentWeightKg();
  return weight / (hM * hM);
}

function zoneForLevel(level) {
  if (level >= 20) return "Zone: The Nilgiris Peak";
  if (level >= 10) return "Zone: Kolli Hills Stairway";
  if (level >= 5) return "Zone: Mount Yelagiri Ascent";
  return "Zone: Hill Footprints (Warmup Phase)";
}

function titleForLevel(level) {
  if (level >= 20) return "Peak Phantom";
  if (level >= 15) return "Cliff Vanguard";
  if (level >= 10) return "Kolli Raider";
  if (level >= 5) return "Yelagiri Ranger";
  return "Trail Rookie";
}

function allQuestsForToday() {
  const { dow } = todayInfo();
  return allQuests.concat(state.customQuests.map((q) => ({
    ...q,
    category: "CUSTOM",
    days: Object.values(Day)
  }))).filter((q) => q.days.includes(dow));
}

function computeDayXp() {
  let total = 0;
  for (const q of allQuests.concat(state.customQuests)) {
    if (state.questChecks[q.id]) total += q.xp;
  }
  return total;
}

function computeCoreStats() {
  const dayXp = computeDayXp();
  const totalXp = state.baseXp + dayXp;
  const level = Math.floor(totalXp / 100) + 1;
  const xpIntoLevel = totalXp % 100;
  const xpToNext = 100 - xpIntoLevel;
  const progressToNext = xpIntoLevel / 100;
  return { dayXp, totalXp, level, xpIntoLevel, xpToNext, progressToNext };
}

function todayCaloriesTotal() {
  const c = state.calories || {};
  return (
    (Number(c.breakfast) || 0) +
    (Number(c.lunch) || 0) +
    (Number(c.dinner) || 0) +
    (Number(c.snacks) || 0)
  );
}

function updateWeightForToday(kg) {
  const { iso } = todayInfo();
  let log = Array.isArray(state.weightLog) ? state.weightLog.slice() : [];
  const idx = log.findIndex((e) => e.date === iso);
  if (idx >= 0) {
    log[idx].kg = kg;
  } else {
    log.push({ date: iso, kg });
  }
  log.sort((a, b) => a.date.localeCompare(b.date));
  state.weightLog = log;
  saveState();
}

function appendDailyHistory(dayXp) {
  const { iso } = todayInfo();
  const calories = todayCaloriesTotal();
  const weight = currentWeightKg();
  let history = Array.isArray(state.dailyHistory) ? state.dailyHistory.slice() : [];
  const idx = history.findIndex((e) => e.date === iso);
  const entry = { date: iso, xp: dayXp, calories, weight };
  if (idx >= 0) history[idx] = entry;
  else history.push(entry);
  history.sort((a, b) => a.date.localeCompare(b.date));
  state.dailyHistory = history;
  saveState();
}