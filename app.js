let incomes = [];
let expenses = [];
let tenants = [];
let sessions = {};
let currency = "£";

// Chart instances
let incomeChart, expenseChart;

// --- Utility ---
function saveToLocal() {
  localStorage.setItem("autosave", JSON.stringify({ incomes, expenses, tenants, currency }));
  document.getElementById("save-status").textContent =
    "Last saved at " + new Date().toLocaleTimeString();
}

function refreshTenantDropdowns() {
  const incomeTenant = document.getElementById("income-tenant");
  const expenseTenant = document.getElementById("expense-tenant");
  incomeTenant.innerHTML = '<option value="">-- Select Tenant --</option>';
  expenseTenant.innerHTML = '<option value="">-- Select Tenant --</option>';

  tenants.forEach((t) => {
    const opt1 = document.createElement("option");
    opt1.value = t;
    opt1.textContent = t;
    incomeTenant.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = t;
    opt2.textContent = t;
    expenseTenant.appendChild(opt2);
  });
}

function renderTenants() {
  const tenantList = document.getElementById("tenant-list");
  tenantList.innerHTML = "";
  tenants.forEach((t, index) => {
    const li = document.createElement("li");
    li.textContent = t;
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => {
      tenants.splice(index, 1);
      refreshTenantDropdowns();
      renderTenants();
      saveToLocal();
    };
    li.appendChild(delBtn);
    tenantList.appendChild(li);
  });
}

// --- Charts ---
function updateCharts() {
  if (!incomeChart) {
    incomeChart = new Chart(document.getElementById("incomeChart"), {
      type: "line",
      data: { labels: [], datasets: [{
        label: "Income",
        data: [],
        borderColor: "#4caf50",
        backgroundColor: "rgba(76,175,80,0.15)",
        fill: true,
        tension: 0.4
      }]},
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { label: ctx => `${currency}${ctx.formattedValue}` } }
        },
        scales: { y: { ticks: { callback: v => currency + v } } }
      }
    });
  }
  if (!expenseChart) {
    expenseChart = new Chart(document.getElementById("expenseChart"), {
      type: "line",
      data: { labels: [], datasets: [{
        label: "Expenses",
        data: [],
        borderColor: "#f44336",
        backgroundColor: "rgba(244,67,54,0.15)",
        fill: true,
        tension: 0.4
      }]},
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { label: ctx => `${currency}${ctx.formattedValue}` } }
        },
        scales: { y: { ticks: { callback: v => currency + v } } }
      }
    });
  }

  incomeChart.data.labels = incomes.map(i => i.date);
  incomeChart.data.datasets[0].data = incomes.map(i => i.amount);
  incomeChart.update();

  expenseChart.data.labels = expenses.map(e => e.date);
  expenseChart.data.datasets[0].data = expenses.map(e => e.amount);
  expenseChart.update();

  renderLists();
}

function renderLists() {
  const incomeList = document.getElementById("income-list");
  const expenseList = document.getElementById("expense-list");
  incomeList.innerHTML = "";
  expenseList.innerHTML = "";

  incomes.forEach((i, idx) => {
    const li = document.createElement("li");
    li.textContent = `${currency}${i.amount} (${i.source}, ${i.date}, Tenant: ${i.tenant || "N/A"}) `;
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => { incomes.splice(idx, 1); updateCharts(); saveToLocal(); };
    li.appendChild(delBtn);
    incomeList.appendChild(li);
  });

  expenses.forEach((e, idx) => {
    const li = document.createElement("li");
    li.textContent = `${currency}${e.amount} (${e.category}, ${e.date}, Tenant: ${e.tenant || "N/A"}) `;
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => { expenses.splice(idx, 1); updateCharts(); saveToLocal(); };
    li.appendChild(delBtn);
    expenseList.appendChild(li);
  });
}

// --- Event listeners ---
document.getElementById("add-tenant").onclick = () => {
  const name = document.getElementById("tenant-name").value.trim();
  if (!name) return;
  tenants.push(name);
  document.getElementById("tenant-name").value = "";
  refreshTenantDropdowns();
  renderTenants();
  saveToLocal();
};

document.getElementById("add-income").onclick = () => {
  const tenant = document.getElementById("income-tenant").value;
  const source = document.getElementById("income-source").value;
  const amount = parseFloat(document.getElementById("income-amount").value);
  const date = document.getElementById("income-date").value;
  if (!amount || !date) return;
  incomes.push({ tenant, source, amount, date });
  updateCharts();
  saveToLocal();
};

document.getElementById("add-expense").onclick = () => {
  const tenant = document.getElementById("expense-tenant").value;
  const category = document.getElementById("expense-category").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const date = document.getElementById("expense-date").value;
  if (!amount || !date) return;
  expenses.push({ tenant, category, amount, date });
  updateCharts();
  saveToLocal();
};

document.getElementById("currency").onchange = (e) => {
  currency = e.target.value;
  updateCharts();
  saveToLocal();
};

document.getElementById("save-session").onclick = () => {
  const sessionName = prompt("Enter session name:");
  if (sessionName) {
    sessions[sessionName] = { incomes, expenses, tenants, currency };
    localStorage.setItem("sessions", JSON.stringify(sessions));
    refreshSessions();
  }
};

document.getElementById("export-csv").onclick = () => {
  let rows = [["Type","Tenant","Category/Source","Amount","Date"]];
  incomes.forEach(i => rows.push(["Income", i.tenant || "", i.source, i.amount, i.date]));
  expenses.forEach(e => rows.push(["Expense", e.tenant || "", e.category, e.amount, e.date]));

  let csv = rows.map(r => r.join(",")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "report.csv";
  a.click();
};

function refreshSessions() {
  const sessionList = document.getElementById("session-list");
  sessionList.innerHTML = "";
  for (let name in sessions) {
    const li = document.createElement("li");
    li.textContent = name;
    li.onclick = () => {
      incomes = sessions[name].incomes || [];
      expenses = sessions[name].expenses || [];
      tenants = sessions[name].tenants || [];
      currency = sessions[name].currency || "£";
      document.getElementById("currency").value = currency;
      refreshTenantDropdowns();
      renderTenants();
      updateCharts();
    };
    sessionList.appendChild(li);
  }
}

// --- Init ---
window.onload = () => {
  sessions = JSON.parse(localStorage.getItem("sessions")) || {};
  refreshSessions();
  const autosave = JSON.parse(localStorage.getItem("autosave"));
  if (autosave) {
    incomes = autosave.incomes || [];
    expenses = autosave.expenses || [];
    tenants = autosave.tenants || [];
    currency = autosave.currency || "£";
    document.getElementById("currency").value = currency;
  }
  refreshTenantDropdowns();
  renderTenants();
  updateCharts();
};
