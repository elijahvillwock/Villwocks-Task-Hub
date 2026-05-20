const storageKey = "villwocks-task-hub-v2";
const googleClientId = "698846816729-o0bnpm4atdc65310q4fteh0n946adr7f.apps.googleusercontent.com";
const systemAdminEmail = "elijahvillwock@villwocksoutdoorliving.com";

const seedUsers = [
  {
    id: "admin-elijah",
    name: "Elijah Villwock",
    email: systemAdminEmail,
    role: "system_admin",
    status: "Available",
    lastActive: new Date().toISOString()
  },
  {
    id: "admin-mike",
    name: "Mike Villwock",
    email: "mike@villwocksoutdoorliving.com",
    role: "admin",
    status: "Available",
    lastActive: new Date().toISOString()
  },
  {
    id: "ops-mike",
    name: "Michael Ott",
    email: "operations@villwocksoutdoorliving.com",
    role: "manager",
    status: "In the field",
    lastActive: addHoursISO(-2)
  },
  {
    id: "retail-natalie",
    name: "Natalie Seibenmark",
    email: "retail@villwocksoutdoorliving.com",
    role: "manager",
    status: "Retail floor",
    lastActive: addHoursISO(-1)
  },
  {
    id: "team-jody",
    name: "Jody Villwock",
    email: "jody@villwocksoutdoorliving.com",
    role: "team",
    status: "Office",
    lastActive: addHoursISO(-4)
  }
];

const sampleTasks = [
  {
    id: crypto.randomUUID(),
    type: "task",
    title: "Send Q2 launch risks to Ana",
    notes: "Pulled from the weekly planning transcript. Include staffing, enablement, and open legal review.",
    dueDate: todayISO(),
    dueTime: "15:30",
    priority: "high",
    priorityReason: "Auto: due today and contains launch risk language",
    ownerId: "ops-mike",
    source: "Meeting",
    status: "active",
    createdAt: new Date().toISOString(),
    remindedAt: null
  },
  {
    id: crypto.randomUUID(),
    type: "task",
    title: "Review vendor renewal spreadsheet",
    notes: "Check owner, renewal date, and contract value before Friday.",
    dueDate: addDaysISO(3),
    dueTime: "10:00",
    priority: "medium",
    priorityReason: "Auto: dated follow-up work",
    ownerId: "retail-natalie",
    source: "Drive",
    status: "active",
    createdAt: new Date().toISOString(),
    remindedAt: null
  },
  {
    id: crypto.randomUUID(),
    type: "task",
    title: "Draft follow-up email for client onboarding",
    notes: "Summarize decisions, blockers, and next call agenda.",
    dueDate: addDaysISO(1),
    dueTime: "09:00",
    priority: "medium",
    priorityReason: "Auto: upcoming client follow-up",
    ownerId: "admin-elijah",
    source: "Gmail",
    status: "active",
    createdAt: new Date().toISOString(),
    remindedAt: null
  }
];

let state = loadState();
let activeFilter = "active";
let selectedId = state.selectedId || state.items.find((item) => item.type === "task")?.id || null;
let calendarDate = new Date();
let ownerFilterId = "all";

const elements = {
  loginView: document.querySelector("#loginView"),
  appShell: document.querySelector("#appShell"),
  googleSignInSlot: document.querySelector("#googleSignInSlot"),
  todayLabel: document.querySelector("#todayLabel"),
  signedUser: document.querySelector("#signedUser"),
  signOutBtn: document.querySelector("#signOutBtn"),
  captureText: document.querySelector("#captureText"),
  extractBtn: document.querySelector("#extractBtn"),
  saveNoteBtn: document.querySelector("#saveNoteBtn"),
  taskTitle: document.querySelector("#taskTitle"),
  taskDueDate: document.querySelector("#taskDueDate"),
  taskDueTime: document.querySelector("#taskDueTime"),
  taskPriority: document.querySelector("#taskPriority"),
  taskSource: document.querySelector("#taskSource"),
  taskOwner: document.querySelector("#taskOwner"),
  ownerFilter: document.querySelector("#ownerFilter"),
  addTaskBtn: document.querySelector("#addTaskBtn"),
  openCalendarBtn: document.querySelector("#openCalendarBtn"),
  searchInput: document.querySelector("#searchInput"),
  taskList: document.querySelector("#taskList"),
  taskTemplate: document.querySelector("#taskTemplate"),
  tabs: document.querySelectorAll(".tab"),
  detailPanel: document.querySelector("#detailPanel"),
  notificationToggle: document.querySelector("#notificationToggle"),
  darkModeToggle: document.querySelector("#darkModeToggle"),
  reminderStack: document.querySelector("#reminderStack"),
  workspaceStatus: document.querySelector("#workspaceStatus"),
  connectGoogleBtn: document.querySelector("#connectGoogleBtn"),
  calendarBtn: document.querySelector("#calendarBtn"),
  mailBtn: document.querySelector("#mailBtn"),
  docBtn: document.querySelector("#docBtn"),
  driveBtn: document.querySelector("#driveBtn"),
  inviteEmail: document.querySelector("#inviteEmail"),
  inviteRole: document.querySelector("#inviteRole"),
  inviteBtn: document.querySelector("#inviteBtn"),
  adminMetrics: document.querySelector("#adminMetrics"),
  phoneLinks: document.querySelector("#phoneLinks"),
  statToday: document.querySelector("#statToday"),
  statUpcoming: document.querySelector("#statUpcoming"),
  statOverdue: document.querySelector("#statOverdue"),
  statInbox: document.querySelector("#statInbox")
};

