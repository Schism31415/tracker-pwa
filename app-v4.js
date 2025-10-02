// ================== Global State ==================
let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let currentTenant = null;
let tenantData = JSON.parse(localStorage.getItem("tenantData")) || {};
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

// ================== DOM Elements ==================
const tenantSelect = document.getElementById("tenant");
const addTenantBtn = document.getElementById("addTenant");
const removeTenantBtn = document.getElementById("removeTenant");

const sessionNameInput = document.getElementById("sessionName");
const saveSessionBtn = document.getElementById("saveSession");
const loadSessionBtn = document.getElementById("loadSession");
const deleteSessionBtn = document.getElementById("deleteSession");
const sessionSelect = document.getElementById("session");

// ================== Chart Setup ==================
const incomeCtx = document.getElementById("incomeChart").getContext("2d");
const expenseCtx = document.getElementById("expenseChart").getContext("2d");

let incomeChart = new Chart(incomeCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Income (£)", borderColor: "#ffd700", data: [] }] },
  options: { responsive: true, plugins: { legend: { labels: { color: "#ffd700" } } }, scales: { x: { ticks: { color: "#ffd700" } }, y: { ticks: { color: "#ffd700" } } } }
});

let expenseChart = new Chart(expenseCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Expenses (£)", borderColor: "#ff4d4d", data: [] }] },
  options: { responsive: true, plugins: { legend: { labels: { color: "#ffd700" } } }, scales: { x: { ticks: { color: "#ffd700" } }, y: { ticks: { color: "#ffd700" } } } }
});

// ================== Functions ==================
function updateTenantDropdown() {
  tenantSelect.innerHTML = "";
  tenants.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tenantSelect.appendChild(opt);
  });
  if (currentTenant && tenants.includes(currentTenant)) {
    tenantSelect.value = currentTenant;
  } else {
    currentTenant = null;
  }
}

function updateSessionDropdown() {
  sessionSelect.innerHTML = "";
  sessions.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    sessionSelect.appendChild(opt);
  });
}

function saveState() {
  localStorage.setItem("tenants", JSON.stringify(tenants));
  localStorage.setItem("tenantData", JSON.stringify(tenantData));
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

function loadTenantData(name) {
  if (!tenantData[name]) tenantData[name] = { income: [], expenses: [] };
  let data = tenantData[name];

  incomeChart.data.labels = data.income.map((_, i) => `Entry ${i + 1}`);
  incomeChart.data.datasets[0].data = data.income;
  expenseChart.data.labels = data.expenses.map((_, i) => `Entry ${i + 1}`);
  expenseChart.data.datasets[0].data = data.expenses;

  incomeChart.update();
  expenseChart.update();
}

// ================== Tenant Events ==================
addTenantBtn.addEventListener("click", () => {
  const newTenant = document.getElementById("tenantInput").value.trim();
  if (newTenant && !tenants.includes(newTenant)) {
    tenants.push(newTenant);
    tenantData[newTenant] = { income: [], expenses: [] };
    currentTenant = newTenant;
    saveState();
    updateTenantDropdown();
    loadTenantData(currentTenant);
    document.getElementById("tenantInput").value = "";
  }
});

removeTenantBtn.addEventListener("click", () => {
  if (tenantSelect.value) {
    const toRemove = tenantSelect.value;
    const confirmed = confirm(`Are you sure you want to remove tenant "${toRemove}" and all their data?`);
    if (!confirmed) return;

    tenants = tenants.filter(t => t !== toRemove);
    delete tenantData[toRemove];
    currentTenant = null;
    saveState();
    updateTenantDropdown();

    // Reset charts
    incomeChart.data.labels = [];
    incomeChart.data.datasets[0].data = [];
    expenseChart.data.labels = [];
    expenseChart.data.datasets[0].data = [];
    incomeChart.update();
    expenseChart.update();
  }
});

// ================== Session Events ==================
saveSessionBtn.addEventListener("click", () => {
  const sessionName = sessionNameInput.value.trim();
  if (!sessionName) return alert("Enter a session name");

  const newSession = { name: sessionName, tenants: [...tenants], tenantData: { ...tenantData } };
  sessions = sessions.filter(s => s.name !== sessionName); // overwrite if exists
  sessions.push(newSession);

  saveState();
  updateSessionDropdown();
  sessionNameInput.value = "";
});

loadSessionBtn.addEventListener("click", () => {
  if (!sessionSelect.value) return alert("Select a session first");

  const session = sessions.find(s => s.name === sessionSelect.value);
  if (!session) return;

  tenants = [...session.tenants];
  tenantData = { ...session.tenantData };
  currentTenant = tenants.length ? tenants[0] : null;

  saveState();
  updateTenantDropdown();
  if (currentTenant) loadTenantData(currentTenant);
});

deleteSessionBtn.addEventListener("click", () => {
  if (!sessionSelect.value) return alert("Select a session to delete");

  const toRemove = sessionSelect.value;
  const confirmed = confirm(`Are you sure you want to delete session "${toRemove}"?`);
  if (!confirmed) return;

  sessions = sessions.filter(s => s.name !== toRemove);
  saveState();
  updateSessionDropdown();
});

// ================== Init ==================
updateTenantDropdown();
updateSessionDropdown();
if (tenants.length > 0) {
  currentTenant = tenants[0];
  loadTenantData(currentTenant);
}
