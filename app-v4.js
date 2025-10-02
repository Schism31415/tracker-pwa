let incomeExpenseChart;
let cashFlowChart;

function updateCharts() {
  const ctx1 = document.getElementById("incomeExpenseChart").getContext("2d");
  const ctx2 = document.getElementById("cashFlowChart").getContext("2d");

  // destroy old charts if they exist
  if (incomeExpenseChart) incomeExpenseChart.destroy();
  if (cashFlowChart) cashFlowChart.destroy();

  // Aggregate data
  let income = 0, expenses = 0;
  entries.forEach(e => {
    if (e.type === "income") income += e.amount;
    if (e.type === "expense") expenses += e.amount;
  });

  // Income vs Expense Chart
  incomeExpenseChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        label: "Amount",
        data: [income, expenses],
        backgroundColor: ["#4caf50", "#f44336"]
      }]
    },
    options: { responsive: true }
  });

  // Cash Flow (cumulative line chart)
  let balance = 0;
  const balances = entries.map(e => {
    balance += (e.type === "income" ? e.amount : -e.amount);
    return balance;
  });

  cashFlowChart = new Chart(ctx2, {
    type: "line",
    data: {
      labels: entries.map((e, i) => `#${i+1}`),
      datasets: [{
        label: "Cash Flow",
        data: balances,
        borderColor: "#ffd700",
        fill: false
      }]
    },
    options: { responsive: true }
  });
}