normalizeState();
applyTheme();
renderAuth();
initializeGoogleSignIn();
renderPhoneLinks();
elements.todayLabel.textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric"
}).format(new Date());
elements.taskDueDate.value = todayISO();
elements.taskPriority.value = "auto";
elements.notificationToggle.checked = state.notifications;
elements.darkModeToggle.checked = state.theme === "dark";
updateWorkspaceLabel();
render();
setInterval(checkReminders, 30 * 1000);
checkReminders();

elements.extractBtn.addEventListener("click", () => {
  const text = elements.captureText.value.trim();
  if (!text) return;
  const tasks = extractTasks(text);
  if (tasks.length === 0) {
    saveNote(text);
    flashButton(elements.saveNoteBtn, "Saved as note");
    return;
  }
  state.items = [...tasks, ...state.items];
  saveNote(text, "Source transcript");
  elements.captureText.value = "";
  selectedId = tasks[0].id;
  persist();
  render();
  flashButton(elements.extractBtn, `${tasks.length} added`);
});

elements.saveNoteBtn.addEventListener("click", () => {
  const text = elements.captureText.value.trim();
  if (!text) return;
  saveNote(text);
  elements.captureText.value = "";
  persist();
  render();
  flashButton(elements.saveNoteBtn, "Saved");
});

elements.addTaskBtn.addEventListener("click", () => {
  const title = elements.taskTitle.value.trim();
  if (!title) {
    elements.taskTitle.focus();
    return;
  }
  const task = buildTask({
    title,
    notes: "",
    dueDate: elements.taskDueDate.value,
    dueTime: elements.taskDueTime.value,
    priority: elements.taskPriority.value,
    source: elements.taskSource.value,
    ownerId: canViewAll() ? elements.taskOwner.value : currentUser().id
  });
  state.items.unshift(task);
  selectedId = task.id;
  elements.taskTitle.value = "";
  elements.taskDueDate.value = todayISO();
  elements.taskDueTime.value = "";
  elements.taskPriority.value = "auto";
  persist();
  render();
});

elements.signOutBtn.addEventListener("click", () => {
  state.currentUserId = null;
  activeFilter = "active";
  persist();
  renderAuth();
});

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveFilter(tab.dataset.filter);
  });
});

elements.searchInput.addEventListener("input", render);

elements.ownerFilter.addEventListener("change", () => {
  ownerFilterId = elements.ownerFilter.value;
  render();
});

elements.openCalendarBtn.addEventListener("click", () => {
  setActiveFilter("calendar");
});

elements.notificationToggle.addEventListener("change", async () => {
  if (elements.notificationToggle.checked && "Notification" in window) {
    const permission = await Notification.requestPermission();
    state.notifications = permission === "granted";
    elements.notificationToggle.checked = state.notifications;
  } else {
    state.notifications = false;
  }
  persist();
});

elements.darkModeToggle.addEventListener("change", () => {
  state.theme = elements.darkModeToggle.checked ? "dark" : "light";
  applyTheme();
  persist();
});

elements.inviteBtn.addEventListener("click", () => {
  if (!canAdminUsers()) return;
  const email = elements.inviteEmail.value.trim().toLowerCase();
  if (!email) {
    elements.inviteEmail.focus();
    return;
  }
  const name = email.split("@")[0].split(/[._-]/).map(sentenceCase).join(" ");
  const user = {
    id: `user-${crypto.randomUUID()}`,
    name,
    email,
    role: elements.inviteRole.value,
    status: "Invited",
    lastActive: new Date().toISOString()
  };
  state.users.push(user);
  state.invites.push({ email, role: user.role, createdAt: new Date().toISOString() });
  elements.inviteEmail.value = "";
  persist();
  render();
});

