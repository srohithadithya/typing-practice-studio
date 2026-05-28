const lessons = [
  {
    id: "home",
    title: "Home row: A S D F J K L ;",
    fragments: [
      "asdf jkl; asdf jkl; ask dad; all fall; salad flask; sad lad asks dad.",
      "fall salad; jaffa flask; ask all; add salsa; flask falls; dad asks all.",
      "a sad lad asks all; dad adds salad; fall as a flask falls; ask dad."
    ]
  },
  {
    id: "top",
    title: "Top row: Q W E R T Y U I O P",
    fragments: [
      "quiet writers type pretty poetry; your power grows with every top row repeat.",
      "we try quick output; pure witty poetry requires quiet focus and steady wrists.",
      "type your route; query output; write pretty power words with quiet rhythm."
    ]
  },
  {
    id: "bottom",
    title: "Bottom row: Z X C V B N M",
    fragments: [
      "mix basic vocab; calm minds move boxes; brave names become clean notes.",
      "zoom back; examine complex moves; vivid music can make exact practice better.",
      "many boxes move; calm voices can become maximum balance with exact motion."
    ]
  },
  {
    id: "speed",
    title: "Speed builder",
    fragments: [
      "Fast typing begins with clean contact. Keep your shoulders loose and your eyes ahead.",
      "Let accuracy lead speed. A smooth line of correct words beats a rushed line of repairs.",
      "The best practice sessions feel steady, alert, and repeatable from the first word to the last."
    ]
  },
  {
    id: "code",
    title: "Symbols and code",
    fragments: [
      "const speed = words / minutes; if (accuracy > 95) { nextLesson(); }",
      "function score(input) { return input.correct / Math.max(input.total, 1); }",
      "for (const key of focusKeys) { practice.repeat(key); report.save(); }"
    ]
  }
];

const practiceCorpus = [
  "A focused session starts with a calm breath and a clear target. The goal is not to attack the keyboard, but to let the correct key become obvious before the finger moves.",
  "Speed grows when accuracy is protected. Every clean sentence teaches your hands a tiny map of distance, timing, and return paths across the QWERTY layout.",
  "Good typists keep their eyes on the text, not on the keys. The keyboard becomes familiar through repetition, patient correction, and a rhythm that does not collapse after one mistake.",
  "When the timer is longer, the practice text should stretch with it. Longer passages test consistency, attention, and recovery, not only the first burst of speed.",
  "Professional typing depends on reliable habits. Sit comfortably, keep both thumbs ready for space, and allow the home row to become the resting place after each reach.",
  "Errors are useful signals. A repeated mistake on one letter means that letter deserves a smaller drill, slower repetitions, and then a return to the full passage.",
  "The cleanest practice is measured after every session. WPM, raw WPM, accuracy, errors, duration, and weak keys together show what to train next.",
  "Typing practice becomes personal when records are saved. A history of sessions can reveal whether speed is improving, accuracy is stable, and difficult keys are changing over time.",
  "Direct practice should never feel stale. A changing text keeps the mind engaged and prevents memorization from pretending to be skill.",
  "The strongest session ends with a short review. Notice the best score, the average pace, the weakest keys, and one simple lesson to repeat tomorrow."
];

const keyboardRows = {
  qwerty: "qwertyuiop",
  home: "asdfghjkl;",
  bottom: "zxcvbnm,./"
};

const profileStorageKey = "qwertyTypingProfiles:v2";
const recordStorageKey = "qwertyTypingRecords:v2";
const activeSessionKey = "qwertyTypingActiveProfile:v2";

let state = {
  profile: null,
  mode: "lesson",
  prompt: "",
  promptSeed: 1,
  started: false,
  startedAt: null,
  timerId: null,
  remaining: 60,
  typed: "",
  records: [],
  keyIntervals: {},
  lastKeyAt: null,
  finalMetrics: null
};

