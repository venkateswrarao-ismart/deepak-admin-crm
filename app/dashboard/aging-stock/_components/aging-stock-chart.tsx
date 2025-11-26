"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface AgingStockChartProps {
  data: {
    [key: string]: {
      count: number
      value: number
    }
  }
}

export function AgingStockChart({ data }: AgingStockChartProps) {
  const { theme } = useTheme()
  const chartRef = useRef(null)

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const categories = Object.keys(data)
  const countValues = categories.map((category) => data[category].count)
  const valueData = categories.map((category) => data[category].value)

  const chartData = {
    labels: categories,
    datasets: [
      {
        label: "Number of Products",
        data: countValues,
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        label: "Inventory Value",
        data: valueData,
        backgroundColor: "rgba(249, 115, 22, 0.7)",
        borderColor: "rgba(249, 115, 22, 1)",
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: "y1",
      },
    ],
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ""
            const value = context.parsed.y
            if (context.datasetIndex === 1) {
              return `${label}: ${formatCurrency(value)}`
            }
            return `${label}: ${value}`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Number of Products",
          color: theme === "dark" ? "#e5e7eb" : "#374151",
        },
        ticks: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Inventory Value (₹)",
          color: theme === "dark" ? "#e5e7eb" : "#374151",
        },
        ticks: {
          callback: (value) => formatCurrency(value as number).replace("₹", ""),
          color: theme === "dark" ? "#e5e7eb" : "#374151",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  // Update chart when theme changes
  useEffect(() => {
    const chart = chartRef.current

    if (chart) {
      chart.update()
    }
  }, [theme])

  return (
    <div className="w-full h-[400px]">
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  )
}
