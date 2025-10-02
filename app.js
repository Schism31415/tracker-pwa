```javascript
/* app.js - Polished full app logic
 Features:
  - Tenants: add / delete, tenant dropdowns for income/expense
  - Incomes & Expenses: add / delete, tenant association
  - Auto-save to localStorage and auto-restore
  - Sessions: Save / Load / Delete
  - Charts: Income (line), Expense (line), Net (line) — curved + filled
  - Export: CSV download and Chart PNG downloads (each chart separately)
  - Attempts to refresh service worker / force latest install
*/

// ---------- Data & state ----------
let tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
let incomes = JSON.parse(localStorage.getItem("incomes") || "[]");
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let sessions = JSON.parse(localStorage.getItem("sessions") || "{}");
let currency = localStorage.getItem("currency") || "£";

// ---------- Elements (graceful if not present) ----------
const el = id => document.getElementById(id);
const currencySelect = el("currency");
const tenantNameInput = el("tenant-name");
const addTenantBtn = el("add-tenant");
const tenantListEl = el("tenant-list");
const incomeTenantSelect = el("income-tenant");
const incomeSourceEl = el("income-source");
const incomeAmountEl = el("income-amount");
const incomeDateEl = el("income-date");
const addIncomeBtn = el("add-income");
const incomeListEl = el("income-list");
const expenseTenantSelect = el("expense-tenant");
const expenseCategoryEl = el("expense-category");
const expenseAmountEl = el("expense-amount");
const expenseDateEl = el("expense-date");
const addExpenseBtn = el("add-expense");
const expenseListEl = el("expense-list");
const saveSessionBtn = el("save-session");
const sessionListEl = el("session-list");
const exportCsvBtn = el("export-csv");
const saveStatusEl = el("save-status");
const chartsSection = document.querySelector(".charts");

// ---------- Charts (will initialize below) ----------
let incomeChart = null;
let expenseChart = null;
let netChart = null;

// ---------- Helpers ----------
function safeText(v){ return (v===null||v===undefined) ? "" : String(v); }
function to2(n){ return Number(n||0).toFixed(2); }
function downloadBlob(blob, filename){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Persistence ----------
function persistAll(){
  localStorage.setItem("tenants", JSON.stringify(tenants));
  localStorage.setItem("incomes", JSON.stringify(incomes));
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("sessions", JSON.stringify(sessions));
  localStorage.setItem("currency", currency);
  saveStatusEl && (saveStatusEl.textContent = "Last saved: " + new Date().toLocaleTimeString());
}

function autoSave(){
  // same as persistAll but lighter name
  persistAll();
}

// ---------- Tenant UI ----------
function renderTenantUI(){
  // list
  if(tenantListEl){
    tenantListEl.innerHTML = "";
    tenants.forEach((t, i) => {
      const li = document.createElement("li");
      li.textContent = t;
      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "❌";
      del.title = "Remove tenant (existing entries remain)";
      del.onclick = () => {
        tenants.splice(i,1);
        persistAll();
        renderTenantUI();
        populateTenantSelects();
        renderLists();
        updateCharts();
      };
      li.appendChild(del);
      tenantListEl.appendChild(li);
    });
  }
}

function addTenant(name){
  name = safeText(name).trim();
  if(!name) return false;
  tenants.push(name);
  persistAll();
  renderTenantUI();
  populateTenantSelects();
  return true;
}

function populateTenantSelects(){
  const incomeSel = incomeTenantSelect;
  const expenseSel = expenseTenantSelect;
  if(!incomeSel || !expenseSel) return;
  const createOptions = (sel) => {
    sel.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "-- Select Tenant --";
    sel.appendChild(empty);
    tenants.forEach(t => {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      sel.appendChild(o);
    });
  };
  createOptions(incomeSel);
  createOptions(expenseSel);
}

// ---------- Lists (income / expense) ----------
function renderLists(){
  if(incomeListEl){
    incomeListEl.innerHTML = "";
    incomes.forEach((inc, idx) => {
      const li = document.createElement("li");
      li.textContent = `${safeText(inc.tenant)} — ${safeText(inc.source)} : ${currency}${to2(inc.amount)} (${inc.date})`;
      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "❌";
      del.onclick = () => {
        incomes.splice(idx,1);
        autoSave();
        renderLists();
        updateCharts();
      };
      li.appendChild(del);
      incomeListEl.appendChild(li);
    });
  }

  if(expenseListEl){
    expenseListEl.innerHTML = "";
    expenses.forEach((exp, idx) => {
      const li = document.createElement("li");
      li.textContent = `${safeText(exp.tenant)} — ${safeText(exp.category)} : ${currency}${to2(exp.amount)} (${exp.date})`;
      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "❌";
      del.onclick = () => {
        expenses.splice(idx,1);
        autoSave();
        renderLists();
        updateCharts();
      };
      li.appendChild(del);
      expenseListEl.appendChild(li);
    });
  }
}

// ---------- Charts setup & update ----------
function ensureChartCanvases(){
  // incomeChart canvas exists in HTML as id="incomeChart"
  // expenseChart canvas exists in HTML as id="expenseChart"
  // netChart: if not present, we'll create a canvas after expenseChart
  if(!document.getElementById("incomeChart") || !document.getElementById("expenseChart")){
    // can't build charts if missing essential canvases
    return false;
  }
  if(!document.getElementById("netChart")){
    // create netChart canvas below expenseChart
    const c = document.createElement("canvas");
    c.id = "netChart";
    c.style.marginTop = "18px";
    document.getElementById("expenseChart").parentNode.appendChild(c);
  }
  return true;
}

function initCharts(){
  if(!ensureChartCanvases()) return;
  const incCtx = document.getElementById("incomeChart").getContext("2d");
  const expCtx = document.getElementById("expenseChart").getContext("2d");
  const netCtx = document.getElementById("netChart").getContext("2d");

  const commonOpts = {
    type: 'line',
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#333' } },
        tooltip: {
          callbacks: {
            label: ctx => `${currency}${ctx.formattedValue}`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#333' } },
        y: { ticks: { callback: v => currency + v, color: '#333' } }
      }
    }
  };

  if(!incomeChart){
    incomeChart = new Chart(incCtx, {
      data: { labels: [], datasets: [{ label: 'Income', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.14)', fill: true, tension: 0.4 }]},
      options: commonOpts.options
    });
  }

  if(!expenseChart){
    expenseChart = new Chart(expCtx, {
      data: { labels: [], datasets: [{ label: 'Expenses', data: [], borderColor: '#f44336', backgroundColor: 'rgba(244,67,54,0.12)', fill: true, tension: 0.4 }]},
      options: commonOpts.options
    });
  }

  if(!netChart){
    netChart = new Chart(netCtx, {
      data: { labels: [], datasets: [{ label: 'Net', data: [], borderColor: '#ffd700', backgroundColor: 'rgba(255,215,0,0.12)', fill: true, tension: 0.4 }]},
      options: commonOpts.options
    });
  }
}

function updateCharts(){
  if(!ensureChartCanvases()) return;
  if(!incomeChart || !expenseChart || !netChart) initCharts();

  // aggregate by date (YYYY-MM)
  const incByDate = {};
  incomes.forEach(i => { incByDate[i.date] = (incByDate[i.date] || 0) + Number(i.amount); });
  const expByDate = {};
  expenses.forEach(e => { expByDate[e.date] = (expByDate[e.date] || 0) + Number(e.amount); });

  // set of dates (sorted)
  const allDates = Array.from(new Set([...Object.keys(incByDate), ...Object.keys(expByDate)])).sort();

  const incValues = allDates.map(d => to2(incByDate[d] || 0));
  const expValues = allDates.map(d => to2(expByDate[d] || 0));
  // net is cumulative net over time (income - expense cumulative)
  let cumulative = 0;
  const netValues = allDates.map((d, i) => {
    cumulative += (Number(incByDate[d] || 0) - Number(expByDate[d] || 0));
    return to2(cumulative);
  });

  incomeChart.data.labels = allDates;
  incomeChart.data.datasets[0].data = incValues;
  incomeChart.update();

  expenseChart.data.labels = allDates;
  expenseChart.data.datasets[0].data = expValues;
  expenseChart.update();

  netChart.data.labels = allDates;
  netChart.data.datasets[0].data = netValues;
  netChart.update();

  renderLists();
  renderTenantSummary();
  persistAll();
}

// ---------- Tenant Summary ----------
function renderTenantSummary(){
  const container = document.getElementById("tenant-summary-cards");
  if(!container) return;
  container.innerHTML = "";

  tenants.forEach(t => {
    const totalIncome = incomes.filter(i=>i.tenant===t).reduce((s,x)=>s+Number(x.amount),0);
    const totalExpense = expenses.filter(e=>e.tenant===t).reduce((s,x)=>s+Number(x.amount),0);
    const net = totalIncome - totalExpense;

    const card = document.createElement("div");
    card.className = "tenant-card";
    card.innerHTML = `
      <h3>${t}</h3>
      <p class="income">Income: ${currency}${to2(totalIncome)}</p>
      <p class="expense">Expenses: ${currency}${to2(totalExpense)}</p>
      <p class="net">Net: ${currency}${to2(net)}</p>
    `;
    container.appendChild(card);
  });
}

// ---------- Sessions (save/load/delete) ----------
function renderSessions(){
  if(!sessionListEl) return;
  sessionListEl.innerHTML = "";
  Object.keys(sessions).forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Load";
    loadBtn.onclick = () => {
      const s = sessions[name];
      if(!s) return;
      tenants = s.tenants || [];
      incomes = s.incomes || [];
      expenses = s.expenses || [];
      currency = s.currency || currency;
      if(currencySelect) currencySelect.value = currency;
      populateTenantSelects();
      renderTenantUI();
      renderLists();
      updateCharts();
      persistAll();
    };
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => {
      delete sessions[name];
      persistAll();
      renderSessions();
    };
    li.appendChild(loadBtn);
    li.appendChild(delBtn);
    sessionListEl.appendChild(li);
  });
}

if(saveSessionBtn){
  saveSessionBtn.onclick = () => {
    const name = prompt("Enter a name for this session:");
    if(!name) return;
    sessions[name] = { tenants: tenants.slice(), incomes: incomes.slice(), expenses: expenses.slice(), currency };
    persistAll();
    renderSessions();
  };
}
renderSessions();

// ---------- Export CSV & Charts ----------
if(exportCsvBtn){
  exportCsvBtn.onclick = () => {
    // produce CSV
    const rows = [["Type","Tenant","Category/Source","Amount","Date"]];
    incomes.forEach(i => rows.push(["Income", i.tenant||"", i.source||"", to2(i.amount), i.date]));
    expenses.forEach(e => rows.push(["Expense", e.tenant||"", e.category||"", to2(e.amount), e.date]));
    const csv = rows.map(r => r.map(s=>`"${String(s).replace(/"/g,'""')}"`).join(",")).join("\n");
    downloadBlob(new Blob([csv],{type:"text/csv"}), "investor_data.csv");
  };
}

