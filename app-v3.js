document.addEventListener("DOMContentLoaded", () => {
  // Tenant Management
  const tenantInput = document.getElementById("tenantName");
  const tenantDropdowns = document.querySelectorAll(".tenant-dropdown");
  const addTenantBtn = document.getElementById("addTenantBtn");

  if (addTenantBtn) {
    addTenantBtn.addEventListener("click", () => {
      const tenantName = tenantInput.value.trim();
      if (tenantName !== "") {
        tenantDropdowns.forEach(dropdown => {
          const option = document.createElement("option");
          option.value = tenantName;
          option.textContent = tenantName;
          dropdown.appendChild(option);
        });
        tenantInput.value = "";
      }
    });
  }

  // Chart.js Initialization
  const incomeChartCtx = document.getElementById("incomeChart");
  const expenseChartCtx = document.getElementById("expenseChart");

  if (incomeChartCtx) {
    new Chart(incomeChartCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        datasets: [{
          label: "Income",
          data: [500, 800, 700, 1200, 1000],
          borderColor: "#ffd700",
          backgroundColor: "rgba(255, 215, 0, 0.3)",
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#f1f1f1" } }
        },
        scales: {
          x: { ticks: { color: "#f1f1f1" } },
          y: { ticks: { color: "#f1f1f1" } }
        }
      }
    });
  }

  if (expenseChartCtx) {
    new Chart(expenseChartCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        datasets: [{
          label: "Expenses",
          data: [300, 400, 500, 600, 700],
          borderColor: "#ff4d4d",
          backgroundColor: "rgba(255, 77, 77, 0.3)",
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#f1f1f1" } }
        },
        scales: {
          x: { ticks: { color: "#f1f1f1" } },
          y: { ticks: { color: "#f1f1f1" } }
        }
      }
    });
  }
});
