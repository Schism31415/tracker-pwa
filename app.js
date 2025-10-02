// ====== Investor Dashboard App.js ======

// DOM references
const incomeForm = document.getElementById("income-form");
const expenseForm = document.getElementById("expense-form");
const tenantSelects = document.querySelectorAll(".tenant-select");
const tenantList = document.getElementById("tenant-list");
const addTenantBtn = document.getElementById("add-tenant");
const tenantInput = document.getElementById("new-tenant");
const incomeTable = document.getElementById("income-table-body");
const expenseTable = document.getElementById("expense-table-body");
const exportCsvBtn = document.getElementById("export-csv");
const exportGraphBtn = document.getElementById("export-graph");
const saveSessionBtn = document.getElementById("save-session");
const loadSessionBtn = document.getElementById("load-session");
const deleteSessionBtn = document.getElementById("delete-session");
const sessionNameInput = document.getElementById("session-name");

// Chart.js setup
const ctx = document.getElementById("cashflow-chart").getContext("2d");
let chart;

function initChart() {
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Income",
          data: [],
          borderColor: "#10b981",
          fill: false,
          tension: 0.4
        },
        {
          label: "Expenses",
          data: [],
          borderColor: "#ef4444",
          fill: false,
          tension: 0.4
        },
        {
          label: "Net Cash Flow",
          data: [],
          borderColor: "#3b82f6",
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#fff" } }
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      }
    }
  });
}

// Data
let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let incomes = [];
let expenses = [];

// Render tenants into dropdown + list
function renderTenants() {
  tenantSelects.forEach(select => {
    select.innerHTML = `<option value="">-- Select Tenant --</option>`;
    tenants.forEach(t => {
      const option = document.createElement("option");
      option.value = t;
      option.textContent = t;
      select.appendChild(option);
    });
  });

  tenantList.innerHTML = tenants
    .map(
      t => `
      <li>
        ${t}
        <button class="delete-tenant" data-tenant="${t}">❌</button>
      </li>`
    )
    .join("");

  document.querySelectorAll(".delete-tenant").forEach(btn => {
    btn.addEventListener("click", () => {
      removeTenant(btn.dataset.tenant);
    });
  });
}

// Add tenant
addTenantBtn.addEventListener("click", () => {
  const name = tenantInput.value.trim();
  if (name && !tenants.includes(name)) {
    tenants.push(name);
    localStorage.setItem("tenants", JSON.stringify(tenants));
    tenantInput.value = "";
    renderTenants();
  }
});

// Remove tenant
function removeTenant(name) {
  tenants = tenants.filter(t => t !== name);
  localStorage.setItem("tenants", JSON.stringify(tenants));
  renderTenants();
}

// Add income
incomeForm.addEventListener("submit", e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("income-amount").value);
  const source = document.getElementById("income-source").value;
  const tenant = document.getElementById("income-tenant").value;
  if (!isNaN(amount)) {
    incomes.push({ amount, source, tenant, date: new Date().toLocaleDateString() });
    renderIncomes();
    updateChart();
  }
  incomeForm.reset();
});

// Add expense
expenseForm.addEventListener("submit", e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value;
  const tenant = document.getElementById("expense-tenant").value;
  if (!isNaN(amount)) {
    expenses.push({ amount, category, tenant, date: new Date().toLocaleDateString() });
    renderExpenses();
    updateChart();
  }
  expenseForm.reset();
});

// Render tables
function renderIncomes() {
  incomeTable.innerHTML = incomes
    .map(
      i =>
        `<tr>
          <td>${i.date}</td>
          <td>${i.source}</td>
          <td>${i.tenant}</td>
          <td>$${i.amount.toFixed(2)}</td>
        </tr>`
    )
    .join("");
}

function renderExpenses() {
  expenseTable.innerHTML = expenses
    .map(
      e =>
        `<tr>
          <td>${e.date}</td>
          <td>${e.category}</td>
          <td>${e.tenant}</td>
          <td>$${e.amount.toFixed(2)}</td>
        </tr>`
    )
    .join("");
}

// Update chart
function updateChart() {
  const labels = incomes.map(i => i.date);
  const incomeData = incomes.map(i => i.amount);
  const expenseData = expenses.map(e => e.amount);
  const netData = incomeData.map((val, idx) => val - (expenseData[idx] || 0));

  chart.data.labels = labels;
  chart.data.datasets[0].data = incomeData;
  chart.data.datasets[1].data = expenseData;
  chart.data.datasets[2].data = netData;
  chart.update();
}

// Export CSV
exportCsvBtn.addEventListener("click", () => {
  let csv = "Date,Type,Source/Category,Tenant,Amount\n";
  incomes.forEach(i => {
    csv += `${i.date},Income,${i.source},${i.tenant},${i.amount}\n`;
  });
  expenses.forEach(e => {
    csv += `${e.date},Expense,${e.category},${e.tenant},${e.amount}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "investor_report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Export Graph
exportGraphBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "cashflow_chart.png";
  link.href = chart.toBase64Image();
  link.click();
});

// Save session
saveSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (name) {
    const sessionData = { tenants, incomes, expenses };
    localStorage.setItem(`session-${name}`, JSON.stringify(sessionData));
    alert("Session saved!");
  }
});

// Load session
loadSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (name) {
    const data = localStorage.getItem(`session-${name}`);
    if (data) {
      const { tenants: t, incomes: i, expenses: e } = JSON.parse(data);
      tenants = t;
      incomes = i;
      expenses = e;
      localStorage.setItem("tenants", JSON.stringify(tenants));
      renderTenants();
      renderIncomes();
      renderExpenses();
      updateChart();
      alert("Session loaded!");
    }
  }
});

// Delete session
deleteSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (name) {
    localStorage.removeItem(`session-${name}`);
    alert("Session deleted!");
  }
});

// Init
initChart();
renderTenants();
