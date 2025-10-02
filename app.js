// ==========================
// Global Currency Handling
// ==========================
let currencySymbol = localStorage.getItem("currencySymbol") || "$";
document.getElementById("currencySelector").value = currencySymbol;

function updateCurrencyLabels() {
  document.querySelectorAll(".currency-output").forEach(el => {
    el.textContent = currencySymbol;
  });
}

document.getElementById("currencySelector").addEventListener("change", (e) => {
  currencySymbol = e.target.value;
  localStorage.setItem("currencySymbol", currencySymbol);
  updateCurrencyLabels();
  updateCharts();
});

updateCurrencyLabels();

// ==========================
// Cash Flow Tracker
// ==========================
const cashFlowCtx = document.getElementById("cashFlowChart").getContext("2d");
let cashFlowData = {
  labels: [],
  datasets: [
    {
      label: "Income",
      data: [],
      borderColor: "green",
      backgroundColor: "rgba(0,255,0,0.2)",
      fill: true,
      tension: 0.3
    },
    {
      label: "Expenses",
      data: [],
      borderColor: "red",
      backgroundColor: "rgba(255,0,0,0.2)",
      fill: true,
      tension: 0.3
    }
  ]
};

let cashFlowChart = new Chart(cashFlowCtx, {
  type: "line",
  data: cashFlowData,
  options: {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${currencySymbol}${context.formattedValue}`
        }
      }
    }
  }
});

document.getElementById("cashFlowForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const income = parseFloat(document.getElementById("income").value) || 0;
  const expense = parseFloat(document.getElementById("expense").value) || 0;
  const category = document.getElementById("expenseCategory").value;

  let month = `Month ${cashFlowData.labels.length + 1}`;
  cashFlowData.labels.push(month);
  cashFlowData.datasets[0].data.push(income);
  cashFlowData.datasets[1].data.push(expense);

  cashFlowChart.update();
  e.target.reset();
});

// ==========================
// Renovation Tracker
// ==========================
const renoCtx = document.getElementById("renoChart").getContext("2d");
let renoData = {
  labels: [],
  datasets: [
    {
      label: "Budget",
      data: [],
      borderColor: "blue",
      backgroundColor: "rgba(0,0,255,0.2)",
      fill: true,
      tension: 0.3
    },
    {
      label: "Actual",
      data: [],
      borderColor: "orange",
      backgroundColor: "rgba(255,165,0,0.2)",
      fill: true,
      tension: 0.3
    }
  ]
};

let renoChart = new Chart(renoCtx, {
  type: "line",
  data: renoData,
  options: {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${currencySymbol}${context.formattedValue}`
        }
      }
    }
  }
});

document.getElementById("renoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const category = document.getElementById("renoCategory").value;
  const budget = parseFloat(document.getElementById("renoBudget").value) || 0;
  const actual = parseFloat(document.getElementById("renoActual").value) || 0;

  renoData.labels.push(category + " " + (renoData.labels.length + 1));
  renoData.datasets[0].data.push(budget);
  renoData.datasets[1].data.push(actual);

  renoChart.update();
  e.target.reset();
});

// ==========================
// Utility: Update charts when currency changes
// ==========================
function updateCharts() {
  cashFlowChart.options.plugins.tooltip.callbacks.label = (context) => `${currencySymbol}${context.formattedValue}`;
  renoChart.options.plugins.tooltip.callbacks.label = (context) => `${currencySymbol}${context.formattedValue}`;
  cashFlowChart.update();
  renoChart.update();
}
