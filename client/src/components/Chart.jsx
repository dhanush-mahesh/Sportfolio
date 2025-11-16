import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function PlayerChart({ valueHistory }) {
  
  // Format the data for Chart.js
  const labels = valueHistory.length 
    ? valueHistory.map(d => new Date(d.value_date).toLocaleDateString()) 
    : ['No Data'];
    
  const data = valueHistory.length 
    ? valueHistory.map(d => d.value_score) 
    : [50]; // Default to 50 (the middle) if no data

  // Make a single point visible (a "dot")
  if (data.length === 1) {
    labels.push(labels[0]) // Add a "ghost" label
    data.push(data[0]) // Add a duplicate data point to draw a "dot"
  }

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Player Value',
        data: data,
        borderColor: 'rgb(56, 189, 248)', // A nice blue
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: 'rgb(56, 189, 248)',
        pointRadius: 5,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a3a3a3'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a3a3a3'
        },
        // --- ⭐️ THIS IS THE FIX (Part 1) ⭐️ ---
        min: 0,
        max: 100,
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#171717',
        titleFont: { size: 16, weight: 'bold' },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 4,
      }
    }
  }

  // --- ⭐️ THIS IS THE FIX (Part 2) ⭐️ ---
  // Corrected the syntax error (was data[=)
  return <Line data={chartData} options={options} />
}

export default PlayerChart