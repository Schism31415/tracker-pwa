/* ===== app.js — Premium PWA logic ===== */

/* ---------- GLOBAL STATE ---------- */
let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];
let sessions = JSON.parse(localStorage.getItem("sessions")) || {};
let currentSession = null;
let currency = localStorage.getItem("currency") || "£";

/* ---------- DOM HELPERS ---------- */
const $ = id => document.getElementById(id);

/* ---------- TENANT MANAGEMENT ---------- */
function renderTenantOptions() {
  const tenantSelects = document.querySelectorAll(".tenant-select");
  tenantSelects.forEach(sel => {
    sel.innerHTML = `<option value="">Select tenant</option>`;
    tenants.forEach(t => {
      let opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      sel.appendChild(opt);
    });
  });
  // render tenant list in settings
  const list = $("tenant-list");
  if (list) {
    list.innerHTML = "";
    tenants.forEach(t => {
      let li = document.createElement("li");
      li.textContent = t;
      let btn = document.createElement("button");
      btn.textContent = "×";
      btn.onclick = () => removeTenant(t);
      li.appendChild(btn);
      list.appendChild(li);
    });
  }
}

function addTenant() {
  const name = $("tenant-name").value.trim();
  if (name && !tenants.includes(name)) {
    tenants.push(name);
    localStorage.setItem("tenants", JSON.stringify(tenants));
    $("tenant-name").value = "";
    renderTenantOptions();
  }
}

function removeTenant(name) {
  tenants = tenants.filter(t => t !== name);
  localStorage.setItem("tenants", JSON.stringify(tenants));
  renderTenantOptions();
}

/* ---------- ENTRY MANAGEMENT ---------- */
function addEntry(type) {
  const amount = parseFloat($(`${type}-amount`).value);
  const source = $(`${type}-source`).value.trim();
  const tenant = $(`${type}-tenant`).value;
  if (!amount || !tenant) return;

  const entry = { type, amount, source, tenant, date: new Date().toISOString() };
  entries.push(entry);
  persistDraft();
  renderEntries();
  renderCharts();
  clearEntryForm(type);
}

function clearEntryForm(type) {
  $(`${type}-amount`).value = "";
  $(`${type}-source`).value = "";
  $(`${type}-tenant`).value = "";
}

function renderEntries() {
  const table = $("entries-table");
  if (!table) return;
  table.innerHTML = `
    <tr>
      <th>Date</th><th>Type</th><th>Tenant</th><th>Source</th><th>Amount</th><th></th>
    </tr>`;
  entries.forEach((e, i) => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>${e.type}</td>
      <td>${e.tenant}</td>
      <td>${e.source}</td>
      <td>${currency}${e.amount.toFixed(2)}</td>
      <td><button onclick="removeEntry(${i})">×</button></td>`;
    table.appendChild(tr);
  });
}

function removeEntry(idx) {
  entries.splice(idx, 1);
  persistDraft();
  renderEntries();
  renderCharts();
}

/* ---------- CURRENCY ---------- */
function setCurrency(val) {
  currency = val;
  localStorage.setItem("currency", val);
  renderEntries();
  renderCharts();
}

/* ---------- SESSIONS ---------- */
function saveSession() {
  const name = prompt("Enter session name:");
  if (!name) return;
  sessions[name] = { entries, tenants, currency };
  localStorage.setItem("sessions", JSON.stringify(sessions));
  currentSession = name;
  renderSessions();
}

function loadSession(name) {
  const s = sessions[name];
  if (!s) return;
  entries = s.entries;
  tenants = s.tenants;
  currency = s.currency;
  localStorage.setItem("currency", currency);
  currentSession = name;
  renderTenantOptions();
  renderEntries();
  renderCharts();
  renderSessions();
}

function deleteSession(name) {
  if (confirm(`Delete session "${name}"?`)) {
    delete sessions[name];
    localStorage.setItem("sessions", JSON.stringify(sessions));
    if (currentSession === name) {
      entries = [];
      tenants = [];
      currentSession = null;
    }
    renderTenantOptions();
    renderEntries();
    renderCharts();
    renderSessions();
  }
}

function renderSessions() {
  const list = $("session-list");
  if (!list) return;
  list.innerHTML = "";
  Object.keys(sessions).forEach(name => {
    let li = document.createElement("li");
    li.textContent = name;
    let loadBtn = document.createElement("button");
    loadBtn.textContent = "Load";
    loadBtn.onclick = () => loadSession(name);
    let delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteSession(name);
    li.appendChild(loadBtn);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

/* ---------- EXPORT ---------- */
function exportCSV() {
  let csv = "Date,Type,Tenant,Source,Amount\n";
  entries.forEach(e => {
    csv += `${e.date},${e.type},${e.tenant},${e.source},${e.amount}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "session.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  const w = window.open("", "_blank");
  w.document.write("<h1>Session Export</h1>");
  w.document.write("<table border='1' cellspacing='0' cellpadding='6'>");
  w.document.write("<tr><th>Date</th><th>Type</th><th>Tenant</th><th>Source</th><th>Amount</th></tr>");
  entries.forEach(e => {
    w.document.write(`<tr>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>${e.type}</td>
      <td>${e.tenant}</td>
      <td>${e.source}</td>
      <td>${currency}${e.amount.toFixed(2)}</td>
    </tr>`);
  });
  w.document.write("</table>");
  w.print();
  w.close();
}

/* ---------- CHARTS ---------- */
let incomeChart, expenseChart;
function renderCharts() {
  const incomeData = entries.filter(e => e.type === "income");
  const expenseData = entries.filter(e => e.type === "expense");

  // income chart
  if ($("income-chart")) {
    if (incomeChart) incomeChart.destroy();
    incomeChart = new Chart($("income-chart"), {
      type: "line",
      data: {
        labels: incomeData.map(e => new Date(e.date).toLocaleDateString()),
        datasets: [{
          label: "Income",
          data: incomeData.map(e => e.amount),
          borderColor: "#1a73e8",
          backgroundColor: "rgba(26,115,232,0.2)",
          fill: true,
          tension: 0.4
        }]
      }
    });
  }

  // expense chart
  if ($("expense-chart")) {
    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart($("expense-chart"), {
      type: "bar",
      data: {
        labels: expenseData.map(e => new Date(e.date).toLocaleDateString()),
        datasets: [{
          label: "Expenses",
          data: expenseData.map(e => e.amount),
          backgroundColor: "#ef4444",
          borderRadius: 6
        }]
      }
    });
  }
}

/* ---------- AUTO-DRAFT ---------- */
function persistDraft() {
  localStorage.setItem("entries", JSON.stringify(entries));
  localStorage.setItem("tenants", JSON.stringify(tenants));
}

/* ---------- INIT ---------- */
window.addEventListener("DOMContentLoaded", () => {
  renderTenantOptions();
  renderEntries();
  renderCharts();
  renderSessions();
  $("add-tenant-btn")?.addEventListener("click", addTenant);
  $("save-session-btn")?.addEventListener("click", saveSession);
  $("export-csv-btn")?.addEventListener("click", exportCSV);
  $("export-pdf-btn")?.addEventListener("click", exportPDF);
  $("currency-select")?.addEventListener("change", e => setCurrency(e.target.value));
});