const els = {
  authOverlay: document.querySelector("#authOverlay"),
  authForm: document.querySelector("#authForm"),
  authName: document.querySelector("#authName"),
  authPin: document.querySelector("#authPin"),
  authMessage: document.querySelector("#authMessage"),
  profileName: document.querySelector("#profileName"),
  logoutButton: document.querySelector("#logoutButton"),
  lessonSelect: document.querySelector("#lessonSelect"),
  durationSelect: document.querySelector("#durationSelect"),
  customText: document.querySelector("#customText"),
  customField: document.querySelector(".custom-field"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
  promptText: document.querySelector("#promptText"),
  typingInput: document.querySelector("#typingInput"),
  startButton: document.querySelector("#startButton"),
  newTextButton: document.querySelector("#newTextButton"),
  resetButton: document.querySelector("#resetButton"),
  exportButton: document.querySelector("#exportButton"),
  markdownReportButton: document.querySelector("#markdownReportButton"),
  wordReportButton: document.querySelector("#wordReportButton"),
  clearButton: document.querySelector("#clearButton"),
  wpmNow: document.querySelector("#wpmNow"),
  rawWpmNow: document.querySelector("#rawWpmNow"),
  accuracyNow: document.querySelector("#accuracyNow"),
  timerNow: document.querySelector("#timerNow"),
  errorsNow: document.querySelector("#errorsNow"),
  progressBar: document.querySelector("#progressBar"),
  bestWpm: document.querySelector("#bestWpm"),
  averageWpm: document.querySelector("#averageWpm"),
  averageAccuracy: document.querySelector("#averageAccuracy"),
  totalSessions: document.querySelector("#totalSessions"),
  totalMinutes: document.querySelector("#totalMinutes"),
  focusKeys: document.querySelector("#focusKeys"),
  recordList: document.querySelector("#recordList")
};

async function init() {
  document.body.classList.add("locked");
  buildLessonOptions();
  buildKeyboard();
  bindEvents();

  const activeId = sessionStorage.getItem(activeSessionKey);
  const profile = loadProfiles().find((item) => item.id === activeId);
  if (profile) {
    unlockProfile(profile);
  } else {
    lockApp();
  }
}

function bindEvents() {
  els.authForm.addEventListener("submit", handleAuth);
  els.logoutButton.addEventListener("click", lockApp);

  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      els.modeButtons.forEach((item) => item.classList.toggle("active", item === button));
      els.customField.hidden = state.mode !== "custom";
      resetSession(true);
    });
  });

  els.lessonSelect.addEventListener("change", () => resetSession(true));
  els.durationSelect.addEventListener("change", () => resetSession(true));
  els.customText.addEventListener("input", () => {
    if (state.mode === "custom") resetSession(true);
  });
  els.startButton.addEventListener("click", () => startSession());
  els.newTextButton.addEventListener("click", () => resetSession(true));
  els.resetButton.addEventListener("click", () => resetSession(false));
  els.exportButton.addEventListener("click", exportRecordsJson);
  els.markdownReportButton.addEventListener("click", exportMarkdownReport);
  els.wordReportButton.addEventListener("click", exportWordReport);
  els.clearButton.addEventListener("click", clearRecords);
  els.typingInput.addEventListener("input", handleTyping);
  els.typingInput.addEventListener("keydown", captureKeyTiming);
  window.addEventListener("keydown", highlightPhysicalKey);
}

async function handleAuth(event) {
  event.preventDefault();
  const name = els.authName.value.trim();
  const pin = els.authPin.value.trim();
  if (!name || pin.length < 4) {
    showAuthMessage("Use a profile name and a PIN with at least 4 digits.", true);
    return;
  }

  const profiles = loadProfiles();
  const id = slugify(name);
  const existing = profiles.find((profile) => profile.id === id);
  const pinHash = await hashText(`${id}:${pin}`);

  if (existing && existing.pinHash !== pinHash) {
    showAuthMessage("Wrong PIN for this profile.", true);
    return;
  }

  const profile = existing || {
    id,
    name,
    pinHash,
    createdAt: new Date().toISOString()
  };

  if (!existing) {
    profiles.push(profile);
    saveProfiles(profiles);
  }

  sessionStorage.setItem(activeSessionKey, profile.id);
  unlockProfile(profile);
}

