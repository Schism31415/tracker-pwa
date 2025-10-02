```javascript
// ----------------- Data & State -----------------
let entries = [];
let tenants = [];
let currentSession = null;
const chartCtx = document.getElementById("cashflowChart").getContext("2d");

// ----------------- Chart -----------------
let cashflowChart = new Chart(chartCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Net Cash Flow",
        data: [],
        borderColor: "#d4af37",
        backgroundColor: "rgba(212,175,55,0.15)",
        tension: 0.4, // smooth curve
        fill: true
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#f0f0f0" }
      }
    },
    scales: {
      x: { ticks: { color: "#f0f0f0" }, grid: { color: "#333" } },
      y: { ticks: { color: "#f0f0f0" }, grid: { color: "#333" } }
    }
  }
});

// ----------------- Elements -----------------
const form = document.getElementById("entry-form");
const tenantSelect = document.getElementById("tenant");
const addTenantBtn = document.getElementById("add-tenant");
const saveSessionBtn = document.getElementById("save-session");
const loadSessionBtn = document.getElementById("load-session");
const deleteSessionBtn = document.getElementById("delete-session");
const exportCsvBtn = document.getElementById("export-csv");
const exportGraphBtn = document.getElementById("export-graph");

// ----------------- Helpers -----------------
function updateTenantDropdown() {
  tenantSelect.innerHTML = '<option value="">Select tenant</option>';
  tenants.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tenantSelect.appendChild(opt);
  });
}

function updateChart() {
  const labels = entries.map(e => e.date);
  const data = entries.map(e =>
    e.type === "income" ? e.amount : -e.amount
  );
  const cumulative = data.reduce((acc, val, i) => {
    acc.push((acc[i - 1] || 0) + val);
    return acc;
  }, []);

  cashflowChart.data.labels = labels;
  cashflowChart.data.datasets[0].data = cumulative;
  cashflowChart.update();
}

function saveToLocalStorage() {
  localStorage.setItem("entries", JSON.stringify(entries));
  localStorage.setItem("tenants", JSON.stringify(tenants));
}

function loadFromLocalStorage() {
  const storedEntries = JSON.parse(localStorage.getItem("entries")) || [];
  const storedTenants = JSON.parse(localStorage.getItem("tenants")) || [];
  entries = storedEntries;
  tenants = storedTenants;
  updateTenantDropdown();
  updateChart();
}

// ----------------- Form Handling -----------------
form.addEventListener("submit", e => {
  e.preventDefault();
  const entry = {
    tenant: tenantSelect.value,
    type: document.getElementById("type").value,
    amount: parseFloat(document.getElementById("amount").value),
    currency: document.getElementById("currency").value,
    source: document.getElementById("source").value,
    date: document.getElementById("date").value
  };
  entries.push(entry);
  saveToLocalStorage();
  updateChart();
  form.reset();
});

// ----------------- Tenant Handling -----------------
// ===== Tenant Management =====
const tenantSelects = document.querySelectorAll(".tenant-select");
const tenantList = document.getElementById("tenant-list");
const addTenantBtn = document.getElementById("add-tenant");
const tenantInput = document.getElementById("new-tenant");

let tenants = JSON.parse(localStorage.getItem("tenants")) || [];

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

  // Show tenants in the sidebar list (optional)
  tenantList.innerHTML = tenants.map(t => `<li>${t}</li>`).join("");
}

addTenantBtn.addEventListener("click", () => {
  const name = tenantInput.value.trim();
  if (name && !tenants.includes(name)) {
    tenants.push(name);
    localStorage.setItem("tenants", JSON.stringify(tenants));
    tenantInput.value = "";
    renderTenants();
  }
});

// Allow tenant removal
function removeTenant(name) {
  tenants = tenants.filter(t => t !== name);
  localStorage.setItem("tenants", JSON.stringify(tenants));
  renderTenants();
}

renderTenants();


// ----------------- Sessions -----------------
saveSessionBtn.addEventListener("click", () => {
  const name = prompt("Name this session:");
  if (name) {
    localStorage.setItem(`session_${name}`, JSON.stringify(entries));
    alert("Session saved!");
  }
});

loadSessionBtn.addEventListener("click", () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("session_"));
  if (keys.length === 0) return alert("No saved sessions.");
  const name = prompt("Enter session name to load:\n" + keys.join("\n"));
  if (name && localStorage.getItem(`session_${name}`)) {
    entries = JSON.parse(localStorage.getItem(`session_${name}`));
    updateChart();
    saveToLocalStorage();
    alert("Session loaded!");
  }
});

deleteSessionBtn.addEventListener("click", () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("session_"));
  if (keys.length === 0) return alert("No saved sessions.");
  const name = prompt("Enter session name to delete:\n" + keys.join("\n"));
  if (name) {
    localStorage.removeItem(`session_${name}`);
    alert("Session deleted!");
  }
});

// ----------------- Export -----------------
exportCsvBtn.addEventListener("click", () => {
  if (entries.length === 0) return alert("No entries to export.");
  let csv = "Tenant,Type,Amount,Currency,Source,Date\n";
  entries.forEach(e => {
    csv += `${e.tenant},${e.type},${e.amount},${e.currency},${e.source},${e.date}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "cashflow.csv";
  link.click();
});

exportGraphBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = cashflowChart.toBase64Image();
  link.download = "cashflow-chart.png";
  link.click();
});

// ----------------- Init -----------------
loadFromLocalStorage();
```

