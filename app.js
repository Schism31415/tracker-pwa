// Store data in memory
let incomes = [];
let expenses = [];
let sessions = {};

// Chart instances
let cashflowChart, renovationChart;

// Add Income
document.getElementById("add-income").addEventListener("click", () => {
  const source = document.getElementById("income-source").value;
  const amount = parseFloat(document.getElementById("income-amount").value);
  const date = document.getElementById("income-date").value;
  if (!amount || !date) return;

  incomes.push({ source, amount, date });
  updateCharts();
});

// Add Expense
document.getElementById("add-expense").addEventListener("click", () => {
  const category = document.getElementById("expense-category").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const date = document.getElementById("expense-date").value;
  if (!amount || !date) return;

  expenses.push({ category, amount, date });
  updateCharts();
});

// Update Charts
function updateCharts() {
  // Cashflow by month
  const months = {};
  incomes.forEach(i => {
    const m = i.date.slice(0,7);
    months[m] = (months[m] || 0) + i.amount;
  });
  expenses.forEach(e => {
    const m = e.date.slice(0,7);
    months[m] = (months[m] || 0) - e.amount;
  });

  const labels = Object.keys(months).sort();
  const data = labels.map(l => months[l]);

  if (cashflowChart) cashflowChart.destroy();
  cashflowChart = new Chart(document.getElementById("cashflow-chart"), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Net Cash Flow",
        data,
        borderColor: "#ffd700",
        backgroundColor: "rgba(255,215,0,0.2)",
        fill: true
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "#fff" } },
        tooltip: { callbacks: { label: ctx => `$${ctx.raw}` } },
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      }
    }
  });

  // Renovation chart
  if (renovationChart) renovationChart.destroy();
  renovationChart = new Chart(document.getElementById("renovation-chart"), {
    type: 'bar',
    data: {
      labels: expenses.map(e => e.category),
      datasets: [{
        label: "Expenses",
        data: expenses.map(e => e.amount),
        backgroundColor: "#ffd700"
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "#fff" } },
        tooltip: { callbacks: { label: ctx => `$${ctx.raw}` } },
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      }
    }
  });
}

// Save session
document.getElementById("save-session").addEventListener("click", () => {
  const name = document.getElementById("session-name").value;
  if (!name) return;
  sessions[name] = { incomes, expenses };
  localStorage.setItem("sessions", JSON.stringify(sessions));
  refreshSessions();
});

// Load sessions on startup
window.onload = () => {
  sessions = JSON.parse(localStorage.getItem("sessions")) || {};
  refreshSessions();
};

// Refresh dropdown
function refreshSessions() {
  const select = document.getElementById("session-list");
  select.innerHTML = "";
  Object.keys(sessions).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  });
}

// Load session
document.getElementById("load-session").addEventListener("click", () => {
  const name = document.getElementById("session-list").value;
  if (!name) return;
  ({ incomes, expenses } = sessions[name]);
  updateCharts();
});

// Delete session
document.getElementById("delete-session").addEventListener("click", () => {
  const name = document.getElementById("session-list").value;
  if (!name) return;
  delete sessions[name];
  localStorage.setItem("sessions", JSON.stringify(sessions));
  refreshSessions();
});

// Export CSV
document.getElementById("export-csv").addEventListener("click", () => {
  let csv = "Type,Category/Source,Amount,Date\n";
  incomes.forEach(i => csv += `Income,${i.source},${i.amount},${i.date}\n`);
  expenses.forEach(e => csv += `Expense,${e.category},${e.amount},${e.date}\n`);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "session.csv";
  a.click();
});

// Export chart
document.getElementById("export-chart").addEventListener("click", () => {
  const url = document.getElementById("cashflow-chart").toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = "cashflow.png";
  a.click();
});
