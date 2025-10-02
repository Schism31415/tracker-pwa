document.addEventListener("DOMContentLoaded", () => {
  const tenantInput = document.getElementById("tenantInput");
  const addTenantBtn = document.getElementById("addTenant");
  const removeTenantBtn = document.getElementById("removeTenant");
  const tenantSelect = document.getElementById("tenant");

  const incomeForm = document.getElementById("incomeForm");
  const expenseForm = document.getElementById("expenseForm");
  const incomeChartEl = document.getElementById("incomeChart");
  const expenseChartEl = document.getElementById("expenseChart");

  const saveSessionBtn = document.getElementById("saveSession");
  const loadSessionBtn = document.getElementById("loadSession");
  const deleteSessionBtn = document.getElementById("deleteSession");
  const sessionNameInput = document.getElementById("sessionName");
  const sessionSelect = document.getElementById("session");

  let tenants = [];
  let incomes = {};
  let expenses = {};

  // Add Tenant
  addTenantBtn.addEventListener("click", () => {
    const tenant = tenantInput.value.trim();
    if (tenant && !tenants.includes(tenant)) {
      tenants.push(tenant);
      const option = document.createElement("option");
      option.value = tenant;
      option.textContent = tenant;
      tenantSelect.appendChild(option);
      incomes[tenant] = [];
      expenses[tenant] = [];
      tenantInput.value = "";
    }
  });

  // Remove Tenant
  removeTenantBtn.addEventListener("click", () => {
    const tenant = tenantSelect.value;
    if (tenant) {
      tenants = tenants.filter(t => t !== tenant);
      incomes[tenant] = [];
      expenses[tenant] = [];
      [...tenantSelect.options].forEach(opt => {
        if (opt.value === tenant) opt.remove();
      });
    }
  });

  // Charts setup
  const incomeChart = new Chart(incomeChartEl, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Income", data: [], borderColor: "#4caf50", fill: false }] }
  });

  const expenseChart = new Chart(expenseChartEl, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Expenses", data: [], borderColor: "#f44336", fill: false }] }
  });

  // Add Income
  incomeForm.addEventListener("submit", e => {
    e.preventDefault();
    const tenant = tenantSelect.value;
    const amount = parseFloat(document.getElementById("incomeAmount").value);
    if (tenant && amount) {
      incomes[tenant].push(amount);
      updateCharts();
      incomeForm.reset();
    }
  });

  // Add Expense
  expenseForm.addEventListener("submit", e => {
    e.preventDefault();
    const tenant = tenantSelect.value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    if (tenant && amount) {
      expenses[tenant].push(amount);
      updateCharts();
      expenseForm.reset();
    }
  });

  // Update charts
  function updateCharts() {
    const tenant = tenantSelect.value;
    if (!tenant) return;

    incomeChart.data.labels = incomes[tenant].map((_, i) => `Entry ${i + 1}`);
    incomeChart.data.datasets[0].data = incomes[tenant];
    incomeChart.update();

    expenseChart.data.labels = expenses[tenant].map((_, i) => `Entry ${i + 1}`);
    expenseChart.data.datasets[0].data = expenses[tenant];
    expenseChart.update();
  }

  // Session Save
  saveSessionBtn.addEventListener("click", () => {
    const name = sessionNameInput.value.trim();
    if (name) {
      const data = { tenants, incomes, expenses };
      localStorage.setItem(name, JSON.stringify(data));

      if (![...sessionSelect.options].some(opt => opt.value === name)) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        sessionSelect.appendChild(option);
      }
      sessionNameInput.value = "";
    }
  });

  // Session Load
  loadSessionBtn.addEventListener("click", () => {
    const name = sessionSelect.value;
    if (name) {
      const data = JSON.parse(localStorage.getItem(name));
      tenants = data.tenants;
      incomes = data.incomes;
      expenses = data.expenses;

      tenantSelect.innerHTML = "";
      tenants.forEach(t => {
        const option = document.createElement("option");
        option.value = t;
        option.textContent = t;
        tenantSelect.appendChild(option);
      });
      updateCharts();
    }
  });

  // Session Delete
  deleteSessionBtn.addEventListener("click", () => {
    const name = sessionSelect.value;
    if (name) {
      localStorage.removeItem(name);
      [...sessionSelect.options].forEach(opt => {
        if (opt.value === name) opt.remove();
      });
    }
  });
});
