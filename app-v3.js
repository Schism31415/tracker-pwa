// ==== Data Structures ====
let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let sessions = JSON.parse(localStorage.getItem("sessions")) || {};

const tenantSelect = document.getElementById("tenantSelect");
const addTenantBtn = document.getElementById("addTenant");
const tenantNameInput = document.getElementById("tenantName");

const transactionForm = document.getElementById("transactionForm");
const saveSessionBtn = document.getElementById("saveSession");
const loadSessionBtn = document.getElementById("loadSession");
const deleteSessionBtn = document.getElementById("deleteSession");
const exportCSVBtn = document.getElementById("exportCSV");
const exportPDFBtn = document.getElementById("exportPDF");

const sessionNameInput = document.getElementById("sessionName");

// Chart instances
let incomeChart, expenseChart;

// ==== Utility Functions ====
function saveToStorage() {
  localStorage.setItem("tenants", JSON.stringify(tenants));
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

function populateTenants() {
  tenantSelect.innerHTML = '<option value="">Select Tenant</option>';
  tenants.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tenantSelect.appendChild(opt);
  });
}

function renderCharts() {
  const incomes = {};
  const expenses = {};

  transactions.forEach(t => {
    if (t.type === "income") {
      incomes[t.tenant] = (incomes[t.tenant] || 0) + t.amount;
    } else {
      expenses[t.tenant] = (expenses[t.tenant] || 0) + t.amount;
    }
  });

  const tenantLabels = [...new Set([...Object.keys(incomes), ...Object.keys(expenses)])];

  // Destroy old charts if they exist
  if (incomeChart) incomeChart.destroy();
  if (expenseChart) expenseChart.destroy();

  // Income chart
  const incomeCtx = document.getElementById("incomeChart").getContext("2d");
  incomeChart = new Chart(incomeCtx, {
    type: "line",
    data: {
      labels: tenantLabels,
      datasets: [{
        label: "Income",
        data: tenantLabels.map(t => incomes[t] || 0),
        borderColor: "#ffd700",
        backgroundColor: "rgba(255,215,0,0.2)",
        fill: true,
        tension: 0.4 // makes the curve smooth
      }]
    },
    options: {
      plugins: { legend: { labels: { color: "#f1f1f1" } } },
      scales: {
        x: { ticks: { color: "#f1f1f1" } },
        y: { ticks: { color: "#f1f1f1" } }
      }
    }
  });

  // Expense chart
  const expenseCtx = document.getElementById("expenseChart").getContext("2d");
  expenseChart = new Chart(expenseCtx, {
    type: "line",
    data: {
      labels: tenantLabels,
      datasets: [{
        label: "Expenses",
        data: tenantLabels.map(t => expenses[t] || 0),
        borderColor: "#ff4d4d",
        backgroundColor: "rgba(255,77,77,0.2)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      plugins: { legend: { labels: { color: "#f1f1f1" } } },
      scales: {
        x: { ticks: { color: "#f1f1f1" } },
        y: { ticks: { color: "#f1f1f1" } }
      }
    }
  });
}

// ==== Event Listeners ====
// Add Tenant
addTenantBtn.addEventListener("click", () => {
  const name = tenantNameInput.value.trim();
  if (name && !tenants.includes(name)) {
    tenants.push(name);
    tenantNameInput.value = "";
    populateTenants();
    saveToStorage();
    renderCharts();
  }
});

// Add Transaction
transactionForm.addEventListener("submit", e => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const currency = document.getElementById("currency").value;
  const category = document.getElementById("category").value;
  const tenant = tenantSelect.value;

  if (!tenant) {
    alert("Please select a tenant first!");
    return;
  }

  transactions.push({ type, amount, currency, category, tenant });
  transactionForm.reset();
  saveToStorage();
  renderCharts();
});

// Save Session
saveSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (!name) return alert("Enter session name");
  sessions[name] = { tenants: [...tenants], transactions: [...transactions] };
  saveToStorage();
  alert("Session saved!");
});

// Load Session
loadSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (!name || !sessions[name]) return alert("Session not found!");
  tenants = [...sessions[name].tenants];
  transactions = [...sessions[name].transactions];
  populateTenants();
  saveToStorage();
  renderCharts();
  alert("Session loaded!");
});

// Delete Session
deleteSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (!name || !sessions[name]) return alert("Session not found!");
  delete sessions[name];
  saveToStorage();
  alert("Session deleted!");
});

// Export CSV
exportCSVBtn.addEventListener("click", () => {
  let csv = "Type,Amount,Currency,Category,Tenant\n";
  transactions.forEach(t => {
    csv += `${t.type},${t.amount},${t.currency},${t.category},${t.tenant}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transactions.csv";
  link.click();
});

// Export PDF
exportPDFBtn.addEventListener("click", () => {
  const doc = new jsPDF();
  doc.text("Transactions Report", 10, 10);
  let y = 20;
  transactions.forEach(t => {
    doc.text(`${t.type} - ${t.amount}${t.currency} (${t.category}) [${t.tenant}]`, 10, y);
    y += 10;
  });
  doc.save("transactions.pdf");
});

// ==== Init ====
populateTenants();
renderCharts();