elements.connectGoogleBtn.addEventListener("click", () => {
  state.googleConnected = !state.googleConnected;
  updateWorkspaceLabel();
  persist();
});

function setActiveFilter(filter) {
  activeFilter = filter;
  elements.tabs.forEach((item) => item.classList.toggle("active", item.dataset.filter === filter));
  render();
  if (filter === "calendar") {
    window.setTimeout(() => {
      document.querySelector(".calendar-view")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }
}

elements.calendarBtn.addEventListener("click", () => {
  const task = selectedTask();
  if (!task) return;
  const dates = calendarDates(task);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", task.title);
  url.searchParams.set("details", task.notes || "Created from Workday Task Hub.");
  url.searchParams.set("dates", dates);
  window.open(url.toString(), "_blank", "noopener");
});

elements.mailBtn.addEventListener("click", () => {
  const task = selectedTask();
  if (!task) return;
  const subject = `Follow-up: ${task.title}`;
  const body = [
    `Task: ${task.title}`,
    task.dueDate ? `Due: ${formatDateTime(task)}` : "",
    task.notes ? `Notes: ${task.notes}` : "",
    "",
    "Next steps:"
  ].filter(Boolean).join("\n");
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

elements.docBtn.addEventListener("click", () => {
  window.open("https://docs.new", "_blank", "noopener");
});

elements.driveBtn.addEventListener("click", () => {
  window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener");
});

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    return {
      items: sampleTasks,
      selectedId: sampleTasks[0].id,
      users: seedUsers,
      currentUserId: null,
      invites: [],
      notifications: false,
      googleConnected: false,
      theme: "light"
    };
  }
  try {
    return JSON.parse(saved);
  } catch {
    return {
      items: sampleTasks,
      selectedId: sampleTasks[0].id,
      users: seedUsers,
      currentUserId: null,
      invites: [],
      notifications: false,
      googleConnected: false,
      theme: "light"
    };
  }
}

function renderAuth() {
  const user = currentUser();
  elements.loginView.classList.toggle("is-hidden", Boolean(user));
  elements.appShell.classList.toggle("is-hidden", !user);
  document.querySelectorAll(".admin-only").forEach((node) => {
    node.classList.toggle("is-hidden", !canViewAll());
  });
  if (!user) return;
  elements.signedUser.innerHTML = `
    <strong>${escapeHTML(user.name)}</strong>
    <span>${escapeHTML(user.email)}</span>
    <span>${roleLabel(user.role)}</span>
  `;
  user.lastActive = new Date().toISOString();
}

function initializeGoogleSignIn(attempt = 0) {
  if (googleClientId.startsWith("ADD_YOUR")) {
    elements.googleSignInSlot.innerHTML = `<div class="connection-card"><span>Google OAuth Client ID needed for live sign-in</span></div>`;
    return;
  }
  if (!window.google?.accounts?.id) {
    if (attempt < 20) {
      window.setTimeout(() => initializeGoogleSignIn(attempt + 1), 250);
      return;
    }
    elements.googleSignInSlot.innerHTML = `<div class="connection-card"><span>Google sign-in could not load. Check browser privacy settings or OAuth origin setup.</span></div>`;
    return;
  }
  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: (response) => {
      const profile = decodeGoogleCredential(response.credential);
      if (!profile?.email) return;
      signInUser({
        name: profile.name || profile.email,
        email: profile.email,
        role: profile.email.endsWith("@villwocksoutdoorliving.com") ? "team" : "guest",
        status: "Available"
      });
    }
  });
  window.google.accounts.id.renderButton(elements.googleSignInSlot, {
    theme: "outline",
    size: "large",
    width: 320
  });
}

