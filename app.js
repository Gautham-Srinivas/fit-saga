// app.js

let xpChartInstance = null;
let weightChartInstance = null;
let calorieChartInstance = null;

window.addEventListener("load", () => {
  renderAll();
  setupCoreEvents();
  startReminderLoop();
});

function renderAll() {
  renderDashboard();
  renderQuests();
  renderDiet();
  renderAnalytics();
}

// ---------- DASHBOARD & ROUTINE ----------

function renderDashboard() {
  const { today } = todayInfo();
  document.getElementById("todayDate").textContent = today.toDateString();

  const bmi = calcBmi();
  const currentW = currentWeightKg();
  const startW = START_WEIGHT_KG;
  const deltaW = weightDeltaFromStart();

  document.getElementById("startWeightChip").textContent = startW.toFixed(1) + " kg";
  document.getElementById("currentWeightChip").textContent = currentW.toFixed(1) + " kg";
  document.getElementById("bmiValue").textContent = bmi.toFixed(1);

  let weightLine = `Start: ${startW.toFixed(1)} kg • Current: ${currentW.toFixed(1)} kg. `;
  if (Math.abs(deltaW) < 0.1) {
    weightLine += "Trend: stable. Let consistency compound for a few weeks.";
  } else if (deltaW < 0) {
    weightLine += `Net loss: ${Math.abs(deltaW).toFixed(1)} kg ✅ Strong fat‑loss signal.`;
  } else {
    weightLine += `Net gain: ${deltaW.toFixed(1)} kg. If unintentional, tighten calories and walks.`;
  }
  document.getElementById("weightChangeLine").textContent = weightLine;

  const stats = computeCoreStats();
  const zone = zoneForLevel(stats.level);
  const title = titleForLevel(stats.level);
  document.getElementById("zoneLabel").textContent = zone;
  document.getElementById("levelText").textContent = stats.level.toString();
  document.getElementById("titleText").textContent = title;
  document.getElementById("xpSummary").textContent = `XP ${stats.totalXp} / 100`;
  document.getElementById("xpLevelLine").textContent =
    `XP this level: ${stats.xpIntoLevel} / 100 • ${stats.xpToNext} XP to next level`;
  document.getElementById("lifetimeXpLine").textContent =
    `Total XP (lifetime): ${stats.totalXp}`;
  document.getElementById("dayXpLine").textContent = `Day XP: ${stats.dayXp}`;

  const targetDayXp = 140;
  const momentum = Math.min(1, stats.dayXp / targetDayXp);

  document.getElementById("levelProgress").style.width =
    (stats.progressToNext * 100).toFixed(1) + "%";
  document.getElementById("momentumProgress").style.width =
    (momentum * 100).toFixed(1) + "%";

  document.getElementById("streakLine").textContent =
    `Streak: ${state.currentStreak} days • Best: ${state.bestStreak} days`;

  document.getElementById("dayMeta").textContent = `Day XP: ${stats.dayXp}`;
  document.getElementById("totalMeta").textContent =
    `Total XP: ${stats.totalXp} • Level ${stats.level}`;

  // intention & energy
  document.getElementById("intentionInput").value = state.intention;
  document.getElementById("energyLabel").textContent = state.energyLevel.toString();

  const energyRow = document.getElementById("energyRow");
  energyRow.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const pill = document.createElement("div");
    pill.className = "energy-pill" + (i <= state.energyLevel ? " active" : "");
    pill.textContent = i.toString();
    pill.addEventListener("click", () => {
      state.energyLevel = i;
      saveState();
      renderDashboard();
    });
    energyRow.appendChild(pill);
  }

  document.getElementById("pplxKeyInput").value = state.pplxApiKey || "";

  renderRoutine();
  renderBadges();
}

function renderRoutine() {
  const { dow } = todayInfo();
  const container = document.getElementById("routineContainer");
  container.innerHTML = "";

  const routineQuests = allQuests.concat(state.customQuests).filter(
    (q) => q.category === "ROUTINE" && (q.days || Object.values(Day)).includes(dow)
  );

  for (const q of routineQuests) {
    container.appendChild(renderQuestRow(q));
  }
}

// ---------- BADGES ----------

