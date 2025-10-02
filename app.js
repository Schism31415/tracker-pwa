// Data storage
let entries = [];
let tenants = JSON.parse(localStorage.getItem('tenants')) || [];
let savedSessions = JSON.parse(localStorage.getItem('sessions')) || {};

// DOM Elements
const tenantSelect = document.getElementById('tenant');
const addTenantBtn = document.getElementById('add-tenant');
const entryForm = document.getElementById('entry-form');
const overviewChartCanvas = document.getElementById('overviewChart');
const sessionNameInput = document.getElementById('session-name');
const saveSessionBtn = document.getElementById('save-session');
const savedSessionsDiv = document.getElementById('saved-sessions');
const exportCsvBtn = document.getElementById('export-csv');
const exportPdfBtn = document.getElementById('export-pdf');

// Chart instance
let overviewChart;

// Populate tenants
function updateTenantDropdown() {
  tenantSelect.innerHTML = '<option value="">-- Select Tenant --</option>';
  tenants.forEach(t => {
    const option = document.createElement('option');
    option.value = t;
    option.textContent = t;
    tenantSelect.appendChild(option);
  });
}
updateTenantDropdown();

// Add tenant
addTenantBtn.addEventListener('click', () => {
  const newTenant = prompt("Enter new tenant name:");
  if (newTenant && !tenants.includes(newTenant)) {
    tenants.push(newTenant);
    localStorage.setItem('tenants', JSON.stringify(tenants));
    updateTenantDropdown();
  }
});

// Add entry
entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const tenant = tenantSelect.value;
  const income = parseFloat(document.getElementById('income').value) || 0;
  const expense = parseFloat(document.getElementById('expense').value) || 0;
  if (!tenant) return alert("Please select a tenant.");

  entries.push({ tenant, income, expense, date: new Date().toISOString() });
  updateChart();
  entryForm.reset();
});

// Chart rendering
function updateChart() {
  const labels = entries.map((_, i) => `Entry ${i+1}`);
  const incomeData = entries.map(e => e.income);
  const expenseData = entries.map(e => e.expense);

  if (overviewChart) overviewChart.destroy();
  overviewChart = new Chart(overviewChartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Income (£)', data: incomeData, borderColor: 'green', fill: false, tension: 0.4 },
        { label: 'Expense (£)', data: expenseData, borderColor: 'red', fill: false, tension: 0.4 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Save session
saveSessionBtn.addEventListener('click', () => {
  const name = sessionNameInput.value.trim();
  if (!name) return alert("Enter a session name");
  savedSessions[name] = { entries, tenants };
  localStorage.setItem('sessions', JSON.stringify(savedSessions));
  renderSessions();
});

// Render saved sessions
function renderSessions() {
  savedSessionsDiv.innerHTML = '';
  Object.keys(savedSessions).forEach(name => {
    const loadBtn = document.createElement('button');
    loadBtn.textContent = `Load: ${name}`;
    loadBtn.onclick = () => {
      entries = savedSessions[name].entries;
      tenants = savedSessions[name].tenants;
      localStorage.setItem('tenants', JSON.stringify(tenants));
      updateTenantDropdown();
      updateChart();
    };

    const delBtn = document.createElement('button');
    delBtn.textContent = `Delete: ${name}`;
    delBtn.onclick = () => {
      delete savedSessions[name];
      localStorage.setItem('sessions', JSON.stringify(savedSessions));
      renderSessions();
    };

    savedSessionsDiv.appendChild(loadBtn);
    savedSessionsDiv.appendChild(delBtn);
  });
}
renderSessions();

// Export CSV
exportCsvBtn.addEventListener('click', () => {
  let csv = "Tenant,Income,Expense,Date\n";
  entries.forEach(e => {
    csv += `${e.tenant},${e.income},${e.expense},${e.date}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'session.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// Export PDF
exportPdfBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) return alert("PDF library not loaded.");
  const doc = new jsPDF();
  doc.text("Session Data", 10, 10);
  entries.forEach((e, i) => {
    doc.text(`${i+1}. Tenant: ${e.tenant}, Income: £${e.income}, Expense: £${e.expense}`, 10, 20 + i*10);
  });
  doc.save('session.pdf');
});
