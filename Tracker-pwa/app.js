// ----------------- Data Storage -----------------
let entries = [];

// ----------------- Chart Setup -----------------
const ctx = document.getElementById('cashflowChart').getContext('2d');
let cashflowChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Net Cash Flow ($)',
      data: [],
      borderColor: '#00ff88',
      backgroundColor: 'rgba(0, 255, 136, 0.2)',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#ffd700'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#f5f5f5'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#ccc' },
        grid: { color: '#2a2d3a' }
      },
      y: {
        ticks: { color: '#ccc' },
        grid: { color: '#2a2d3a' }
      }
    }
  }
});

// ----------------- Form Handling -----------------
document.getElementById('entry-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;

  if (!type || !description || isNaN(amount) || !date) {
    alert("Please fill in all fields.");
    return;
  }

  // Store the entry
  entries.push({ type, description, amount, date });

  // Recalculate totals per date
  let totalsByDate = {};
  entries.forEach(entry => {
    if (!totalsByDate[entry.date]) {
      totalsByDate[entry.date] = 0;
    }
    if (entry.type === "income") {
      totalsByDate[entry.date] += entry.amount;
    } else {
      totalsByDate[entry.date] -= entry.amount;
    }
  });

  // Sort by date
  const sortedDates = Object.keys(totalsByDate).sort();

  // Calculate cumulative net flow
  let cumulative = 0;
  const netFlow = sortedDates.map(d => {
    cumulative += totalsByDate[d];
    return cumulative;
  });

  // Update chart
  cashflowChart.data.labels = sortedDates;
  cashflowChart.data.datasets[0].data = netFlow;
  cashflowChart.update();

  // Reset form
  e.target.reset();
});