function renderBadges() {
  const list = document.getElementById("badgeList");
  list.innerHTML = "";

  const stats = computeCoreStats();
  const totalCalories = todayCaloriesTotal();
  const target = Number(state.calories.target) || 0;
  const deltaKcal = target ? totalCalories - target : 0;

  const badges = [];

  if (state.currentStreak >= 3) {
    badges.push("Consistency Ember – 3+ day streak online.");
  }
  if (state.currentStreak >= 7) {
    badges.push("Trail Blazer – 7+ days without breaking the chain.");
  }
  if (stats.dayXp >= 140) {
    badges.push("Full‑Clear Titan – Hit your target XP for the day.");
  }

  const cardioIds = ["home_rucking_prep", "stair_stepping"];
  let cardioXp = 0;
  for (const q of allQuests) {
    if (cardioIds.includes(q.id) && state.questChecks[q.id]) cardioXp += q.xp;
  }
  if (cardioXp >= 60) {
    badges.push("Stair Slayer – Cardio climb completed.");
  }

  const coreIds = ["reverse_crunches", "hollow_body_hold", "plank_tap_outs"];
  const coreAllDone = coreIds.every((id) => state.questChecks[id]);
  if (coreAllDone) {
    badges.push("Core Sentinel – All core quests cleared.");
  }

  const dietIds = [
    "diet_protein_target",
    "diet_zero_liquid_calories",
    "diet_hydration",
    "diet_calorie_deficit"
  ];
  const dietCompleted = dietIds.filter((id) => state.questChecks[id]).length;
  if (dietCompleted >= 3) {
    badges.push("Campfire Discipline – Diet quests mostly locked in.");
  }

  if (target > 0 && Math.abs(deltaKcal) < 150) {
    badges.push("Macro Sharpshooter – Intake close to target.");
  }

  if (!badges.length) {
    badges.push("No badges yet. Clear a few quests and bank your day to unlock them.");
  }

  for (const b of badges) {
    const li = document.createElement("li");
    li.textContent = b;
    list.appendChild(li);
  }
}

// ---------- TRAINING ----------

function renderQuests() {
  const { dow, label } = todayInfo();
  document.getElementById("todayLabel").textContent = label;

  const container = document.getElementById("questsContainer");
  container.innerHTML = "";

  const categories = ["STRENGTH", "CARDIO", "RECOVERY", "LIFESTYLE", "CUSTOM"];
  const titles = {
    STRENGTH: "Strength Climb (Mon/Wed/Fri)",
    CARDIO: "Cardio Ascent (Tue/Thu)",
    RECOVERY: "Weekend Recovery & Mobility",
    LIFESTYLE: "Lifestyle Buffs (Daily)",
    CUSTOM: "Custom Habits (Your Quests)"
  };

  for (const cat of categories) {
    const rawQuests =
      cat === "CUSTOM"
        ? state.customQuests
        : allQuests.filter((q) => q.category === cat);
    if (!rawQuests.length) continue;

    const sectionQuests = rawQuests.filter((q) => {
      const days = q.days || Object.values(Day);
      return days.includes(dow) || cat === "LIFESTYLE" || cat === "CUSTOM";
    });

    if (!sectionQuests.length) continue;

    const titleEl = document.createElement("div");
    titleEl.className = "quest-section-title";
    titleEl.textContent = titles[cat];
    container.appendChild(titleEl);

    for (const q of sectionQuests) {
      container.appendChild(renderQuestRow(q));
    }
  }
}

function renderQuestRow(q) {
  const item = document.createElement("div");
  item.className = "quest-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = !!state.questChecks[q.id];
  checkbox.addEventListener("change", () => {
    state.questChecks[q.id] = checkbox.checked;
    saveState();
    renderAll();
  });

  const main = document.createElement("div");
  main.className = "quest-main";

  const title = document.createElement("div");
  title.className = "quest-title";
  title.textContent = q.title;
  main.appendChild(title);

  const sub = document.createElement("div");
  sub.className = "quest-sub";
  sub.textContent = q.subtitle;
  main.appendChild(sub);

  if (q.timeHint) {
    const meta = document.createElement("div");
    meta.className = "quest-meta";
    meta.textContent = q.timeHint;
    main.appendChild(meta);
  }

  if (q.tutorialUrl) {
    const tut = document.createElement("a");
    tut.href = q.tutorialUrl;
    tut.target = "_blank";
    tut.rel = "noopener noreferrer";
    tut.className = "quest-meta";
    tut.textContent = "Tutorial ↗";
    main.appendChild(tut);
  }

  const xp = document.createElement("div");
  xp.className = "quest-xp";
  xp.textContent = `+${q.xp} XP`;

  item.appendChild(checkbox);
  item.appendChild(main);
  item.appendChild(xp);

  return item;
}