function decodeGoogleCredential(credential) {
  try {
    const payload = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function signInUser(profile) {
  const email = profile.email.toLowerCase();
  let user = state.users.find((entry) => entry.email.toLowerCase() === email);
  const fixedRole = email === systemAdminEmail ? "system_admin" : null;
  if (!user) {
    const invited = state.invites.find((invite) => invite.email.toLowerCase() === email);
    user = {
      id: profile.id || `user-${crypto.randomUUID()}`,
      name: profile.name,
      email,
      role: fixedRole || invited?.role || profile.role || "team",
      status: profile.status || "Available",
      lastActive: new Date().toISOString()
    };
    state.users.push(user);
  }
  if (fixedRole) {
    user.role = fixedRole;
  }
  state.currentUserId = user.id;
  state.googleConnected = true;
  activeFilter = "active";
  persist();
  render();
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function canViewAll() {
  return ["system_admin", "admin", "manager"].includes(currentUser()?.role);
}

function canAdminUsers() {
  return ["system_admin", "admin"].includes(currentUser()?.role);
}

function visibleItems() {
  if (canViewAll()) return state.items;
  const user = currentUser();
  if (!user) return [];
  return state.items.filter((item) => item.ownerId === user.id);
}

function renderOwnerOptions() {
  elements.taskOwner.innerHTML = state.users.map((user) => `
    <option value="${user.id}">${escapeHTML(user.name)}</option>
  `).join("");
  elements.taskOwner.value = canViewAll() ? currentUser().id : currentUser().id;
  elements.taskOwner.disabled = !canViewAll();
}

function renderPhoneLinks() {
  const local = `${window.location.origin}`;
  elements.phoneLinks.innerHTML = `
    <a href="${local}" target="_blank" rel="noopener">${local}</a>
    <span>For iPhone, the Wi-Fi URL printed in the launcher can open the app only if your network allows it. Google sign-in on mobile needs the app hosted on a real domain, such as a subdomain of villwocksoutdoorliving.com.</span>
  `;
}

function renderAdmin() {
  if (!canViewAll()) return;
  const tasks = state.items.filter((item) => item.type === "task");
  const active = tasks.filter((task) => task.status !== "done").length;
  const overdue = tasks.filter((task) => task.status !== "done" && task.dueDate && task.dueDate < todayISO()).length;
  elements.adminMetrics.innerHTML = `
    <div class="mini-stat"><strong>${state.users.length}</strong><span>Users</span></div>
    <div class="mini-stat"><strong>${active}</strong><span>Active tasks</span></div>
    <div class="mini-stat"><strong>${overdue}</strong><span>Overdue</span></div>
    <div class="mini-stat"><strong>${state.invites.length}</strong><span>Invites</span></div>
  `;
}

function ownerName(ownerId) {
  return state.users.find((user) => user.id === ownerId)?.name || "Unassigned";
}

function roleLabel(role) {
  return {
    system_admin: "System Admin",
    admin: "Admin",
    manager: "Manager",
    team: "Team Member",
    guest: "Guest"
  }[role] || "Team Member";
}

function normalizeState() {
  state.items = Array.isArray(state.items) ? state.items : sampleTasks;
  state.users = Array.isArray(state.users) && state.users.length ? state.users : seedUsers;
  seedUsers.forEach((seedUser) => {
    const existing = state.users.find((user) => user.email.toLowerCase() === seedUser.email.toLowerCase());
    if (!existing) {
      state.users.push(seedUser);
    }
  });
  state.users.forEach((user) => {
    if (user.email.toLowerCase() === systemAdminEmail) {
      user.id = "admin-elijah";
      user.name = user.name || "Elijah Villwock";
      user.role = "system_admin";
      return;
    }
    if (user.role === "system_admin") {
      user.role = "admin";
    }
  });
  state.invites = Array.isArray(state.invites) ? state.invites : [];
  if (!state.currentUserId || !state.users.some((user) => user.id === state.currentUserId)) {
    state.currentUserId = null;
  }
  state.notifications = Boolean(state.notifications);
  state.googleConnected = Boolean(state.googleConnected);
  state.theme = state.theme === "dark" ? "dark" : "light";
  state.items.forEach((item) => {
    if (!item.ownerId) {
      item.ownerId = state.users[0].id;
    }
    if (item.type !== "task") return;
    if (!["high", "medium", "low"].includes(item.priority)) {
      const result = inferPriority(`${item.title} ${item.notes}`, item.dueDate);
      item.priority = result.level;
      item.priorityReason = result.reason;
    }
    if (!item.priorityReason) {
      item.priorityReason = `Manual: ${item.priority}`;
    }
  });
  persist();
}

function persist() {
  state.selectedId = selectedId;
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function buildTask({ title, notes, dueDate, dueTime, priority, source, ownerId }) {
  const auto = !priority || priority === "auto";
  const inferred = inferPriority(`${title} ${notes}`, dueDate);
  return {
    id: crypto.randomUUID(),
    type: "task",
    title,
    notes,
    dueDate: dueDate || "",
    dueTime: dueTime || "",
    priority: auto ? inferred.level : priority,
    priorityReason: auto ? inferred.reason : `Manual: ${priority}`,
    ownerId: ownerId || currentUser()?.id || state.users[0].id,
    source: source || "Capture",
    status: "active",
    createdAt: new Date().toISOString(),
    remindedAt: null
  };
}

function saveNote(text, label = "Capture note") {
  state.items.unshift({
    id: crypto.randomUUID(),
    type: "note",
    title: label,
    body: text,
    ownerId: currentUser()?.id || state.users[0].id,
    createdAt: new Date().toISOString()
  });
}

function extractTasks(text) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\u2022\d.\s]+/, "").trim())
    .filter(Boolean);
  const actionPattern = /\b(action|todo|task|follow up|follow-up|send|draft|review|schedule|confirm|prepare|update|create|share|call|email|assign|owner|due)\b/i;
  const tasks = lines
    .filter((line) => actionPattern.test(line) || /\b\w+\s+(to|will|should)\s+\w+/i.test(line))
    .map((line) => {
      const cleanTitle = line
        .replace(/^[A-Z][A-Za-z\s]{0,30}:\s*/, "")
        .replace(/^(action|todo|task)\s*[:\-]\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
      return buildTask({
        title: sentenceCase(cleanTitle.slice(0, 120)),
        notes: text.length > 280 ? text.slice(0, 280) + "..." : text,
        dueDate: inferDate(line),
        dueTime: inferTime(line),
        priority: "auto",
        source: /transcript|meeting|attendee|speaker/i.test(text) ? "Meeting" : "Capture"
      });
    });
  return tasks.slice(0, 12);
}

function inferPriority(text, dueDate = "") {
  const copy = text.toLowerCase();
  if (/\b(low priority|nice to have|when possible|backlog|someday)\b/i.test(copy)) {
    return { level: "low", reason: "Auto: marked as low urgency" };
  }
  if (/\b(urgent|asap|blocked|critical|high priority|risk|escalate|client issue)\b/i.test(copy)) {
    return { level: "high", reason: "Auto: urgent, blocked, risk, or escalation language" };
  }
  if (dueDate && dueDate <= todayISO()) {
    return { level: "high", reason: "Auto: due today or overdue" };
  }
  if (dueDate === addDaysISO(1)) {
    return { level: "medium", reason: "Auto: due tomorrow" };
  }
  if (/\b(review|send|confirm|schedule|follow up|follow-up|draft|prepare|update)\b/i.test(copy)) {
    return { level: "medium", reason: "Auto: normal work action" };
  }
  return { level: "medium", reason: "Auto: default priority" };
}

function inferDate(text) {
  const lower = text.toLowerCase();
  if (lower.includes("today")) return todayISO();
  if (lower.includes("tomorrow")) return addDaysISO(1);
  const numeric = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const year = numeric[3] ? normalizeYear(numeric[3]) : new Date().getFullYear();
    return toISODate(new Date(year, Number(numeric[1]) - 1, Number(numeric[2])));
  }
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const hit = weekdays.findIndex((day) => lower.includes(day));
  if (hit >= 0) return nextWeekdayISO(hit);
  return "";
}

