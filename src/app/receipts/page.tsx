import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import type { Receipt } from "@/lib/types";
import { restaurant } from "@/lib/data";

// Mock receipt data - in reality this would come from an API
const mockReceipts = [
  {
    receiptNo: "RCV-001",
    orderNumber: "ORD-2026-0091",
    date: "2026-09-30",
    tableNumber: "7",
    customerName: "Mr. Aung",
    createdBy: "Cashier-01",
    createdAt: "2026-09-30T19:30:00Z",
    total: 245.50,
    subtotal: 220.00,
    tax: 22.00,
    serviceCharge: 11.25,
    paymentMethod: "card",
    receiptType: "e",
  },
  {
    receiptNo: "RCV-002",
    orderNumber: "ORD-2026-0092",
    date: "2026-09-29",
    tableNumber: "3",
    customerName: "Ms. Myint",
    createdAt: "2026-09-29T18:15:00Z",
    total: 185.75,
    subtotal: 160.00,
    tax: 16.00,
    serviceCharge: 8.00,
    paymentMethod: "card",
    receiptType: "e",
  },
  {
    receiptNo: "RCV-003",
    orderNumber: "ORD-2026-0093",
    date: "2026-09-28",
    tableNumber: "12",
    customerName: "Mr. Soe",
    createdAt: "2026-09-28T20:45:00Z",
    total: 320.00,
    subtotal: 280.00,
    tax: 28.00,
    serviceCharge: 14.00,
    paymentMethod: "cash",
    receiptType: "physical",
  },
];

interface ReceiptsPageProps {
  role: "owner" | "manager" | "cashier";
}

export default function ReceiptsPage({ role }: ReceiptsPageProps) {
  const router = useRouter();
  
  // Determine if user has access (simulated - in reality check JWT role)
  const hasAccess = role === "owner" || role === "manager" || role === "cashier";
  
  if (!hasAccess) {
    return (
      <div className="bg-white text-neutral-900 p-6 rounded-lg border border-border/50">
        <h2 className="text-lg font-bold text-ivory">Access Denied</h2>
        <p className="text-sm text-neutral-500">You do not have permission to view receipts.</p>
      </div>
    );
  }
  
  const [sortBy, setSortBy] = useState("all"); // daily | weekly | monthly
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredReceipts, setFilteredReceipts] = useState(mockReceipts);
  
  // Filter by date
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    setSelectedDate(dateStr);
    const filtered = mockReceipts.filter(r => r.date === dateStr);
    setFilteredReceipts(filtered);
  }, [selectedDate]);
  
  // Sort by time period
  const sortedReceipts = (() => {
    switch (sortBy) {
      case "daily":
        return [...sortedReceipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "weekly":
        return [...sortedReceipts].sort((a, b) => {
          const aWeekStart = new Date(a.createdAt).getDay();
          const bWeekStart = new Date(b.createdAt).getDay();
          if (aWeekStart !== bWeekStart) return aWeekStart - bWeekStart;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      case "monthly":
        return [...sortedReceipts].sort((a, b) => {
          const aMonth = new Date(a.createdAt).getMonth();
          const bMonth = new Date(b.createdAt).getMonth();
          if (aMonth !== bMonth) return aMonth - bMonth;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      default:
        return [...sortedReceipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  })();
  
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-border/50">
        <div className="container-wide mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-ivory">Receipts</h1>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500">Owner | Manager | Cashier</span>
              <span className="text-xs text-neutral-500">Access Granted</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Sort Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <select
          className="rounded-lg border border-border/50 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      
      {/* Calendar Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="rounded-lg border border-border/50 p-4">
          <h3 className="text-sm font-semibold text-ivory mb-3">Filter by Date</h3>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium ${
sortBy === "daily" ? "bg-gold text-gold" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
              onClick={() => setSortBy("daily")}
            >
              Daily
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium ${
sortBy === "weekly" ? "bg-gold text-gold" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
              onClick={() => setSortBy("weekly")}
            >
              Weekly
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium ${
sortBy === "monthly" ? "bg-gold text-gold" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
              onClick={() => setSortBy("monthly")}
            >
              Monthly
            </button>
          </div>
        </div>
        
        <div className="rounded-lg border border-border/50 p-4">
          <h3 className="text-sm font-semibold text-ivory mb-3">Recent Activity</h3>
          {filteredReceipts.length === 0 ? (
            <p className="text-sm text-neutral-500">No receipts found for the selected period.</p>
          ) : (
            <ul className="space-y-2">
              {filteredReceipts.map((r) => (
                <li key={r.receiptNo} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-ivory">{r.receiptNo}</p>
                    <p className="text-xs text-neutral-500">{r.date} • {r.total.toFixed(2)} KWD</p>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Table: {r.tableNumber} | Customer: {r.customerName} | Paid: {r.paymentMethod}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Access Indicator */}
      {hasAccess ? (
        <div className="rounded-lg border border-border/50 p-3 bg-neutral-50">
          <p className="text-sm text-ivory">You have access to this area.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 p-3 bg-red-50">
          <p className="text-sm text-red-700">Access denied. You must be an Owner, Manager, or Cashier.</p>
        </div>
      )}
    </div>
  );
}
