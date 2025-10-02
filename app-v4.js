// ---------------------------
// Premium Investor App v4
// ---------------------------

// Global data
let tenants = [];
let entries = [];
let sessions = {};

// DOM elements
const tenantNameInput = document.getElementById("tenantName");
const addTenantBtn = document.getElementById("addTenantBtn");
const removeTenantBtn = document.getElementById("removeTenantBtn");
const tenantSelect = document.getElementById("tenantSelect");

const entryForm = document.getElementById("entryForm");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const sourceInput = document.getElementById("source");

const sessionNameInput = document.getElementById("sessionName");
const saveSessionBtn = document.getElementById("saveSessionBtn");
const loadSessionBtn = document.getElementById("loadSessionBtn");
const deleteSessionBtn = document.getElementById("deleteSessionBtn");
const sessionSelect = document.getElementById("sessionSelect");

// ---------------------------
// Chart.js Setup
// ---------------------------
const ctx1 = document.getElementById("incomeExpenseChart").getContext("2d");
const ctx2 = document.getElementById("cashFlowChart").getContext("2d");

const incomeExpenseChart = new Chart(ctx1, {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        label: "Income",
        backgroundColor: "#ffd700",
        data: []
      },
      {
        label: "Expenses",
        backgroundColor: "#c0392b",
        data: []
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { labels: { color: "#ffd700" } } },
    scales: {
      x: { ticks: { color: "#f1f1f1" } },
      y: { ticks: { color: "#f1f1f1" } }
    }
  }
});

const cashFlowChart = new Chart(ctx2, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Cash Flow",
        borderColor: "#ffd700",
        backgroundColor: "rgba(255,215,0,0.2)",
        fill: true,
        data: []
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { labels: { color: "#ffd700" } } },
    scales: {
      x: { ticks: { color: "#f1f1f1" } },
      y: { ticks: { color: "#f1f1f1" } }
    }
  }
});

// ---------------------------
// Tenant Management
// ---------------------------
addTenantBtn.addEventListener("click", () => {
  const name = tenantNameInput.value.trim();
  if (name && !tenants.includes(name)) {
    tenants.push(name);
    updateTenantDropdown();
    tenantNameInput.value = "";
  }
});

removeTenantBtn.addEventListener("click", () => {
  const selected = tenantSelect.value;
  if (selected) {
    tenants = tenants.filter(t => t !== selected);
    updateTenantDropdown();
  }
});

function updateTenantDropdown() {
  tenantSelect.innerHTML = "";
  tenants.forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.textContent = t;
    tenantSelect.appendChild(option);
  });
}

// ---------------------------
// Entry Form
// ---------------------------
entryForm.addEventListener("submit", e => {
  e.preventDefault();
  const tenant = tenantSelect.value;
  const type = typeInput.value;
  const amount = parseFloat(amountInput.value);
  const source = sourceInput.value || "";

  if (!tenant || isNaN(amount)) return;

  const entry = { tenant, type, amount, source, date: new Date().toLocaleDateString() };
  entries.push(entry);

  updateCharts();
  entryForm.reset();
});

function updateCharts() {
  const incomeData = {};
  const expenseData = {};
  let cashFlow = 0;
  const cashFlowPoints = [];

  entries.forEach((entry, index) => {
    const tenant = entry.tenant;

    if (entry.type === "income") {
      incomeData[tenant] = (incomeData[tenant] || 0) + entry.amount;
      cashFlow += entry.amount;
    } else {
      expenseData[tenant] = (expenseData[tenant] || 0) + entry.amount;
      cashFlow -= entry.amount;
    }
    cashFlowPoints.push(cashFlow);
  });

  // Update Income vs Expense
  incomeExpenseChart.data.labels = tenants;
  incomeExpenseChart.data.datasets[0].data = tenants.map(t => incomeData[t] || 0);
  incomeExpenseChart.data.datasets[1].data = tenants.map(t => expenseData[t] || 0);
  incomeExpenseChart.update();

  // Update Cash Flow
  cashFlowChart.data.labels = entries.map((_, i) => `Entry ${i+1}`);
  cashFlowChart.data.datasets[0].data = cashFlowPoints;
  cashFlowChart.update();
}

// ---------------------------
// Sessions
// ---------------------------
saveSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (!name) return;

  sessions[name] = { tenants: [...tenants], entries: [...entries] };
  updateSessionDropdown();
  localStorage.setItem("sessions", JSON.stringify(sessions));
  sessionNameInput.value = "";
});

loadSessionBtn.addEventListener("click", () => {
  const selected = sessionSelect.value;
  if (!selected || !sessions[selected]) return;

  tenants = [...sessions[selected].tenants];
  entries = [...sessions[selected].entries];
  updateTenantDropdown();
  updateCharts();
});

deleteSessionBtn.addEventListener("click", () => {
  const selected = sessionSelect.value;
  if (!selected) return;

  delete sessions[selected];
  updateSessionDropdown();
  localStorage.setItem("sessions", JSON.stringify(sessions));
});

function updateSessionDropdown() {
  sessionSelect.innerHTML = "";
  Object.keys(sessions).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    sessionSelect.appendChild(option);
  });
}

// ---------------------------
// LocalStorage Load
// ---------------------------
window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("sessions")) || {};
  sessions = saved;
  updateSessionDropdown();
});