function inferTime(text) {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = match[2] || "00";
  const marker = match[3].toLowerCase();
  if (marker === "pm" && hour < 12) hour += 12;
  if (marker === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function render() {
  renderAuth();
  if (!currentUser()) return;
  renderStats();
  renderOwnerOptions();
  renderOwnerFilterOptions();
  renderTasks();
  renderReminders();
  renderDetail();
  renderAdmin();
}

function renderStats() {
  const tasks = visibleItems().filter((item) => item.type === "task");
  elements.statToday.textContent = tasks.filter((task) => task.status !== "done" && task.dueDate === todayISO()).length;
  elements.statUpcoming.textContent = tasks.filter((task) => task.status !== "done" && task.dueDate > todayISO()).length;
  elements.statOverdue.textContent = tasks.filter((task) => task.status !== "done" && task.dueDate && task.dueDate < todayISO()).length;
  elements.statInbox.textContent = state.items.filter((item) => item.type === "note").length;
}

function renderOwnerFilterOptions() {
  if (!canViewAll()) return;
  const options = [
    `<option value="all">All company tasks</option>`,
    ...state.users.map((user) => `<option value="${user.id}">${escapeHTML(user.name)}</option>`)
  ];
  elements.ownerFilter.innerHTML = options.join("");
  elements.ownerFilter.value = ownerFilterId;
}

function renderTasks() {
  elements.taskList.innerHTML = "";
  if (activeFilter === "calendar") {
    renderCalendar();
    return;
  }
  if (activeFilter === "people") {
    renderPeople();
    return;
  }
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = visibleItems().filter((item) => filterItem(item, query));
  if (filtered.length === 0) {
    elements.taskList.innerHTML = `<div class="empty-state">No matching items yet. Capture a note or add a task to get moving.</div>`;
    return;
  }
  filtered.forEach((item) => {
    const card = item.type === "task" ? taskCard(item) : noteCard(item);
    elements.taskList.append(card);
  });
}

function filterItem(item, query) {
  const text = item.type === "task"
    ? `${item.title} ${item.notes} ${item.source} ${item.priority}`.toLowerCase()
    : `${item.title} ${item.body}`.toLowerCase();
  if (query && !text.includes(query)) return false;
  if (canViewAll() && ownerFilterId !== "all" && item.ownerId !== ownerFilterId) return false;
  if (activeFilter === "notes") return item.type === "note";
  if (item.type !== "task") return false;
  if (activeFilter === "active") return item.status !== "done";
  if (activeFilter === "today") return item.status !== "done" && item.dueDate === todayISO();
  if (activeFilter === "upcoming") return item.status !== "done" && item.dueDate > todayISO();
  if (activeFilter === "calendar") return item.type === "task";
  if (activeFilter === "people") return canViewAll();
  if (activeFilter === "done") return item.status === "done";
  return true;
}

function taskCard(task) {
  const node = elements.taskTemplate.content.firstElementChild.cloneNode(true);
  node.classList.toggle("done", task.status === "done");
  node.classList.toggle("selected", task.id === selectedId);
  node.querySelector("h3").textContent = task.title;
  node.querySelector("p").textContent = task.notes || "No notes yet.";
  node.querySelector(".task-meta").innerHTML = [
    `<span class="pill ${task.priority}">${task.priority}</span>`,
    `<span class="pill">${task.priorityReason?.startsWith("Auto") ? "auto" : "manual"}</span>`,
    `<span class="pill">${ownerName(task.ownerId)}</span>`,
    `<span class="pill">${task.source}</span>`,
    task.dueDate ? `<span class="pill">${formatDateTime(task)}</span>` : `<span class="pill">No date</span>`
  ].join("");
  node.querySelector(".task-footer").innerHTML = reminderLabel(task);
  node.querySelector(".complete-btn").addEventListener("click", () => {
    task.status = task.status === "done" ? "active" : "done";
    persist();
    render();
  });
  node.querySelector(".select-btn").addEventListener("click", () => {
    selectedId = task.id;
    persist();
    render();
  });
  node.addEventListener("dblclick", () => {
    selectedId = task.id;
    persist();
    render();
  });
  return node;
}

function noteCard(note) {
  const article = document.createElement("article");
  article.className = "task-card";
  article.innerHTML = `
    <div class="complete-btn" aria-hidden="true"><svg><use href="#icon-inbox"></use></svg></div>
    <div class="task-content">
      <div class="task-meta"><span class="pill">note</span><span class="pill">${formatCreated(note.createdAt)}</span></div>
      <h3>${escapeHTML(note.title)}</h3>
      <p>${escapeHTML(note.body)}</p>
      <div class="task-footer"><span class="pill">Saved input</span></div>
    </div>
    <button class="select-btn">Open</button>
  `;
  article.querySelector(".select-btn").addEventListener("click", () => {
    selectedId = note.id;
    persist();
    render();
  });
  article.classList.toggle("selected", note.id === selectedId);
  return article;
}

function renderReminders() {
  const upcoming = visibleItems()
    .filter((item) => item.type === "task" && item.status !== "done" && item.dueDate)
    .sort((a, b) => taskTimestamp(a) - taskTimestamp(b))
    .slice(0, 4);
  elements.reminderStack.innerHTML = upcoming.length
    ? upcoming.map((task) => `<div class="reminder-item"><strong>${escapeHTML(task.title)}</strong><span>${formatDateTime(task)}</span></div>`).join("")
    : `<div class="reminder-item"><strong>No dated tasks</strong><span>Add due dates to build your reminder queue.</span></div>`;
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const datedTasks = visibleItems()
    .filter((item) => item.type === "task" && item.status !== "done" && item.dueDate)
    .filter((item) => !canViewAll() || ownerFilterId === "all" || item.ownerId === ownerFilterId)
    .reduce((groups, task) => {
      groups[task.dueDate] = [...(groups[task.dueDate] || []), task];
      return groups;
    }, {});
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const iso = toISODate(day);
    const tasks = (datedTasks[iso] || []).sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || taskTimestamp(a) - taskTimestamp(b));
    cells.push(`
      <article class="calendar-day ${day.getMonth() === month ? "" : "outside"} ${iso === todayISO() ? "today" : ""}">
        <div class="day-number">
          <span>${day.getDate()}</span>
          ${tasks.length ? `<span class="day-count">${tasks.length}</span>` : ""}
        </div>
        ${tasks.slice(0, 3).map((task) => `
          <button class="calendar-task ${task.priority}" data-task-id="${task.id}" title="${escapeHTML(task.title)}">
            ${escapeHTML(task.title)}
          </button>
        `).join("")}
        ${tasks.length > 3 ? `<div class="calendar-overflow">+${tasks.length - 3} more</div>` : ""}
      </article>
    `);
  }
  elements.taskList.innerHTML = `
    <section class="calendar-view">
      <div class="calendar-header">
        <h3>${calendarTitle()}</h3>
        <div class="calendar-controls">
          <button id="prevMonth">Previous</button>
          <button id="nextMonth">Next</button>
        </div>
      </div>
      <div class="calendar-grid">
        ${weekdays.map((day) => `<div class="weekday">${day}</div>`).join("")}
        ${cells.join("")}
      </div>
    </section>
  `;
  document.querySelector("#prevMonth").addEventListener("click", () => {
    calendarDate = new Date(year, month - 1, 1);
    render();
  });
  document.querySelector("#nextMonth").addEventListener("click", () => {
    calendarDate = new Date(year, month + 1, 1);
    render();
  });
  document.querySelectorAll(".calendar-task").forEach((button) => {
    button.addEventListener("click", () => {
      selectedId = button.dataset.taskId;
      persist();
      render();
    });
  });
}