function unlockProfile(profile) {
  state.profile = profile;
  state.records = loadRecordsForProfile(profile.id);
  els.profileName.textContent = profile.name;
  els.authOverlay.hidden = true;
  document.body.classList.remove("locked");
  resetSession(true);
  renderRecords();
}

function lockApp() {
  clearInterval(state.timerId);
  sessionStorage.removeItem(activeSessionKey);
  state.profile = null;
  state.started = false;
  els.authPin.value = "";
  els.authOverlay.hidden = false;
  document.body.classList.add("locked");
  setTimeout(() => els.authName.focus(), 0);
}

function showAuthMessage(message, isError = false) {
  els.authMessage.textContent = message;
  els.authMessage.classList.toggle("error", isError);
}

function buildLessonOptions() {
  els.lessonSelect.innerHTML = lessons.map((lesson) => `<option value="${lesson.id}">${lesson.title}</option>`).join("");
}

function buildKeyboard() {
  Object.entries(keyboardRows).forEach(([row, chars]) => {
    const target = document.querySelector(`[data-row="${row}"]`);
    target.innerHTML = [...chars].map((char) => `<kbd class="key" data-key="${char}">${char}</kbd>`).join("");
  });
}

function startSession(initialText = "") {
  if (!state.profile) {
    lockApp();
    return;
  }
  if (!initialText) {
    choosePrompt(true);
  } else if (!state.prompt) {
    choosePrompt(true);
  }
  state.started = true;
  state.startedAt = performance.now();
  state.remaining = Number(els.durationSelect.value);
  state.typed = initialText;
  state.keyIntervals = {};
  state.lastKeyAt = null;
  state.finalMetrics = null;
  els.typingInput.value = initialText;
  els.typingInput.disabled = false;
  els.typingInput.focus();
  els.startButton.textContent = "Restart";
  renderPrompt();
  renderStats();
  clearInterval(state.timerId);
  state.timerId = setInterval(tick, 250);
}

function resetSession(forceNewText) {
  clearInterval(state.timerId);
  if (forceNewText) state.promptSeed = Date.now() + Math.floor(Math.random() * 100000);
  choosePrompt(forceNewText);
  state.started = false;
  state.startedAt = null;
  state.typed = "";
  state.remaining = Number(els.durationSelect.value);
  state.keyIntervals = {};
  state.lastKeyAt = null;
  state.finalMetrics = null;
  els.typingInput.value = "";
  els.typingInput.disabled = false;
  els.startButton.textContent = "Start";
  renderPrompt();
  renderStats();
}

function choosePrompt(forceNewText = false) {
  if (forceNewText || !state.prompt) {
    state.promptSeed += 1;
  }
  const duration = Number(els.durationSelect.value);
  const targetChars = Math.max(500, Math.ceil(duration * 13));

  if (state.mode === "custom") {
    const custom = els.customText.value.trim() || "Add your custom practice text above, then type it with a steady rhythm.";
    state.prompt = expandText([custom], targetChars, state.promptSeed);
    return;
  }

  if (state.mode === "lesson") {
    const lesson = lessons.find((item) => item.id === els.lessonSelect.value) || lessons[0];
    state.prompt = expandText(lesson.fragments, targetChars, state.promptSeed);
    return;
  }

  state.prompt = expandText(practiceCorpus, targetChars, state.promptSeed);
}

function expandText(parts, targetChars, seed) {
  const random = seededRandom(seed);
  const pool = [...parts];
  let output = "";
  while (output.length < targetChars) {
    const index = Math.floor(random() * pool.length);
    output += `${pool[index]} `;
    if (random() > 0.64) output += `${pool[Math.floor(random() * pool.length)]} `;
  }
  return output.trim();
}

function tick() {
  if (!state.startedAt) return;
  const elapsed = elapsedSeconds();
  state.remaining = Math.max(Number(els.durationSelect.value) - elapsed, 0);
  if (state.remaining <= 0) {
    finishSession("time");
    return;
  }
  renderStats();
}

function handleTyping() {
  if (!state.started) {
    startSession(els.typingInput.value);
  }
  state.typed = els.typingInput.value;
  if (state.typed.length >= state.prompt.length) {
    finishSession("complete");
    return;
  }
  renderPrompt();
  renderStats();
}