// Create an "Export Charts" button if not present, placed next to exportCsvBtn
function ensureExportChartsButton(){
  if(document.getElementById("export-charts")) return;
  const container = exportCsvBtn ? exportCsvBtn.parentNode : null;
  const btn = document.createElement("button");
  btn.id = "export-charts";
  btn.textContent = "Export Charts (PNG)";
  btn.onclick = () => {
    // export each chart separately
    const charts = [
      { c: incomeChart, name: "income_chart.png" },
      { c: expenseChart, name: "expense_chart.png" },
      { c: netChart, name: "net_chart.png" }
    ];
    charts.forEach(ch => {
      try {
        const url = ch.c.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = ch.name;
        a.click();
      } catch (err) {
        console.warn("Chart export failed", err);
      }
    });
  };
  if(container) container.parentNode.insertBefore(btn, container.nextSibling);
}
ensureExportChartsButton();

// ---------- Wiring: Add tenant/income/expense ----------
if(addTenantBtn){
  addTenantBtn.onclick = () => {
    const name = tenantNameInput.value.trim();
    if(!name){ alert("Enter a tenant name"); return; }
    addTenant(name);
    tenantNameInput.value = "";
  };
}

// Add income
if(addIncomeBtn){
  addIncomeBtn.onclick = () => {
    const tenant = incomeTenantSelect ? incomeTenantSelect.value : "";
    const source = incomeSourceEl ? incomeSourceEl.value.trim() : "";
    const amount = incomeAmountEl ? parseFloat(incomeAmountEl.value) : 0;
    const date = incomeDateEl ? incomeDateEl.value : "";
    if(!date || !amount){ alert("Please enter date and amount"); return; }
    incomes.push({ tenant, source, amount: Number(amount), date });
    // clear inputs
    if(incomeSourceEl) incomeSourceEl.value = "";
    if(incomeAmountEl) incomeAmountEl.value = "";
    if(incomeDateEl) incomeDateEl.value = "";
    autoSave(); renderLists(); updateCharts();
  };
}