function renderPeople() {
  if (!canViewAll()) {
    elements.taskList.innerHTML = `<div class="empty-state">You do not have permission to view company people status.</div>`;
    return;
  }
  elements.taskList.innerHTML = `
    <section class="people-view">
      ${state.users.map((user) => {
        const tasks = state.items.filter((item) => item.type === "task" && item.ownerId === user.id);
        const active = tasks.filter((task) => task.status !== "done").length;
        const overdue = tasks.filter((task) => task.status !== "done" && task.dueDate && task.dueDate < todayISO()).length;
        const done = tasks.filter((task) => task.status === "done").length;
        const lockedSystemAdmin = user.email.toLowerCase() === systemAdminEmail;
        return `
          <article class="person-card">
            <div>
              <h3>${escapeHTML(user.name)}</h3>
              <p>${escapeHTML(user.email)} · ${roleLabel(user.role)} · ${escapeHTML(user.status)}</p>
            </div>
            <div class="status-line">
              <span class="pill">${active} active</span>
              <span class="pill ${overdue ? "high" : "low"}">${overdue} overdue</span>
              <span class="pill">${done} done</span>
              <button class="person-calendar-btn" data-user-id="${user.id}">
                <svg><use href="#icon-calendar"></use></svg>
                Calendar
              </button>
              ${canAdminUsers() ? `
                <select class="role-select" data-user-id="${user.id}" ${lockedSystemAdmin ? "disabled" : ""} aria-label="Permission for ${escapeHTML(user.name)}">
                  <option value="team" ${user.role === "team" ? "selected" : ""}>Team Member</option>
                  <option value="manager" ${user.role === "manager" ? "selected" : ""}>Manager</option>
                  <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                  ${lockedSystemAdmin ? `<option value="system_admin" selected>System Admin</option>` : ""}
                </select>
              ` : ""}
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
  document.querySelectorAll(".person-calendar-btn").forEach((button) => {
    button.addEventListener("click", () => {
      ownerFilterId = button.dataset.userId;
      setActiveFilter("calendar");
    });
  });
  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", () => {
      const user = state.users.find((entry) => entry.id === select.dataset.userId);
      if (!user || user.email.toLowerCase() === systemAdminEmail) return;
      user.role = select.value;
      persist();
      render();
    });
  });
}

