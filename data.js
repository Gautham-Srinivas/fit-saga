// data.js

// User profile constants
const HEIGHT_CM = 171;
const START_WEIGHT_KG = 90;

// Local storage key for all app data
const STORAGE_KEY = "peakAscentStateRetroV1";

// Day mapping: matches JS Date.getDay() (0 = Sunday)
const Day = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 0
};

// Tutorial links for key movements
const TUTORIALS = {
  bulgarian_split_squats: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
  reverse_crunches: "https://www.puregym.com/exercises/abs/reverse-crunches/",
  hollow_body_hold: "https://www.youtube.com/results?search_query=hollow+body+hold+tutorial",
  plank_tap_outs: "https://www.youtube.com/results?search_query=plank+shoulder+tap+tutorial",
  standard_pushups: "https://www.youtube.com/results?search_query=standard+push+up+tutorial",
  diamond_pushups: "https://www.youtube.com/results?search_query=diamond+push+up+tutorial",
  table_inverted_rows: "https://www.youtube.com/results?search_query=inverted+row+at+home+tutorial",
  walking_lunges: "https://www.youtube.com/results?search_query=walking+lunges+tutorial",
  home_rucking_prep: "https://www.youtube.com/results?search_query=rucking+for+fat+loss",
  stair_stepping: "https://www.youtube.com/results?search_query=stair+climbing+workout+at+home"
};