// ---------- NUTRITION ----------

function renderDiet() {
  const container = document.getElementById("dietQuestsContainer");
  container.innerHTML = "";
  const dietQuests = allQuests.filter((q) => q.category === "DIET");
  const { dow } = todayInfo();

  const title = document.createElement("div");
  title.className = "quest-section-title";
  title.textContent = "Diet Discipline Quests";
  container.appendChild(title);

  for (const q of dietQuests) {
    if (!q.days.includes(dow)) continue;
    container.appendChild(renderQuestRow(q));
  }

  document.getElementById("cupsLabel").textContent = state.cupsDrunk.toString();
  const hydProg = Math.min(1, state.cupsDrunk / 16);
  document.getElementById("hydrationProgress").style.width =
    (hydProg * 100).toFixed(1) + "%";

  renderCalories();
  renderWeightCard();
}

function renderCalories() {
  const c = state.calories || {};
  const inputs = {
    breakfast: document.getElementById("calBreakfast"),
    lunch: document.getElementById("calLunch"),
    dinner: document.getElementById("calDinner"),
    snacks: document.getElementById("calSnacks"),
    target: document.getElementById("calTarget")
  };

  inputs.breakfast.value = c.breakfast || "";
  inputs.lunch.value = c.lunch || "";
  inputs.dinner.value = c.dinner || "";
  inputs.snacks.value = c.snacks || "";
  inputs.target.value = c.target || "";

  Object.entries(inputs).forEach(([key, input]) => {
    input.oninput = () => {
      const val = parseInt(input.value, 10);
      state.calories[key] = Number.isFinite(val) && val >= 0 ? val : 0;
      saveState();
      renderCalories();
      renderBadges();
      renderAnalytics();
    };
  });

  const total = todayCaloriesTotal();
  const target = Number(c.target) || 0;
  let line = `Estimated intake today: ${total || 0} kcal. `;
  if (target > 0) {
    const delta = total - target;
    if (Math.abs(delta) < 120) {
      line += `Close to target (${target} kcal). Nice calibration.`;
    } else if (delta < 0) {
      line += `Approx deficit: ${Math.abs(delta).toFixed(0)} kcal below target – fat‑loss zone.`;
    } else {
      line += `Approx surplus: ${delta.toFixed(0)} kcal above target – tighten portions or snacks.`;
    }
  } else {
    line += "Set a daily target to see deficit/surplus guidance.";
  }
  document.getElementById("calorieSummaryLine").textContent = line;
}

function renderWeightCard() {
  const weightInput = document.getElementById("weightInput");
  weightInput.value = currentWeightKg().toFixed(1);

  weightInput.oninput = () => {
    const v = parseFloat(weightInput.value);
    if (!Number.isFinite(v) || v <= 0 || v > 300) return;
    updateWeightForToday(v);
    renderAll();
  };

  const delta = weightDeltaFromStart();
  const textEl = document.getElementById("weightSummaryLine");
  let text = "";
  if (Math.abs(delta) < 0.1) {
    text = "Trend: stable. Stay consistent with XP, steps, and nutrition for a few more weeks.";
  } else if (delta < 0) {
    text = `Trend: ~${Math.abs(delta).toFixed(1)} kg lost since start – strong progress.`;
  } else {
    text = `Trend: ~${delta.toFixed(1)} kg gained since start. If not intentional, reduce calories and push movement.`;
  }
  textEl.textContent = text;
}

// ---------- ANALYTICS (CHARTS & REPORT) ----------