function captureKeyTiming(event) {
  if (!state.started || event.key.length !== 1) return;
  const now = performance.now();
  const expected = state.prompt[state.typed.length] || "extra";
  if (state.lastKeyAt) {
    const interval = now - state.lastKeyAt;
    const key = expected === " " ? "space" : expected.toLowerCase();
    if (!state.keyIntervals[key]) state.keyIntervals[key] = [];
    state.keyIntervals[key].push(interval);
  }
  state.lastKeyAt = now;
}

function finishSession(reason) {
  if (!state.started && state.finalMetrics) return;
  clearInterval(state.timerId);
  const finalDuration = elapsedSeconds();
  const metrics = calculateMetrics(finalDuration);
  state.started = false;
  state.startedAt = null;
  state.finalMetrics = metrics;
  els.typingInput.disabled = true;
  els.startButton.textContent = "Start again";

  const record = {
    id: createId(),
    profileId: state.profile.id,
    name: state.profile.name,
    mode: state.mode,
    lesson: getSessionLabel(),
    reason,
    createdAt: new Date().toISOString(),
    duration: finalDuration,
    targetChars: state.prompt.length,
    typedChars: state.typed.length,
    sample: state.prompt.slice(0, 220),
    ...metrics
  };

  state.records.unshift(record);
  state.records = state.records.slice(0, 300);
  saveRecordsForProfile(state.profile.id, state.records);
  renderPrompt();
  renderStats();
  renderRecords();
}

function calculateMetrics(fixedDuration) {
  const typed = state.typed;
  let correct = 0;
  let errors = 0;
  const mistakes = {};

  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === state.prompt[index]) {
      correct += 1;
    } else {
      errors += 1;
      const expected = state.prompt[index] || "extra";
      const key = expected === " " ? "space" : expected.toLowerCase();
      mistakes[key] = (mistakes[key] || 0) + 1;
    }
  }

  const duration = fixedDuration || elapsedSeconds();
  const minutes = Math.max(duration / 60, 1 / 60);
  const wpm = Math.round(correct / 5 / minutes);
  const rawWpm = Math.round(typed.length / 5 / minutes);
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
  const progress = state.prompt.length ? Math.min(100, Math.round((typed.length / state.prompt.length) * 100)) : 0;
  const slowKeys = findSlowKeys();

  return { wpm, rawWpm, accuracy, errors, correct, mistakes, progress, slowKeys };
}

function findSlowKeys() {
  return Object.entries(state.keyIntervals)
    .map(([key, values]) => ({
      key,
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      samples: values.length
    }))
    .filter((item) => item.samples >= 2)
    .sort((a, b) => b.average - a.average)
    .slice(0, 5)
    .map((item) => item.key);
}

function elapsedSeconds() {
  if (!state.startedAt) return Math.max(Number(els.durationSelect.value) - state.remaining, 1);
  return Math.max((performance.now() - state.startedAt) / 1000, 1);
}

function renderPrompt() {
  const typed = state.typed;
  const current = typed.length;
  const windowSize = 1200;
  const start = Math.max(0, current - 250);
  const end = Math.min(state.prompt.length, start + windowSize);
  const prefix = start > 0 ? `<span class="context-note">... </span>` : "";
  const suffix = end < state.prompt.length ? `<span class="context-note"> ...</span>` : "";

  let html = "";
  for (let index = start; index < end; index += 1) {
    const char = state.prompt[index];
    let className = "";
    if (index < typed.length) className = typed[index] === char ? "done" : "wrong";
    if (index === typed.length) className = `${className} current`.trim();
    html += `<span class="${className}">${escapeHtml(char)}</span>`;
  }
  els.promptText.innerHTML = prefix + html + suffix;
}

function renderStats() {
  const metrics = state.finalMetrics || calculateMetrics();
  els.wpmNow.textContent = metrics.wpm;
  els.rawWpmNow.textContent = metrics.rawWpm;
  els.accuracyNow.textContent = `${metrics.accuracy}%`;
  els.timerNow.textContent = Math.max(0, Math.ceil(state.remaining));
  els.errorsNow.textContent = metrics.errors;
  els.progressBar.style.width = `${metrics.progress}%`;
}