function renderDetail() {
  const item = state.items.find((entry) => entry.id === selectedId);
  if (!item) {
    elements.detailPanel.innerHTML = `<h2>Selected Task</h2><p class="empty-detail">Choose any task to see notes and next actions.</p>`;
    return;
  }
  if (item.type === "note") {
    elements.detailPanel.innerHTML = `
      <h2>Saved Note</h2>
      <div class="detail-card">
        <div class="detail-title">${escapeHTML(item.title)}</div>
        <div class="detail-notes">${escapeHTML(item.body)}</div>
        <button class="primary" id="turnNoteIntoTasks">Extract Tasks</button>
      </div>
    `;
    document.querySelector("#turnNoteIntoTasks").addEventListener("click", () => {
      const tasks = extractTasks(item.body);
      state.items = [...tasks, ...state.items.filter((entry) => entry.id !== item.id)];
      selectedId = tasks[0]?.id || null;
      persist();
      render();
    });
    return;
  }
  elements.detailPanel.innerHTML = `
    <h2>Selected Task</h2>
    <div class="detail-card">
      <div class="task-meta">
        <span class="pill ${item.priority}">${item.priority}</span>
        <span class="pill">${escapeHTML(item.priorityReason || "Auto priority")}</span>
        <span class="pill">Owner: ${escapeHTML(ownerName(item.ownerId))}</span>
        <span class="pill">${item.source}</span>
        <span class="pill">${item.dueDate ? formatDateTime(item) : "No due date"}</span>
      </div>
      <div class="detail-title">${escapeHTML(item.title)}</div>
      <div class="detail-notes">${escapeHTML(item.notes || "No notes yet.")}</div>
      <div class="detail-actions">
        <button id="editSelected">Edit task</button>
        <button id="deleteSelected">Delete task</button>
      </div>
    </div>
  `;
  document.querySelector("#editSelected").addEventListener("click", () => editTask(item));
  document.querySelector("#deleteSelected").addEventListener("click", () => {
    state.items = state.items.filter((entry) => entry.id !== item.id);
    selectedId = state.items.find((entry) => entry.type === "task")?.id || null;
    persist();
    render();
  });
}