function renderAnalytics() {
  const history = state.dailyHistory || [];
  const recent = history.slice(-14);
  const labels = recent.map((h) => h.date.slice(5)); // MM-DD
  const xpData = recent.map((h) => h.xp);
  const weightData = recent.map((h) => h.weight);
  const calorieData = recent.map((h) => h.calories);
  const target = Number(state.calories.target) || 0;
  const calorieTarget = recent.map(() => target);

  const xpCtx = document.getElementById("xpChart");
  const weightCtx = document.getElementById("weightChart");
  const calCtx = document.getElementById("calorieChart");

  if (!xpCtx || !weightCtx || !calCtx) return;
  if (xpChartInstance) xpChartInstance.destroy();
  if (weightChartInstance) weightChartInstance.destroy();
  if (calorieChartInstance) calorieChartInstance.destroy();

  xpChartInstance = new Chart(xpCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "XP",
          data: xpData,
          backgroundColor: "#00e676",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });

  weightChartInstance = new Chart(weightCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Weight (kg)",
          data: weightData,
          borderColor: "#00b0ff",
          backgroundColor: "rgba(0,176,255,0.2)",
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: false } }
    }
  });

  calorieChartInstance = new Chart(calCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Calories",
          data: calorieData,
          borderColor: "#00e676",
          backgroundColor: "rgba(0,230,118,0.2)",
          tension: 0.2
        },
        {
          label: "Target",
          data: calorieTarget,
          borderColor: "#ff5252",
          borderDash: [4, 4],
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: false } }
    }
  });

  // Weekly summary
  const last7 = history.slice(-7);
  const xpSum = last7.reduce((s, h) => s + (h.xp || 0), 0);
  const calSum = last7.reduce((s, h) => s + (h.calories || 0), 0);
  const avgXp = last7.length ? (xpSum / last7.length) : 0;
  const avgCal = last7.length ? (calSum / last7.length) : 0;
  const avgDelta = target ? avgCal - target : 0;

  let line = "";
  if (!last7.length) {
    line = "No banked days yet. Bank your first few days to see weekly trends.";
  } else {
    line = `Last ${last7.length} days: avg XP ~${avgXp.toFixed(0)}, avg intake ~${avgCal.toFixed(0)} kcal. `;
    if (target > 0) {
      if (Math.abs(avgDelta) < 120) {
        line += "Calories roughly at target – weight should slowly trend down if steps stay high.";
      } else if (avgDelta < 0) {
        line += `On average ${Math.abs(avgDelta).toFixed(0)} kcal below target – expect fat loss if maintained.`;
      } else {
        line += `On average ${avgDelta.toFixed(0)} kcal above target – tighten diet on a few days.`;
      }
    }
  }
  document.getElementById("weeklyReportLine").textContent = line;
}

// ---------- CORE EVENTS & SETTINGS ----------

