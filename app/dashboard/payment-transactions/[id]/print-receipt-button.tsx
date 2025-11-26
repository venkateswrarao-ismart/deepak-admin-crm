"use client"

import { Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

interface PrintReceiptButtonProps {
  transaction: any
  paymentDate: Date
}

export function PrintReceiptButton({ transaction, paymentDate }: PrintReceiptButtonProps) {
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${transaction.id}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .info-section {
            width: 48%;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 2px;
          }
          .label {
            font-weight: bold;
            width: 40%;
          }
          .value {
            width: 60%;
            text-align: right;
          }
          .amount-section {
            background-color: #f5f5f5;
            padding: 15px;
            margin: 20px 0;
            border: 1px solid #ddd;
            text-align: center;
          }
          .amount {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-completed { background-color: #dcfce7; color: #166534; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-failed { background-color: #fee2e2; color: #991b1b; }
          .status-cancelled { background-color: #f3f4f6; color: #374151; }
          .status-refunded { background-color: #f3e8ff; color: #7c3aed; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">iSmart Admin</div>
          <div>Payment Receipt</div>
        </div>
        
        <div class="receipt-title">Transaction Receipt</div>
        
        <div class="receipt-info">
          <div class="info-section">
            <div class="info-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${transaction.id}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${format(paymentDate, "PPP")}</span>
            </div>
            <div class="info-row">
              <span class="label">Time:</span>
              <span class="value">${format(paymentDate, "p")}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value">
                <span class="status-badge status-${transaction.status}">${transaction.status.toUpperCase()}</span>
              </span>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">Payment Method:</span>
              <span class="value">${transaction.payment_method.replace("_", " ").toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">Transaction Type:</span>
              <span class="value">${transaction.transaction_type.replace("_", " ").toUpperCase()}</span>
            </div>
            ${
              transaction.reference_number
                ? `
            <div class="info-row">
              <span class="label">Reference:</span>
              <span class="value">${transaction.reference_number}</span>
            </div>
            `
                : ""
            }
            <div class="info-row">
              <span class="label">Currency:</span>
              <span class="value">${transaction.currency}</span>
            </div>
          </div>
        </div>
        
        <div class="amount-section">
          <div>Total Amount</div>
          <div class="amount">${formatCurrency(transaction.amount, transaction.currency)}</div>
        </div>
        
        ${
          transaction.vendor_id && transaction.vendors
            ? `
        <div style="margin: 20px 0;">
          <h3 style="margin-bottom: 10px; font-size: 14px;">Vendor Information</h3>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${transaction.vendors.name}</span>
          </div>
          ${
            transaction.vendors.vendor_code
              ? `
          <div class="info-row">
            <span class="label">Vendor Code:</span>
            <span class="value">${transaction.vendors.vendor_code}</span>
          </div>
          `
              : ""
          }
          ${
            transaction.vendors.contact_number
              ? `
          <div class="info-row">
            <span class="label">Contact:</span>
            <span class="value">${transaction.vendors.contact_number}</span>
          </div>
          `
              : ""
          }
        </div>
        `
            : ""
        }
        
        ${
          transaction.customer_id && transaction.profiles
            ? `
        <div style="margin: 20px 0;">
          <h3 style="margin-bottom: 10px; font-size: 14px;">Customer Information</h3>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${transaction.profiles.full_name || "Customer"}</span>
          </div>
          ${
            transaction.profiles.email
              ? `
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${transaction.profiles.email}</span>
          </div>
          `
              : ""
          }
          ${
            transaction.profiles.phone
              ? `
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="value">${transaction.profiles.phone}</span>
          </div>
          `
              : ""
          }
        </div>
        `
            : ""
        }
        
        ${
          transaction.description
            ? `
        <div style="margin: 20px 0;">
          <h3 style="margin-bottom: 10px; font-size: 14px;">Description</h3>
          <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #e5e5e5;">
            ${transaction.description}
          </div>
        </div>
        `
            : ""
        }
        
        <div class="footer">
          <div>This is a computer-generated receipt and does not require a signature.</div>
          <div>Generated on ${format(new Date(), "PPP p")}</div>
          <div>iSmart Admin System - Payment Management</div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Receipt className="mr-2 h-4 w-4" />
      Print Receipt
    </Button>
  )
}
