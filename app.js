let currency = "£";
let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let incomes = JSON.parse(localStorage.getItem("incomes")) || [];
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

const currencySelect = document.getElementById("currency");
const incomeTenantSelect = document.getElementById("income-tenant");
const expenseTenantSelect = document.getElementById("expense-tenant");
const saveStatus = document.getElementById("save-status");

// Save state
function saveData() {
  localStorage.setItem("tenants", JSON.stringify(tenants));
  localStorage.setItem("incomes", JSON.stringify(incomes));
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("sessions", JSON.stringify(sessions));
  saveStatus.textContent = "All changes saved";
}

// Tenants
function renderTenants() {
  const list = document.getElementById("tenant-list");
  list.innerHTML = "";
  incomeTenantSelect.innerHTML = "";
  expenseTenantSelect.innerHTML = "";

  tenants.forEach((tenant, index) => {
    const li = document.createElement("li");
    li.textContent = tenant;
    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.className = "delete-btn";
    btn.onclick = () => {
      tenants.splice(index, 1);
      saveData();
      renderTenants();
      updateCharts();
    };
    li.appendChild(btn);
    list.appendChild(li);

    let opt1 = document.createElement("option");
    opt1.value = tenant;
    opt1.textContent = tenant;
    incomeTenantSelect.appendChild(opt1);

    let opt2 = document.createElement("option");
    opt2.value = tenant;
    opt2.textContent = tenant;
    expenseTenantSelect.appendChild(opt2);
  });
}
document.getElementById("add-tenant").onclick = () => {
  const name = document.getElementById("tenant-name").value.trim();
  if (name) {
    tenants.push(name);
    document.getElementById("tenant-name").value = "";
    saveData();
    renderTenants();
  }
};

// Income
document.getElementById("add-income").onclick = () => {
  const tenant = incomeTenantSelect.value;
  const source = document.getElementById("income-source").value.trim();
  const amount = parseFloat(document.getElementById("income-amount").value);
  const date = document.getElementById("income-date").value;

  if (tenant && source && amount && date) {
    incomes.push({ tenant, source, amount, date });
    saveData();
    renderLists();
    updateCharts();
  }
};

// Expense
document.getElementById("add-expense").onclick = () => {
  const tenant = expenseTenantSelect.value;
  const category = document.getElementById("expense-category").value.trim();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const date = document.getElementById("expense-date").value;

  if (tenant && category && amount && date) {
    expenses.push({ tenant, category, amount, date });
    saveData();
    renderLists();
    updateCharts();
  }
};

// Lists
function renderLists() {
  const incomeList = document.getElementById("income-list");
  incomeList.innerHTML = "";
  incomes.forEach((inc, index) => {
    const li = document.createElement("li");
    li.textContent = `${inc.tenant} – ${inc.source}: ${currency}${inc.amount} (${inc.date})`;
    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.className = "delete-btn";
    btn.onclick = () => {
      incomes.splice(index, 1);
      saveData();
      renderLists();
      updateCharts();
    };
    li.appendChild(btn);
    incomeList.appendChild(li);
  });

  const expenseList = document.getElementById("expense-list");
  expenseList.innerHTML = "";
  expenses.forEach((exp, index) => {
    const li = document.createElement("li");
    li.textContent = `${exp.tenant} – ${exp.category}: ${currency}${exp.amount} (${exp.date})`;
    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.className = "delete-btn";
    btn.onclick = () => {
      expenses.splice(index, 1);
      saveData();
      renderLists();
      updateCharts();
    };
    li.appendChild(btn);
    expenseList.appendChild(li);
  });
}

// Charts
const incomeChartCtx = document.getElementById("incomeChart").getContext("2d");
const expenseChartCtx = document.getElementById("expenseChart").getContext("2d");

let incomeChart = new Chart(incomeChartCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Income", data: [], borderColor: "#4caf50", backgroundColor: "rgba(76,175,80,0.1)", fill: true, tension: 0.4 }] },
});

let expenseChart = new Chart(expenseChartCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Expenses", data: [], borderColor: "#f44336", backgroundColor: "rgba(244,67,54,0.1)", fill: true, tension: 0.4 }] },
});

function updateCharts() {
  const incomeData = {};
  incomes.forEach(i => { incomeData[i.date] = (incomeData[i.date] || 0) + i.amount; });
  incomeChart.data.labels = Object.keys(incomeData);
  incomeChart.data.datasets[0].data = Object.values(incomeData);
  incomeChart.update();

  const expenseData = {};
  expenses.forEach(e => { expenseData[e.date] = (expenseData[e.date] || 0) + e.amount; });
  expenseChart.data.labels = Object.keys(expenseData);
  expenseChart.data.datasets[0].data = Object.values(expenseData);
  expenseChart.update();

  renderTenantSummary();
}

// Tenant Summary
function renderTenantSummary() {
  const container = document.getElementById("tenant-summary-cards");
  container.innerHTML = "";

  tenants.forEach(t => {
    const totalIncome = incomes.filter(i => i.tenant === t).reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.filter(e => e.tenant === t).reduce((sum, e) => sum + e.amount, 0);
    const net = totalIncome - totalExpense;

    const card = document.createElement("div");
    card.className = "tenant-card";
    card.innerHTML = `
      <h3>${t}</h3>
      <p class="income">Income: ${currency}${totalIncome.toFixed(2)}</p>
      <p class="expense">Expenses: ${currency}${totalExpense.toFixed(2)}</p>
      <p class="net">Net: ${currency}${net.toFixed(2)}</p>
    `;
    container.appendChild(card);
  });
}

// CSV Export
document.getElementById("export-csv").onclick = () => {
  let csv = "Type,Tenant,Category/Source,Amount,Date\n";
  incomes.forEach(i => { csv += `Income,${i.tenant},${i.source},${i.amount},${i.date}\n`; });
  expenses.forEach(e => { csv += `Expense,${e.tenant},${e.category},${e.amount},${e.date}\n`; });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "property_data.csv";
  a.click();
};

// Currency
currencySelect.onchange = () => {
  currency = currencySelect.value;
  updateCharts();
  renderLists();
  renderTenantSummary();
};

// Init
renderTenants();
renderLists();
updateCharts();
