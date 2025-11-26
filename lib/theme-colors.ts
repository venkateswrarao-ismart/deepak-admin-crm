// Theme colors extracted from the dashboard reference image
export const themeColors = {
  // Background colors
  background: {
    main: "#F8F9FA", // Light gray background
    card: "#FFFFFF", // White card background
  },

  // Primary colors
  primary: {
    main: "#F97316", // Primary orange for buttons, charts
    light: "#FDBA74", // Light orange for secondary elements
    lighter: "#FFF7ED", // Very light orange for backgrounds
  },

  // Status colors
  status: {
    success: {
      main: "#10B981", // Green for success indicators
      light: "#D1FAE5", // Light green background
      text: "#047857", // Darker green for text
    },
    warning: {
      main: "#F59E0B", // Yellow/amber for warnings
      light: "#FEF3C7", // Light yellow background
      text: "#B45309", // Darker yellow for text
    },
    error: {
      main: "#EF4444", // Red for errors/negative values
      light: "#FEE2E2", // Light red background
      text: "#B91C1C", // Darker red for text
    },
    info: {
      main: "#3B82F6", // Blue for info
      light: "#EFF6FF", // Light blue background
      text: "#2563EB", // Darker blue for text
    },
  },

  // Text colors
  text: {
    primary: "#1F2937", // Dark gray, almost black
    secondary: "#6B7280", // Medium gray
    tertiary: "#9CA3AF", // Light gray
    white: "#FFFFFF", // White text (for dark backgrounds)
  },

  // Border colors
  border: {
    light: "#E5E7EB", // Light gray for borders
    main: "#D1D5DB", // Medium gray for borders
  },

  // Status badge colors
  badges: {
    onDelivery: {
      bg: "#EFF6FF", // Light blue
      text: "#3B82F6", // Blue
    },
    pending: {
      bg: "#FEF3C7", // Light yellow
      text: "#F59E0B", // Yellow
    },
    shipped: {
      bg: "#D1FAE5", // Light green
      text: "#10B981", // Green
    },
  },
}

// Design system values
export const designSystem = {
  borderRadius: {
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
  },
  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "2.5rem", // 40px
  },
}

// Tailwind CSS class mappings for common components
export const tailwindClasses = {
  // Button variants
  button: {
    primary: "bg-[#2563EB] hover:bg-[#1D4ED8] text-white",
    secondary: "bg-white border border-[#D1D5DB] hover:bg-gray-50 text-[#1F2937]",
    success: "bg-[#10B981] hover:bg-[#059669] text-white",
    warning: "bg-[#F59E0B] hover:bg-[#D97706] text-white",
    danger: "bg-[#EF4444] hover:bg-[#DC2626] text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-[#1F2937]",
  },

  // Card styles
  card: "bg-white rounded-lg shadow-sm border border-[#E5E7EB]",

  // Status badge styles
  badge: {
    onDelivery: "bg-[#EFF6FF] text-[#3B82F6] px-3 py-1 rounded-md text-sm font-medium",
    pending: "bg-[#FEF3C7] text-[#F59E0B] px-3 py-1 rounded-md text-sm font-medium",
    shipped: "bg-[#D1FAE5] text-[#10B981] px-3 py-1 rounded-md text-sm font-medium",
  },

  // Stats card
  statsCard: "bg-white p-4 rounded-lg shadow-sm border border-[#E5E7EB]",
  statsValue: "text-2xl font-bold mt-2 text-[#1F2937]",
  statsLabel: "text-[#6B7280] text-sm",
  statsChangeUp: "text-[#10B981] bg-[#D1FAE5] text-xs px-2 py-1 rounded-full inline-flex items-center",
  statsChangeDown: "text-[#EF4444] bg-[#FEE2E2] text-xs px-2 py-1 rounded-full inline-flex items-center",

  // Table styles
  table: "w-full bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden",
  tableHeader: "bg-[#F9FAFB] text-[#6B7280] font-medium text-sm px-4 py-3 text-left",
  tableCell: "px-4 py-3 border-t border-[#E5E7EB]",
}
