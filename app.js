// ===== Investor Pro App.js =====

// ---- Global Variables ----
let tenants = [];
let sessions = JSON.parse(localStorage.getItem("sessions")) || {};
let currentSession = null;

// ---- DOM Elements ----
const incomeForm = document.getElementById("income-form");
const expenseForm = document.getElementById("expense-form");
const tenantSelects = document.querySelectorAll(".tenant-select");
const addTenantBtn = document.getElementById("add-tenant-btn");
const tenantNameInput = document.getElementById("tenant-name-input");

const chartCanvas = document.getElementById("financeChart").getContext("2d");
const saveSessionBtn = document.getElementById("save-session-btn");
const loadSessionSelect = document.getElementById("load-session-select");
const loadSessionBtn = document.getElementById("load-session-btn");
const deleteSessionBtn = document.getElementById("delete-session-btn");
const exportCSVBtn = document.getElementById("export-csv-btn");
const exportChartBtn = document.getElementById("export-chart-btn");

const currencySelect = document.getElementById("currency-select");

// ---- Chart Setup ----
let chartData = {
  labels: [],
  datasets: [
    {
      label: "Income",
      data: [],
      borderColor: "green",
      backgroundColor: "rgba(0,200,0,0.3)",
      fill: true,
      tension: 0.4
    },
    {
      label: "Expenses",
      data: [],
      borderColor: "red",
      backgroundColor: "rgba(200,0,0,0.3)",
      fill: true,
      tension: 0.4
    }
  ]
};

let financeChart = new Chart(chartCanvas, {
  type: "line",
  data: chartData,
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return currencySelect.value + value;
          }
        }
      }
    }
  }
});

// ---- Functions ----
function updateTenantSelects() {
  tenantSelects.forEach(select => {
    select.innerHTML = "";
    tenants.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });
  });
}

function addTenant() {
  const tenantName = tenantNameInput.value.trim();
  if (tenantName && !tenants.includes(tenantName)) {
    tenants.push(tenantName);
    updateTenantSelects();
    tenantNameInput.value = "";
  }
}

function addData(label, income, expense) {
  chartData.labels.push(label);
  chartData.datasets[0].data.push(income);
  chartData.datasets[1].data.push(expense);
  financeChart.update();
}

function saveSession() {
  const sessionName = prompt("Enter session name:");
  if (!sessionName) return;

  const data = {
    tenants,
    chartData,
    currency: currencySelect.value
  };

  sessions[sessionName] = data;
  localStorage.setItem("sessions", JSON.stringify(sessions));
  refreshSessionList();
  currentSession = sessionName;
  alert("Session saved.");
}

function loadSession() {
  const sessionName = loadSessionSelect.value;
  if (!sessionName) return;

  const data = sessions[sessionName];
  tenants = data.tenants;
  chartData = data.chartData;
  currencySelect.value = data.currency;

  financeChart.destroy();
  financeChart = new Chart(chartCanvas, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return currencySelect.value + value;
            }
          }
        }
      }
    }
  });

  updateTenantSelects();
  alert("Session loaded.");
}

function deleteSession() {
  const sessionName = loadSessionSelect.value;
  if (!sessionName) return;

  delete sessions[sessionName];
  localStorage.setItem("sessions", JSON.stringify(sessions));
  refreshSessionList();
  alert("Session deleted.");
}

function refreshSessionList() {
  loadSessionSelect.innerHTML = "";
  Object.keys(sessions).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    loadSessionSelect.appendChild(opt);
  });
}

function exportCSV() {
  let csv = "Label,Income,Expenses\n";
  chartData.labels.forEach((label, i) => {
    csv += `${label},${chartData.datasets[0].data[i]},${chartData.datasets[1].data[i]}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "finance_data.csv";
  a.click();
}

function exportChart() {
  const link = document.createElement("a");
  link.href = financeChart.toBase64Image();
  link.download = "finance_chart.png";
  link.click();
}

// ---- Event Listeners ----
addTenantBtn.addEventListener("click", addTenant);

incomeForm.addEventListener("submit", e => {
  e.preventDefault();
  const tenant = incomeForm.querySelector(".tenant-select").value;
  const amount = parseFloat(incomeForm.querySelector("input[name='amount']").value);
  if (tenant && amount) {
    addData(`${tenant} Income`, amount, 0);
    incomeForm.reset();
  }
});

expenseForm.addEventListener("submit", e => {
  e.preventDefault();
  const tenant = expenseForm.querySelector(".tenant-select").value;
  const amount = parseFloat(expenseForm.querySelector("input[name='amount']").value);
  if (tenant && amount) {
    addData(`${tenant} Expense`, 0, amount);
    expenseForm.reset();
  }
});

saveSessionBtn.addEventListener("click", saveSession);
loadSessionBtn.addEventListener("clic
