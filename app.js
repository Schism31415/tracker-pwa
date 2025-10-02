// ===== GLOBAL STATE =====
let incomes = [];
let expenses = [];
let tenants = [];
let selectedCurrency = "$";

// ===== TENANT MANAGEMENT =====
const tenantList = document.getElementById("tenant-list");
const tenantInputs = document.querySelectorAll(".tenant-select");

document.getElementById("add-tenant").addEventListener("click", () => {
  const newTenant = document.getElementById("new-tenant").value.trim();
  if (newTenant && !tenants.includes(newTenant)) {
    tenants.push(newTenant);
    document.getElementById("new-tenant").value = "";
    updateTenantDropdowns();
    renderTenantList();
  }
});

function updateTenantDropdowns() {
  tenantInputs.forEach(select => {
    select.innerHTML = "";
    tenants.forEach(t => {
      const option = document.createElement("option");
      option.value = t;
      option.textContent = t;
      select.appendChild(option);
    });
  });
}

function renderTenantList() {
  tenantList.innerHTML = "";
  tenants.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      tenants = tenants.filter(x => x !== t);
      updateTenantDropdowns();
      renderTenantList();
    };
    li.appendChild(removeBtn);
    tenantList.appendChild(li);
  });
}

// ===== INCOME FORM =====
document.getElementById("income-form").addEventListener("submit", e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("income-amount").value);
  const source = document.getElementById("income-source").value.trim();
  const tenant = document.getElementById("income-tenant").value || "N/A";

  if (!isNaN(amount) && source) {
    incomes.push({ date: new Date().toLocaleDateString(), source, tenant, amount });
    renderIncomeTable();
    updateChart();
    e.target.reset();
  }
});

function renderIncomeTable() {
  const body = document.getElementById("income-table-body");
  body.innerHTML = "";
  incomes.forEach(inc => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inc.date}</td>
      <td>${inc.source}</td>
      <td>${inc.tenant}</td>
      <td>${selectedCurrency} ${inc.amount.toFixed(2)}</td>
    `;
    body.appendChild(row);
  });
}

// ===== EXPENSE FORM =====
document.getElementById("expense-form").addEventListener("submit", e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value.trim();
  const tenant = document.getElementById("expense-tenant").value || "N/A";

  if (!isNaN(amount) && category) {
    expenses.push({ date: new Date().toLocaleDateString(), category, tenant, amount });
    renderExpenseTable();
    updateChart();
    e.target.reset();
  }
});

function renderExpenseTable() {
  const body = document.getElementById("expense-table-body");
  body.innerHTML = "";
  expenses.forEach(exp => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.category}</td>
      <td>${exp.tenant}</td>
      <td>${selectedCurrency} ${exp.amount.toFixed(2)}</td>
    `;
    body.appendChild(row);
  });
}

// ===== CHART =====
const ctx = document.getElementById("cashflow-chart").getContext("2d");
let cashflowChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Income",
        borderColor: "green",
        backgroundColor: "rgba(0,128,0,0.2)",
        data: [],
        tension: 0.4
      },
      {
        label: "Expenses",
        borderColor: "red",
        backgroundColor: "rgba(255,0,0,0.2)",
        data: [],
        tension: 0.4
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Amount" } },
      x: { title: { display: true, text: "Entries" } }
    }
  }
});

function updateChart() {
  const labels = incomes.map((_, i) => `Entry ${i + 1}`);
  cashflowChart.data.labels = labels;
  cashflowChart.data.datasets[0].data = incomes.map(i => i.amount);
  cashflowChart.data.datasets[1].data = expenses.map(e => e.amount);
  cashflowChart.update();
}

// ===== SESSION MANAGEMENT =====
document.getElementById("save-session").addEventListener("click", () => {
  const name = document.getElementById("session-name").value.trim();
  if (name) {
    const sessionData = { incomes, expenses, tenants, currency: selectedCurrency };
    localStorage.setItem(`session_${name}`, JSON.stringify(sessionData));
    alert("Session saved!");
  }
});

document.getElementById("load-session").addEventListener("click", () => {
  const name = document.getElementById("session-name").value.trim();
  const data = JSON.parse(localStorage.getItem(`session_${name}`));
  if (data) {
    incomes = data.incomes || [];
    expenses = data.expenses || [];
    tenants = data.tenants || [];
    selectedCurrency = data.currency || "$";
    renderIncomeTable();
    renderExpenseTable();
    updateTenantDropdowns();
    renderTenantList();
    updateChart();
    alert("Session loaded!");
  } else {
    alert("No session found!");
  }
});

document.getElementById("delete-session").addEventListener("click", () => {
  const name = document.getElementById("session-name").value.trim();
  localStorage.removeItem(`session_${name}`);
  alert("Session deleted!");
});

// ===== EXPORT CSV =====
document.getElementById("export-csv").addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Date,Type,Category/Source,Tenant,Amount\n";

  incomes.forEach(inc => {
    csvContent += `${inc.date},Income,${inc.source},${inc.tenant},${selectedCurrency} ${inc.amount}\n`;
  });
  expenses.forEach(exp => {
    csvContent += `${exp.date},Expense,${exp.category},${exp.tenant},${selectedCurrency} ${exp.amount}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "investor_dashboard_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ===== EXPORT GRAPH (PNG) =====
document.getElementById("export-graph").addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = cashflowChart.toBase64Image();
  link.download = "cashflow_chart.png";
  link.click();
});

// ===== CURRENCY SELECTION =====
const currencySelect = document.createElement("select");
["$", "£", "€"].forEach(curr => {
  const opt = document.createElement("option");
  opt.value = curr;
  opt.textContent = curr;
  currencySelect.appendChild(opt);
});
currencySelect.addEventListener("change", e => {
  selectedCurrency = e.target.value;
  renderIncomeTable();
  renderExpenseTable();
});
document.querySelector(".container").insertBefore(currencySelect, document.querySelector("section"));
