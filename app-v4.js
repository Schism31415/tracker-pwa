let tenants = [];
let entries = [];
let sessions = {};
let incomeExpenseChart, cashFlowChart;

document.addEventListener("DOMContentLoaded", () => {
  // Tenant buttons
  document.getElementById("addTenantBtn").addEventListener("click", addTenant);
  document.getElementById("removeTenantBtn").addEventListener("click", removeTenant);

  // Entry form
  document.getElementById("entryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addEntry();
  });

  // Session buttons
  document.getElementById("saveSessionBtn").addEventListener("click", saveSession);
  document.getElementById("loadSessionBtn").addEventListener("click", loadSession);
  document.getElementById("deleteSessionBtn").addEventListener("click", deleteSession);
});

// --- Tenant Functions ---
function addTenant() {
  const name = document.getElementById("tenantName").value.trim();
  if (name && !tenants.includes(name)) {
    tenants.push(name);
    updateTenantDropdown();
    document.getElementById("tenantName").value = "";
  }
}

function removeTenant() {
  const select = document.getElementById("tenantSelect");
  const selected = select.value;
  if (selected) {
    tenants = tenants.filter(t => t !== selected);
    entries = entries.filter(e => e.tenant !== selected);
    updateTenantDropdown();
    updateCharts();
  }
}

function updateTenantDropdown() {
  const select = document.getElementById("tenantSelect");
  select.innerHTML = "";
  tenants.forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.textContent = t;
    select.appendChild(option);
  });
}

// --- Entry Functions ---
function addEntry() {
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const source = document.getElementById("source").value.trim();
  const tenant = document.getElementById("tenantSelect").value;

  if (!tenant) {
    alert("Please select a tenant first.");
    return;
  }

  if (!isNaN(amount) && amount > 0) {
    entries.push({ type, amount, source, tenant });
    document.getElementById("entryForm").reset();
    updateCharts();
  }
}

// --- Chart Functions ---
function updateCharts() {
  if (incomeExpenseChart) incomeExpenseChart.destroy();
  if (cashFlowChart) cashFlowChart.destroy();

  const incomes = entries.filter(e => e.type === "income").map(e => e.amount);
  const expenses = entries.filter(e => e.type === "expense").map(e => e.amount);
  const labels = entries.map(e => e.tenant || "Unknown");

  const ctx1 = document.getElementById("incomeExpenseChart").getContext("2d");
  incomeExpenseChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Income", data: incomes, backgroundColor: "green" },
        { label: "Expenses", data: expenses, backgroundColor: "red" }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctx2 = document.getElementById("cashFlowChart").getContext("2d");
  const netCashFlow = incomes.reduce((a, b) => a + b, 0) - expenses.reduce((a, b) => a + b, 0);

  cashFlowChart = new Chart(ctx2, {
    type: "line",
    data: {
      labels: ["Net Cash Flow"],
      datasets: [
        { label: "Cash Flow", data: [netCashFlow], borderColor: "gold", backgroundColor: "rgba(255,215,0,0.2)", fill: true }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// --- Session Functions ---
function saveSession() {
  const name = document.getElementById("sessionName").value.trim();
  if (!name) return alert("Enter a session name.");
  sessions[name] = { tenants: [...tenants], entries: [...entries] };
  updateSessionDropdown();
}

function loadSession() {
  const name = document.getElementById("sessionSelect").value;
  if (!name || !sessions[name]) return alert("Select a session.");
  tenants = [...sessions[name].tenants];
  entries = [...sessions[name].entries];
  updateTenantDropdown();
  updateCharts();
}

function deleteSession() {
  const name = document.getElementById("sessionSelect").value;
  if (name && sessions[name]) {
    delete sessions[name];
    updateSessionDropdown();
  }
}

function updateSessionDropdown() {
  const select = document.getElementById("sessionSelect");
  select.innerHTML = "";
  Object.keys(sessions).forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s;
    select.appendChild(option);
  });
}
