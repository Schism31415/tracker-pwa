// ====== GLOBAL STATE ======
let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];
let currentCurrency = "£";

// ====== ELEMENTS ======
const tenantForm = document.getElementById("tenant-form");
const tenantNameInput = document.getElementById("tenant-name");
const tenantList = document.getElementById("tenant-list");
const tenantSelect = document.getElementById("tenant-select");

const entryForm = document.getElementById("entry-form");
const amountInput = document.getElementById("amount");
const typeSelect = document.getElementById("type");
const currencySelect = document.getElementById("currency-select");
const entriesTableBody = document.querySelector("#entries-table tbody");

const saveSessionBtn = document.getElementById("save-session");
const loadSessionBtn = document.getElementById("load-session");
const deleteSessionBtn = document.getElementById("delete-session");
const exportCsvBtn = document.getElementById("export-csv");
const exportChartBtn = document.getElementById("export-chart");

let financeChart;

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  renderTenants();
  renderEntries();
  updateChart();
});

// ====== TENANTS ======
tenantForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const tenantName = tenantNameInput.value.trim();
  if (tenantName && !tenants.includes(tenantName)) {
    tenants.push(tenantName);
    localStorage.setItem("tenants", JSON.stringify(tenants));
    tenantNameInput.value = "";
    renderTenants();
  }
});

function renderTenants() {
  // Update tenant list
  tenantList.innerHTML = "";
  tenants.forEach((tenant) => {
    const li = document.createElement("li");
    li.textContent = tenant;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      tenants = tenants.filter((t) => t !== tenant);
      localStorage.setItem("tenants", JSON.stringify(tenants));
      renderTenants();
      renderEntries();
    };

    li.appendChild(removeBtn);
    tenantList.appendChild(li);
  });

  // Update tenant dropdown
  tenantSelect.innerHTML = `<option value="">Select tenant</option>`;
  tenants.forEach((tenant) => {
    const option = document.createElement("option");
    option.value = tenant;
    option.textContent = tenant;
    tenantSelect.appendChild(option);
  });
}

// ====== ENTRIES ======
entryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const tenant = tenantSelect.value;
  const amount = parseFloat(amountInput.value);
  const type = typeSelect.value;
  const currency = currencySelect.value;

  if (!tenant || isNaN(amount)) return;

  const entry = {
    tenant,
    amount,
    type,
    currency,
    date: new Date().toLocaleDateString(),
  };

  entries.push(entry);
  localStorage.setItem("entries", JSON.stringify(entries));
  renderEntries();
  updateChart();

  entryForm.reset();
});

function renderEntries() {
  entriesTableBody.innerHTML = "";
  entries.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.tenant}</td>
      <td>${entry.type}</td>
      <td>${entry.amount.toFixed(2)}</td>
      <td>${entry.currency}</td>
      <td>${entry.date}</td>
      <td><button onclick="deleteEntry(${index})">Remove</button></td>
    `;
    entriesTableBody.appendChild(row);
  });
}

function deleteEntry(index) {
  entries.splice(index, 1);
  localStorage.setItem("entries", JSON.stringify(entries));
  renderEntries();
  updateChart();
}

// ====== SESSIONS ======
saveSessionBtn.addEventListener("click", () => {
  localStorage.setItem("savedSession", JSON.stringify(entries));
  alert("Session saved!");
});

loadSessionBtn.addEventListener("click", () => {
  const saved = JSON.parse(localStorage.getItem("savedSession"));
  if (saved) {
    entries = saved;
    localStorage.setItem("entries", JSON.stringify(entries));
    renderEntries();
    updateChart();
    alert("Session loaded!");
  } else {
    alert("No saved session found.");
  }
});

deleteSessionBtn.addEventListener("click", () => {
  localStorage.removeItem("savedSession");
  alert("Saved session deleted.");
});

// ====== EXPORT CSV ======
exportCsvBtn.addEventListener("click", () => {
  if (!entries.length) {
    alert("No data to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Tenant,Type,Amount,Currency,Date\n";
  entries.forEach((e) => {
    csvContent += `${e.tenant},${e.type},${e.amount},${e.currency},${e.date}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "finance_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ====== EXPORT CHART (PNG) ======
exportChartBtn.addEventListener("click", () => {
  if (!financeChart) {
    alert("No chart available to export.");
    return;
  }
  const link = document.createElement("a");
  link.href = financeChart.toBase64Image();
  link.download = "finance_chart.png";
  link.click();
});

// ====== CHART ======
function updateChart() {
  const labels = entries.map((e) => e.date);
  const incomeData = entries.map((e) => (e.type === "income" ? e.amount : 0));
  const expenseData = entries.map((e) => (e.type === "expense" ? e.amount : 0));

  const ctx = document.getElementById("financeChart").getContext("2d");
  if (financeChart) financeChart.destroy();

  financeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          borderColor: "#28a745",
          backgroundColor: "rgba(40,167,69,0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Expenses",
          data: expenseData,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220,53,69,0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return currentCurrency + value;
            },
          },
        },
      },
    },
  });
}