function setupCoreEvents() {
  // tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.querySelectorAll("main section").forEach((sec) => {
        sec.style.display = sec.id === "tab-" + tab ? "" : "none";
      });
      if (tab === "analytics") {
        renderAnalytics();
      }
    });
  });

  // intention
  const intentionInput = document.getElementById("intentionInput");
  intentionInput.addEventListener("input", () => {
    state.intention = intentionInput.value;
    saveState();
  });

  // hydration
  document.getElementById("decCupBtn").addEventListener("click", () => {
    state.cupsDrunk = Math.max(0, state.cupsDrunk - 1);
    saveState();
    renderDiet();
  });
  document.getElementById("incCupBtn").addEventListener("click", () => {
    state.cupsDrunk = Math.min(20, state.cupsDrunk + 1);
    saveState();
    renderDiet();
  });

  // reset & history
  document.getElementById("resetDayBtn").addEventListener("click", () => {
    const stats = computeCoreStats();
    const ok = confirm(
      `Save Today & Clear?\n\nThis will:\n• Add today's XP (${stats.dayXp}) to your lifetime XP\n• Save today's stats into charts\n• Clear all today's checkboxes\n\nYour history and levels stay intact.`
    );
    if (ok) bankAndClear();
  });

  document.getElementById("bankOnlyBtn").addEventListener("click", () => {
    bankAndClear();
  });

  document.getElementById("fullResetBtn").addEventListener("click", () => {
    const sure = confirm(
      "Reset All Progress?\n\nThis will wipe XP, streaks, notes, calories, hydration, weight log, and charts.\n\nUse this only if you want to start the entire saga from scratch."
    );
    if (!sure) return;
    state = structuredClone(defaultState);
    saveState();
    renderAll();
  });

  // Perplexity key
  document.getElementById("savePplxKeyBtn").addEventListener("click", () => {
    const val = document.getElementById("pplxKeyInput").value.trim();
    state.pplxApiKey = val;
    saveState();
    alert("Perplexity API key saved (localStorage, this browser only).");
  });

  document.getElementById("summonCoachBtn").addEventListener("click", summonCoach);

  // Settings: reminders
  const notifyEnabled = document.getElementById("notifyEnabled");
  const remHydration = document.getElementById("remHydration");
  const remTraining = document.getElementById("remTraining");
  const remSleep = document.getElementById("remSleep");

  notifyEnabled.checked = !!state.reminders.enabled;
  remHydration.value = state.reminders.hydrationTime;
  remTraining.value = state.reminders.trainingTime;
  remSleep.value = state.reminders.sleepTime;

  notifyEnabled.addEventListener("change", async () => {
    if (notifyEnabled.checked) {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          alert("Notifications not granted by browser. You may need to enable them in settings.");
          notifyEnabled.checked = false;
          state.reminders.enabled = false;
        } else {
          state.reminders.enabled = true;
        }
      } else {
        alert("Notifications API not supported in this browser.");
        notifyEnabled.checked = false;
        state.reminders.enabled = false;
      }
    } else {
      state.reminders.enabled = false;
    }
    saveState();
  });

  remHydration.addEventListener("change", () => {
    state.reminders.hydrationTime = remHydration.value || "11:00";
    saveState();
  });
  remTraining.addEventListener("change", () => {
    state.reminders.trainingTime = remTraining.value || "18:30";
    saveState();
  });
  remSleep.addEventListener("change", () => {
    state.reminders.sleepTime = remSleep.value || "23:00";
    saveState();
  });

  // Settings: custom quests
  const addBtn = document.getElementById("addCustomQuestBtn");
  const titleInput = document.getElementById("customQuestTitle");
  const xpInput = document.getElementById("customQuestXp");
  const whenInput = document.getElementById("customQuestWhen");
  const info = document.getElementById("customQuestInfo");

  addBtn.addEventListener("click", () => {
    const t = titleInput.value.trim();
    const xp = parseInt(xpInput.value, 10);
    const when = whenInput.value.trim() || "Anytime";
    if (!t || !Number.isFinite(xp) || xp <= 0) {
      info.textContent = "Please provide a name and a positive XP value.";
      return;
    }
    const id = "custom_" + Date.now();
    state.customQuests.push({
      id,
      title: t,
      subtitle: "Custom habit",
      xp,
      timeHint: when
    });
    titleInput.value = "";
    xpInput.value = "";
    whenInput.value = "";
    info.textContent = "Custom quest added. It appears under Training → Custom.";
    saveState();
    renderAll();
  });

  // export data
  document.getElementById("exportDataBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summit_saga_backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

function bankAndClear() {
  const { dayXp } = computeCoreStats();
  if (dayXp <= 0) {
    alert("No XP earned today to bank. Clear at least one quest first.");
    return;
  }
  const { iso } = todayInfo();

  const last = state.lastActiveDate;
  let newStreak = state.currentStreak;
  if (!last) {
    newStreak = 1;
  } else {
    const lastDate = new Date(last);
    const todayDate = new Date(iso + "T00:00:00");
    const diff = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      // already counted today
    } else if (diff === 1) {
      newStreak = state.currentStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  state.currentStreak = newStreak;
  state.bestStreak = Math.max(state.bestStreak, newStreak);
  state.lastActiveDate = iso;

  state.baseXp += dayXp;
  appendDailyHistory(dayXp);
  state.questChecks = {};
  saveState();
  renderAll();
}

// ---------- REMINDERS ----------

function startReminderLoop() {
  setInterval(() => {
    if (!state.reminders.enabled) return;
    const { hydrationTime, trainingTime, sleepTime, lastFiredDates } = state.reminders;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const current = `${hh}:${mm}`;
    const { iso } = todayInfo();

    const checks = [
      { key: "hydration", time: hydrationTime, title: "Hydration Ping", body: "Time for water. Refill your bottle." },
      { key: "training", time: trainingTime, title: "Training Block", body: "Move into your main training block now." },
      { key: "sleep", time: sleepTime, title: "Sleep Wind‑Down", body: "Screen cut‑off and wind‑down routine." }
    ];

    checks.forEach((c) => {
      if (!c.time) return;
      if (current === c.time) {
        const firedKey = `${c.key}_${iso}`;
        if (!lastFiredDates[firedKey]) {
          fireNotification(c.title, c.body);
          lastFiredDates[firedKey] = true;
          saveState();
        }
      }
    });
  }, 60000);
}

function fireNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  } else {
    alert(`${title}\n\n${body}`);
  }
}