function renderRecords() {
  const records = state.records;
  if (!records.length) {
    els.recordList.innerHTML = "";
    els.bestWpm.textContent = "0";
    els.averageWpm.textContent = "0";
    els.averageAccuracy.textContent = "0%";
    els.totalSessions.textContent = "0";
    els.totalMinutes.textContent = "0";
    els.focusKeys.textContent = "Complete a session to discover slow or error-prone keys.";
    markProblemKeys([]);
    return;
  }

  const best = Math.max(...records.map((record) => record.wpm));
  const avgWpm = Math.round(records.reduce((sum, record) => sum + record.wpm, 0) / records.length);
  const avgAccuracy = Math.round(records.reduce((sum, record) => sum + record.accuracy, 0) / records.length);
  const minutes = Math.round(records.reduce((sum, record) => sum + record.duration, 0) / 60);
  const focus = findFocusKeys(records);

  els.bestWpm.textContent = best;
  els.averageWpm.textContent = avgWpm;
  els.averageAccuracy.textContent = `${avgAccuracy}%`;
  els.totalSessions.textContent = records.length;
  els.totalMinutes.textContent = minutes;
  els.focusKeys.textContent = focus.length ? `Practice these next: ${focus.join(", ")}` : "No repeated weak keys yet. Keep building speed.";
  markProblemKeys(focus);

  els.recordList.innerHTML = records.slice(0, 40).map((record) => `
    <li class="record-card">
      <strong>${escapeHtml(record.name)} - ${record.wpm} WPM - ${record.accuracy}%</strong>
      <div class="record-meta">
        <span>${new Date(record.createdAt).toLocaleString()}</span>
        <span>${escapeHtml(record.lesson)}</span>
        <span>${record.rawWpm || record.wpm} raw WPM</span>
        <span>${record.errors} errors</span>
        <span>${Math.round(record.duration)} sec</span>
        <span>${record.progress || 0}% complete</span>
      </div>
    </li>
  `).join("");
}

function findFocusKeys(records) {
  const totals = {};
  records.forEach((record) => {
    Object.entries(record.mistakes || {}).forEach(([key, count]) => {
      if (key.length <= 5) totals[key] = (totals[key] || 0) + count;
    });
    (record.slowKeys || []).forEach((key) => {
      totals[key] = (totals[key] || 0) + 1;
    });
  });
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key]) => key);
}

function markProblemKeys(keys) {
  document.querySelectorAll(".key").forEach((key) => {
    const keyName = key.dataset.key === " " ? "space" : key.dataset.key;
    key.classList.toggle("problem", keys.includes(keyName));
  });
}

function highlightPhysicalKey(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key === " " ? " " : "";
  if (!key) return;
  const target = document.querySelector(`.key[data-key="${cssEscape(key)}"]`);
  if (!target) return;
  target.classList.add("active");
  setTimeout(() => target.classList.remove("active"), 110);
}

function exportRecordsJson() {
  downloadFile("typing-practice-records.json", JSON.stringify(state.records, null, 2), "application/json");
}

function exportMarkdownReport() {
  downloadFile("typing-practice-report.md", buildMarkdownReport(), "text/markdown");
}

function exportWordReport() {
  const html = buildWordHtmlReport();
  downloadFile("typing-practice-report.doc", html, "application/msword");
}