// Core quest list – space-flavored labels, same underlying exercises
const allQuests = [
  // Strength (Mon/Wed/Fri)
  {
    id: "bulgarian_split_squats",
    title: "Thruster Split Squats",
    subtitle: "3 x 8–10 (engine room leg drive for steep ascents)",
    xp: 30,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Evening strength block",
    tutorialUrl: TUTORIALS.bulgarian_split_squats
  },
  {
    id: "walking_lunges",
    title: "Hull Walk Lunges",
    subtitle: "3 x 12–15 steps (quad & glute stamina)",
    xp: 25,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Evening strength block",
    tutorialUrl: TUTORIALS.walking_lunges
  },
  {
    id: "table_inverted_rows",
    title: "Gravity Inverted Rows",
    subtitle: "4 x 6–10 reps (climbing pull power & biceps)",
    xp: 35,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Evening strength block",
    tutorialUrl: TUTORIALS.table_inverted_rows
  },
  {
    id: "standard_pushups",
    title: "Standard / Incline Push‑Ups",
    subtitle: "3 x 8–12 reps (chest & upper‑body base)",
    xp: 25,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Evening strength block",
    tutorialUrl: TUTORIALS.standard_pushups
  },
  {
    id: "diamond_pushups",
    title: "Diamond Push‑Ups",
    subtitle: "3 x 6–10 reps (explosive triceps & arms)",
    xp: 30,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Evening strength block",
    tutorialUrl: TUTORIALS.diamond_pushups
  },
  {
    id: "reverse_crunches",
    title: "Reverse Crunches",
    subtitle: "3 circuits x 12–15 reps (lower abs focus)",
    xp: 20,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Core finisher",
    tutorialUrl: TUTORIALS.reverse_crunches
  },
  {
    id: "hollow_body_hold",
    title: "Hollow Body Hold",
    subtitle: "3 x 20–30 sec (deep core baseline strength)",
    xp: 20,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Core finisher",
    tutorialUrl: TUTORIALS.hollow_body_hold
  },
  {
    id: "plank_tap_outs",
    title: "Plank Tap‑Outs",
    subtitle: "3 x 20 taps (core stabilizing armor)",
    xp: 20,
    category: "STRENGTH",
    days: [Day.MON, Day.WED, Day.FRI],
    timeHint: "Core finisher",
    tutorialUrl: TUTORIALS.plank_tap_outs
  },

  // Cardio (Tue/Thu)
  {
    id: "home_rucking_prep",
    title: "Planetfall Ruck",
    subtitle: "45‑min loaded walk (3–5 kg backpack, surface trek sim)",
    xp: 40,
    category: "CARDIO",
    days: [Day.TUE, Day.THU],
    timeHint: "Late afternoon / evening",
    tutorialUrl: TUTORIALS.home_rucking_prep
  },
  {
    id: "stair_stepping",
    title: "Deck Stair Climb",
    subtitle: "15‑min constant stair climb (fat burner & calves)",
    xp: 30,
    category: "CARDIO",
    days: [Day.TUE, Day.THU],
    timeHint: "Optional cardio finisher",
    tutorialUrl: TUTORIALS.stair_stepping
  },

  // Recovery (Sat/Sun)
  {
    id: "mobility_flow",
    title: "Docking Bay Mobility",
    subtitle: "15‑min hips / ankles / thoracic mobility",
    xp: 20,
    category: "RECOVERY",
    days: [Day.SAT, Day.SUN],
    timeHint: "Morning or evening",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=15+minute+mobility+routine"
  },
  {
    id: "easy_walk",
    title: "Observation Deck Walk",
    subtitle: "20–30 min low‑intensity movement",
    xp: 20,
    category: "RECOVERY",
    days: [Day.SAT, Day.SUN],
    timeHint: "Whenever convenient",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=easy+walk+fat+loss"
  },

  // Lifestyle (all days)
  {
    id: "deep_work_block",
    title: "Deep Work Block",
    subtitle: "45‑min focused work, no distractions",
    xp: 15,
    category: "LIFESTYLE",
    days: Object.values(Day),
    timeHint: "AM or first work block",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=deep+work+cal+newport+summary"
  },
  {
    id: "mindful_breathing",
    title: "Airlock Breathing Reset",
    subtitle: "5‑min slow nasal breathing reset",
    xp: 10,
    category: "LIFESTYLE",
    days: Object.values(Day),
    timeHint: "Any time stress spikes",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=5+minute+box+breathing"
  },

  // Diet (all days)
  {
    id: "diet_protein_target",
    title: "Protein Summit",
    subtitle:
      "1.5–2 g/kg via eggs, chicken, fish, paneer, sprouts (crew fueling)",
    xp: 10,
    category: "DIET",
    days: Object.values(Day),
    timeHint: "Across the day",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=high+protein+indian+meals"
  },
  {
    id: "diet_zero_liquid_calories",
    title: "Zero‑Liquid Calories",
    subtitle: "No sodas, sweet juices, or sugary coffee/tea",
    xp: 10,
    category: "DIET",
    days: Object.values(Day),
    timeHint: "All day",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=liquid+calories+fat+loss"
  },
  {
    id: "diet_hydration",
    title: "Hydration Check",
    subtitle: "3–4 L of clean water",
    xp: 10,
    category: "DIET",
    days: Object.values(Day),
    timeHint: "All day",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=benefits+of+drinking+water"
  },
  {
    id: "diet_calorie_deficit",
    title: "Calorie Deficit Guard",
    subtitle: "Meals stayed lean and portions controlled",
    xp: 10,
    category: "DIET",
    days: Object.values(Day),
    timeHint: "All day",
    tutorialUrl:
      "https://www.youtube.com/results?search_query=calorie+deficit+explained"
  },

  // Daily routine timeline (all days)
  {
    id: "routine_wakeup",
    title: "Launch Sequence",
    subtitle: "Out of bed within 10 minutes of alarm",
    xp: 15,
    category: "ROUTINE",
    days: Object.values(Day),
    timeHint: "Wake‑up window"
  },
  {
    id: "routine_morning_water",
    title: "Morning Hydration",
    subtitle: "500–750 ml water before tea/coffee",
    xp: 10,
    category: "ROUTINE",
    days: Object.values(Day),
    timeHint: "First 30 min after wake"
  },
  {
    id: "routine_morning_walk",
    title: "Spawn Walk",
    subtitle: "5–10 min easy movement",
    xp: 10,
    category: "ROUTINE",
    days: Object.values(Day),
    timeHint: "Morning"
  },
  {
    id: "routine_post_work_walk",
    title: "Cooldown Walk",
    subtitle: "10–15 min walk after work to decompress",
    xp: 15,
    category: "ROUTINE",
    days: Object.values(Day),
    timeHint: "Post‑work"
  },
  {
    id: "routine_screen_cutoff",
    title: "Screen Cut‑Off",
    subtitle: "No screens for 30 min before sleep",
    xp: 10,
    category: "ROUTINE",
    days: Object.values(Day),
    timeHint: "Pre‑sleep"
  },
  {
    id: "routine_sleep_on_time",
    title: "Enter Cryosleep",
    subtitle: "In bunk at your target time",
    xp: 20,
    category: "ROUTINE",
    days: Object.values(Day),
    timeHint: "Night"
  }
];

// Initial state for the whole app
const defaultState = {
  baseXp: 0,
  questChecks: {}, // id -> bool
  cupsDrunk: 0,
  intention: "",
  energyLevel: 3,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: "",
  pplxApiKey: "",
  calories: {
    target: 2200,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snacks: 0
  },
  weightLog: [],        // [{date, kg}]
  dailyHistory: [],     // [{date, xp, calories, weight}]
  customQuests: [],     // [{id, title, subtitle, xp, timeHint}]
  reminders: {
    enabled: false,
    hydrationTime: "11:00",
    trainingTime: "18:30",
    sleepTime: "23:00",
    lastFiredDates: {}  // key+date -> true
  }
};