// Add expense
if(addExpenseBtn){
  addExpenseBtn.onclick = () => {
    const tenant = expenseTenantSelect ? expenseTenantSelect.value : "";
    const category = expenseCategoryEl ? expenseCategoryEl.value.trim() : "";
    const amount = expenseAmountEl ? parseFloat(expenseAmountEl.value) : 0;
    const date = expenseDateEl ? expenseDateEl.value : "";
    if(!date || !amount){ alert("Please enter date and amount"); return; }
    expenses.push({ tenant, category, amount: Number(amount), date });
    if(expenseCategoryEl) expenseCategoryEl.value = "";
    if(expenseAmountEl) expenseAmountEl.value = "";
    if(expenseDateEl) expenseDateEl.value = "";
    autoSave(); renderLists(); updateCharts();
  };
}

// Currency select
if(currencySelect){
  currencySelect.value = currency;
  currencySelect.onchange = (e) => {
    currency = e.target.value;
    localStorage.setItem("currency", currency);
    updateCharts();
    renderLists();
    renderTenantSummary();
  };
}

// ---------- Service Worker refresh helper ----------
if('serviceWorker' in navigator){
  // attempt to register and update to ensure latest SW is active
  navigator.serviceWorker.register('sw.js').then(reg => {
    // try to update when we can
    if (reg.update) reg.update();
  }).catch(()=>{/*ignore*/});
}

// ---------- Init on load ----------
window.addEventListener('load', () => {
  populateTenantSelects();
  renderTenantUI();
  renderLists();
  initCharts();
  updateCharts();
  renderSessions();
});
```