// ---------- PERPLEXITY COACH ----------

async function summonCoach() {
  const btn = document.getElementById("summonCoachBtn");
  const output = document.getElementById("coachOutput");
  const apiKey = state.pplxApiKey.trim();
  if (!apiKey) {
    alert("Please paste your Perplexity API key first.");
    return;
  }

  const bmi = calcBmi().toFixed(1);
  const stats = computeCoreStats();
  const totalCalories = todayCaloriesTotal();
  const target = Number(state.calories.target) || 0;
  const deltaKcal = target ? totalCalories - target : 0;
  const weightDelta = weightDeltaFromStart().toFixed(1);

  const prompt = [
    "You are a concise, tough-love mountain fitness coach.",
    "User: 31-year-old male, 171 cm, starting at 90 kg, training at home with no gym gear.",
    `Stats: Total XP ${stats.totalXp}, Level ${stats.level}, Day XP ${stats.dayXp}, Streak ${state.currentStreak} days.`,
    `Latest BMI ~${bmi}, Net weight change since start: ${weightDelta} kg.`,
    `Calories today: ${totalCalories || 0} kcal, Target: ${target || 0} kcal, Delta: ${deltaKcal} kcal.`,
    `Daily intention/notes: "${state.intention || "None"}".`,
    "",
    "Goals: Reduce fat, lean glutes, stronger arms/upper-back for climbing, visible abs.",
    "Constraints: Home workouts only; bodyweight and simple objects.",
    "",
    "Task: In 4–6 short bullet points, give a tailored recommendation for TODAY.",
    "Include:",
    "- One strength focus tip (split squats, lunges, pushups, rows, core).",
    "- One cardio or rucking/stairs/step-count tip.",
    "- One nutrition/kitchen discipline tip using the calorie context.",
    "- One habit for the wake→sleep routine (alarm, hydration, walks, screen cut-off, sleep).",
    "- One mindset cue.",
    "",
    "Keep it sharp and practical. Avoid long paragraphs."
  ].join("\n");

  btn.disabled = true;
  btn.textContent = "Summoning...";
  output.textContent = "Talking to Perplexity Coach...";

  try {
    // Perplexity Sonar Pro via OpenAI‑compatible Chat Completions API.[web:69][web:73][web:46]
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "Be precise and concise. Answer only in bullet points."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error("HTTP " + res.status + " – " + text);
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message?.content || "No content returned.";
    output.textContent = msg.trim();
  } catch (err) {
    console.error(err);
    output.textContent =
      "AI coach unavailable. Check network, CORS, or API key.\n\nError: " +
      err.message +
      "\n\nIf CORS blocks this in-browser request, you may need a tiny proxy server.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Summon Coach";
  }
}

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const btn = document.getElementById("installAppBtn");
  if (btn) btn.hidden = false;
});

const installBtn = document.getElementById("installAppBtn");
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    const res = await deferredInstallPrompt.prompt();
    console.log("Install result:", res.outcome);
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}

window.addEventListener("appinstalled", () => {
  const btn = document.getElementById("installAppBtn");
  if (btn) btn.hidden = true;
});

// Register service worker for PWA on GitHub Pages
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/fit-saga/sw.js")
      .catch((err) => console.error("SW registration failed:", err));
  });
}