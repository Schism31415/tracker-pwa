let incomes = [];
let expenses = [];
let sessions = {};
let currency = "£"; // default

// Chart instances
let incomeChart, expenseChart;

// Update charts
function updateCharts() {
  if (!incomeChart) {
    incomeChart = new Chart(document.getElementById("incomeChart"), {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label: "Income",
          data: [],
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#333" } },
          tooltip: { callbacks: {
            label: ctx => `${currency}${ctx.formattedValue}`
          }}
        },
        scales: {
          y: {
            ticks: { callback: value => currency + value }
          }
        }
      }
    });
  }

  if (!expenseChart) {
    expenseChart = new Chart(document.getElementById("expenseChart"), {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label: "Expenses",
          data: [],
          borderColor: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.15)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#333" } },
          tooltip: { callbacks: {
            label: ctx => `${currency}${ctx.formattedValue}`
          }}
        },
        scales: {
          y: {
            ticks: { callback: value => currency + value }
          }
        }
      }
    });
  }

  incomeChart.data.labels = incomes.map((i) => i.date);
  incomeChart.data.datasets[0].data = incomes.map((i) => i.amount);
  incomeChart.update();

  expenseChart.data.labels = expenses.map((e) => e.date);
  expenseChart.data.datasets[0].data = expenses.map((e) => e.amount);
  expenseChart.update();

  renderLists();
}

// Render incomes & expenses with ❌ buttons
function renderLists() {
  const incomeList = document.getElementById("income-list");
  const expenseList = document.getElementById("expense-list");
  incomeList.innerHTML = "";
  expenseList.innerHTML = "";

  incomes.forEach((i, index) => {
    const li = document.createElement("li");
    li.textContent = `${currency}${i.amount} (${i.source}, ${i.date}) `;
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => {
      incomes.splice(index, 1);
      updateCharts();
      autoSave();
    };
    li.appendChild(delBtn);
    incomeList.appendChild(li);
  });

  expenses.forEach((e, index) => {
    const li = document.createElement("li");
    li.textContent = `${currency}${e.amount} (${e.category}, ${e.date}) `;
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => {
      expenses.splice(index, 1);
      updateCharts();
      autoSave();
    };
    li.appendChild(delBtn);
    expenseList.appendChild(li);
  });
}

// Auto-save
function autoSave() {
  localStorage.setItem("autosave", JSON.stringify({ incomes, expenses, currency }));
  document.getElementById("save-status").textContent =
    "Last saved at " + new Date().toLocaleTimeString();
}

// Save session
document.getElementById("save-session").addEventListener("click", () => {
  const sessionName = prompt("Enter session name:");
  if (sessionName) {
    sessions[sessionName] = { incomes, expenses, currency };
    localStorage.setItem("sessions", JSON.stringify(sessions));
    refreshSessions();
  }
});

// Refresh saved sessions
function refreshSessions() {
  const sessionList = document.getElementById("session-list");
  sessionList.innerHTML = "";
  for (let name in sessions) {
    const li = document.createElement("li");
    li.textContent = name;
    li.onclick = () => {
      incomes = sessions[name].incomes || [];
      expenses = sessions[name].expenses || [];
      currency = sessions[name].currency || "£";
      document.getElementById("currency").value = currency;
      updateCharts();
    };
    sessionList.appendChild(li);
  }
}

// Add income
document.getElementById("add-income").addEventListener("click", () => {
  const source = document.getElementById("income-source").value;
  const amount = parseFloat(document.getElementById("income-amount").value);
  const date = document.getElementById("income-date").value;
  if (!amount || !date) return;

  incomes.push({ source, amount, date });
  updateCharts();
  autoSave();
});

// Add expense
document.getElementById("add-expense").addEventListener("click", () => {
  const category = document.getElementById("expense-category").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const date = document.getElementById("expense-date").value;
  if (!amount || !date) return;

  expenses.push({ category, amount, date });
  updateCharts();
  autoSave();
});

// Currency change
document.getElementById("currency").addEventListener("change", (e) => {
  currency = e.target.value;
  updateCharts();
  autoSave();
});

// Restore sessions + autosave
window.onload = () => {
  sessions = JSON.parse(localStorage.getItem("sessions")) || {};
  refreshSessions();

  const autosave = JSON.parse(localStorage.getItem("autosave"));
  if (autosave) {
    incomes = autosave.incomes || [];
    expenses = autosave.expenses || [];
    currency = autosave.currency || "£";
    document.getElementById("currency").value = currency;
    updateCharts();
  } else {
    updateCharts();
  }
};
