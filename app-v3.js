// =========================
// Premium Investor App - app.js
// =========================

// Global State
let tenants = [];
let sessions = {};

// Chart instances
let incomeChart, expenseChart;

// DOM Elements
const tenantSelect = document.getElementById("tenantSelect");
const addTenantBtn = document.getElementById("addTenantBtn");
const newTenantInput = document.getElementById("newTenant");

const saveSessionBtn = document.getElementById("saveSessionBtn");
const loadSessionBtn = document.getElementById("loadSessionBtn");
const deleteSessionBtn = document.getElementById("deleteSessionBtn");
const sessionNameInput = document.getElementById("sessionName");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

// =========================
// Tenant Handling
// =========================
function updateTenantDropdown() {
  tenantSelect.innerHTML = "";
  tenants.forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.textContent = t;
    tenantSelect.appendChild(option);
  });
}

addTenantBtn.addEventListener("click", () => {
  const newTenant = newTenantInput.value.trim();
  if (newTenant && !tenants.includes(newTenant)) {
    tenants.push(newTenant);
    updateTenantDropdown();
    newTenantInput.value = "";
  }
});

// =========================
// Chart Setup
// =========================
function initCharts() {
  const incomeCtx = document.getElementById("incomeChart").getContext("2d");
  const expenseCtx = document.getElementById("expenseChart").getContext("2d");

  incomeChart = new Chart(incomeCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Income",
        data: [],
        borderColor: "#ffd700",
        backgroundColor: "rgba(255, 215, 0, 0.2)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#ffd700" } } },
      scales: {
        x: { ticks: { color: "#ffd700" }, grid: { color: "rgba(255,255,255,0.2)" } },
        y: { ticks: { color: "#ffd700" }, grid: { color: "rgba(255,255,255,0.2)" } }
      }
    }
  });

  expenseChart = new Chart(expenseCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Expenses",
        data: [],
        borderColor: "#ff4d4d",
        backgroundColor: "rgba(255, 77, 77, 0.2)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#ffd700" } } },
      scales: {
        x: { ticks: { color: "#ffd700" }, grid: { color: "rgba(255,255,255,0.2)" } },
        y: { ticks: { color: "#ffd700" }, grid: { color: "rgba(255,255,255,0.2)" } }
      }
    }
  });
}

// =========================
// Update Charts
// =========================
function updateCharts(income, expense, label) {
  if (!incomeChart || !expenseChart) initCharts();

  // Add data
  incomeChart.data.labels.push(label);
  incomeChart.data.datasets[0].data.push(income);
  incomeChart.update();

  expenseChart.data.labels.push(label);
  expenseChart.data.datasets[0].data.push(expense);
  expenseChart.update();
}

// =========================
// Session Handling
// =========================
saveSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (!name) {
    alert("Please enter a session name.");
    return;
  }
  sessions[name] = {
    tenants: [...tenants],
    incomeData: [...incomeChart.data.datasets[0].data],
    expenseData: [...expenseChart.data.datasets[0].data],
    labels: [...incomeChart.data.labels]
  };
  localStorage.setItem("sessions", JSON.stringify(sessions));
  alert("Session saved!");
});

loadSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (!name || !sessions[name]) {
    alert("No such session found.");
    return;
  }
  const session = sessions[name];
  tenants = [...session.tenants];
  updateTenantDropdown();

  incomeChart.data.labels = [...session.labels];
  incomeChart.data.datasets[0].data = [...session.incomeData];
  incomeChart.update();

  expenseChart.data.labels = [...session.labels];
  expenseChart.data.datasets[0].data = [...session.expenseData];
  expenseChart.update();
  alert("Session loaded!");
});

deleteSessionBtn.addEventListener("click", () => {
  const name = sessionNameInput.value.trim();
  if (!name || !sessions[name]) {
    alert("No such session to delete.");
    return;
  }
  delete sessions[name];
  localStorage.setItem("sessions", JSON.stringify(sessions));
  alert("Session deleted!");
});

// =========================
// Export Functions
// =========================
exportCsvBtn.addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8,Label,Income,Expenses\n";
  const labels = incomeChart.data.labels;
  const incomeData = incomeChart.data.datasets[0].data;
  const expenseData = expenseChart.data.datasets[0].data;

  labels.forEach((label, i) => {
    csvContent += `${label},${incomeData[i]},${expenseData[i]}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "session_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

exportPdfBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Session Report", 14, 20);

  let y = 40;
  const labels = incomeChart.data.labels;
  const incomeData = incomeChart.data.datasets[0].data;
  const expenseData = expenseChart.data.datasets[0].data;

  labels.forEach((label, i) => {
    doc.text(`${label}: Income = ${incomeData[i]}, Expenses = ${expenseData[i]}`, 14, y);
    y += 10;
  });

  doc.save("session_report.pdf");
});

// =========================
// Init
// =========================
window.onload = () => {
  const savedSessions = JSON.parse(localStorage.getItem("sessions"));
  if (savedSessions) sessions = savedSessions;
  initCharts();
};
