"use client"

import { useTheme } from "next-themes"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface FastMovingProductsChartProps {
  data: any[]
}

export function FastMovingProductsChart({ data }: FastMovingProductsChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Prepare data for chart
  const chartData = data.map((product) => ({
    name: product.name.length > 20 ? product.name.substring(0, 20) + "..." : product.name,
    quantity: product.totalQuantity,
    sales: Number.parseFloat(product.totalSales.toFixed(2)),
    fullName: product.name,
    category: product.category_name || "Uncategorized",
  }))

  return (
    <div className="w-full aspect-[4/3] md:aspect-[16/9]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 70,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 12 }}
            stroke={isDark ? "#888" : "#666"}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#8884d8"
            label={{
              value: "Quantity Sold",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
            label={{
              value: "Sales Amount",
              angle: 90,
              position: "insideRight",
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip
            formatter={(value, name, props) => {
              if (name === "quantity") return [`${value} units`, "Quantity Sold"]
              if (name === "sales") return [`₹${value}`, "Sales Amount"]
              return [value, name]
            }}
            labelFormatter={(label, items) => {
              const item = items[0]?.payload
              return `${item?.fullName} (${item?.category})`
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="quantity" fill="#8884d8" name="Quantity Sold" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="sales" fill="#82ca9d" name="Sales Amount (₹)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