function editTask(task) {
  const title = prompt("Task title", task.title);
  if (title === null || !title.trim()) return;
  const dueDate = prompt("Due date, YYYY-MM-DD", task.dueDate || "");
  if (dueDate === null) return;
      const dueTime = prompt("Due time, HH:MM", task.dueTime || "");
  if (dueTime === null) return;
  const priority = prompt("Priority: auto, high, medium, or low", task.priority || "auto");
  if (priority === null) return;
  task.title = title.trim();
  task.dueDate = dueDate.trim();
  task.dueTime = dueTime.trim();
  const normalizedPriority = priority.trim().toLowerCase();
  if (normalizedPriority === "auto" || !["high", "medium", "low"].includes(normalizedPriority)) {
    const inferred = inferPriority(`${task.title} ${task.notes}`, task.dueDate);
    task.priority = inferred.level;
    task.priorityReason = inferred.reason;
  } else {
    task.priority = normalizedPriority;
    task.priorityReason = `Manual: ${normalizedPriority}`;
  }
  persist();
  render();
}

function checkReminders() {
  if (!state.notifications || !("Notification" in window) || Notification.permission !== "granted") return;
  const now = Date.now();
  state.items.forEach((task) => {
    if (task.type !== "task" || task.status === "done" || !task.dueDate || task.remindedAt) return;
    const timestamp = taskTimestamp(task);
    const minutesUntil = (timestamp - now) / 60000;
    if (minutesUntil <= 15 && minutesUntil > -60) {
      new Notification("Task reminder", {
        body: `${task.title} is due ${formatDateTime(task)}.`
      });
      task.remindedAt = new Date().toISOString();
      persist();
    }
  });
}

function selectedTask() {
  return state.items.find((item) => item.id === selectedId && item.type === "task");
}

function updateWorkspaceLabel() {
  elements.workspaceStatus.textContent = state.googleConnected ? "Workspace shortcuts active" : "Ready to connect";
  elements.connectGoogleBtn.textContent = state.googleConnected ? "Disconnect" : "Connect";
}

function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 1;
}

function calendarTitle() {
  const month = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(calendarDate);
  if (!canViewAll() || ownerFilterId === "all") return month;
  return `${month} · ${ownerName(ownerFilterId)}`;
}

function calendarDates(task) {
  const start = new Date(taskTimestamp(task));
  const end = new Date(start.getTime() + 30 * 60000);
  return `${toCalendarDate(start)}/${toCalendarDate(end)}`;
}

function reminderLabel(task) {
  if (!task.dueDate) return `<span class="pill">Reminder off</span>`;
  const timestamp = taskTimestamp(task);
  if (timestamp < Date.now() && task.status !== "done") return `<span class="pill high">Overdue</span>`;
  return `<span class="pill">Reminder set</span>`;
}

function taskTimestamp(task) {
  const time = task.dueTime || "09:00";
  return new Date(`${task.dueDate || todayISO()}T${time}:00`).getTime();
}

function formatDateTime(task) {
  const date = new Date(`${task.dueDate}T${task.dueTime || "09:00"}:00`);
  const options = task.dueTime
    ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

function formatCreated(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function sentenceCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function flashButton(button, text) {
  const original = button.innerHTML;
  button.textContent = text;
  setTimeout(() => {
    button.innerHTML = original;
  }, 1300);
}

function normalizeYear(value) {
  const year = Number(value);
  return year < 100 ? 2000 + year : year;
}

function todayISO() {
  return toISODate(new Date());
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function addHoursISO(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function nextWeekdayISO(targetDay) {
  const date = new Date();
  const distance = (targetDay + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + distance);
  return toISODate(date);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