function buildMarkdownReport() {
  const records = state.records;
  const focus = findFocusKeys(records);
  const best = records.length ? Math.max(...records.map((record) => record.wpm)) : 0;
  const avgWpm = records.length ? Math.round(records.reduce((sum, record) => sum + record.wpm, 0) / records.length) : 0;
  const avgAccuracy = records.length ? Math.round(records.reduce((sum, record) => sum + record.accuracy, 0) / records.length) : 0;
  const rows = records.map((record) => `| ${formatDate(record.createdAt)} | ${record.lesson} | ${record.wpm} | ${record.rawWpm || record.wpm} | ${record.accuracy}% | ${record.errors} | ${Math.round(record.duration)}s |`).join("\n");

  return [
    `# Typing Practice Report - ${state.profile?.name || "Profile"}`,
    "",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "## Summary",
    "",
    `- Best WPM: ${best}`,
    `- Average WPM: ${avgWpm}`,
    `- Average accuracy: ${avgAccuracy}%`,
    `- Total sessions: ${records.length}`,
    `- Focus keys: ${focus.length ? focus.join(", ") : "None yet"}`,
    "",
    "## Session Records",
    "",
    "| Date | Session | WPM | Raw WPM | Accuracy | Errors | Duration |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    rows || "| No sessions yet | - | 0 | 0 | 0% | 0 | 0s |",
    ""
  ].join("\n");
}

function buildWordHtmlReport() {
  const records = state.records;
  const focus = findFocusKeys(records);
  const best = records.length ? Math.max(...records.map((record) => record.wpm)) : 0;
  const avgWpm = records.length ? Math.round(records.reduce((sum, record) => sum + record.wpm, 0) / records.length) : 0;
  const avgAccuracy = records.length ? Math.round(records.reduce((sum, record) => sum + record.accuracy, 0) / records.length) : 0;
  const rows = records.map((record) => `
    <tr>
      <td>${escapeHtml(formatDate(record.createdAt))}</td>
      <td>${escapeHtml(record.lesson)}</td>
      <td>${record.wpm}</td>
      <td>${record.rawWpm || record.wpm}</td>
      <td>${record.accuracy}%</td>
      <td>${record.errors}</td>
      <td>${Math.round(record.duration)}s</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Typing Practice Report</title>
    <style>
      body { font-family: Arial, sans-serif; color: #202426; }
      h1, h2 { color: #16795b; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d8dedb; padding: 7px; font-size: 10pt; text-align: left; }
      th { background: #e9eee9; }
      .summary { margin: 0 0 16px; padding: 0; }
      .summary li { margin: 4px 0; }
    </style>
  </head>
  <body>
    <h1>Typing Practice Report - ${escapeHtml(state.profile?.name || "Profile")}</h1>
    <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
    <h2>Summary</h2>
    <ul class="summary">
      <li>Best WPM: ${best}</li>
      <li>Average WPM: ${avgWpm}</li>
      <li>Average accuracy: ${avgAccuracy}%</li>
      <li>Total sessions: ${records.length}</li>
      <li>Focus keys: ${escapeHtml(focus.length ? focus.join(", ") : "None yet")}</li>
    </ul>
    <h2>Session Records</h2>
    <table>
      <thead>
        <tr><th>Date</th><th>Session</th><th>WPM</th><th>Raw WPM</th><th>Accuracy</th><th>Errors</th><th>Duration</th></tr>
      </thead>
      <tbody>${rows || "<tr><td colspan=\"7\">No sessions yet</td></tr>"}</tbody>
    </table>
  </body>
</html>`;
}

function clearRecords() {
  if (!confirm("Clear all saved typing records for this profile?")) return;
  state.records = [];
  saveRecordsForProfile(state.profile.id, state.records);
  renderRecords();
}

function getSessionLabel() {
  if (state.mode === "lesson") return els.lessonSelect.options[els.lessonSelect.selectedIndex].text;
  if (state.mode === "custom") return "Custom practice";
  return "Dynamic direct practice";
}

function loadProfiles() {
  return readJson(profileStorageKey, []);
}

function saveProfiles(profiles) {
  localStorage.setItem(profileStorageKey, JSON.stringify(profiles));
}

function loadRecordsForProfile(profileId) {
  return readJson(recordStorageKey, []).filter((record) => record.profileId === profileId);
}

function saveRecordsForProfile(profileId, records) {
  const otherRecords = readJson(recordStorageKey, []).filter((record) => record.profileId !== profileId);
  localStorage.setItem(recordStorageKey, JSON.stringify([...records, ...otherRecords]));
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

async function hashText(value) {
  if (crypto.subtle) {
    const data = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return String(hash);
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profile";
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function cssEscape(value) {
  return value.replace(/["\\]/g, "\\$&");
}

init();
