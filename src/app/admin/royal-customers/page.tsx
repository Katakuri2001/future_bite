"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Award, Search, Filter, User, Mail, TrendingUp, Gift } from "lucide-react";

export default function RoyalCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPoints, setMinPoints] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (minPoints) params.set("minPoints", minPoints);
    if (minSpend) params.set("minSpend", minSpend);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/royal-customers?${params}`);
    const data = await res.json();
    if (data.success) setCustomers(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-label mb-2">Loyalty Program</p>
          <h1 className="text-display-md text-ivory">Royal Customers</h1>
          <p className="text-ivory-muted text-sm mt-1">Track points, coupons, and revenue by customer tier.</p>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-border/50 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4 text-ivory-dim text-xs uppercase tracking-widest">
            <Filter size={14} className="text-gold" />
            Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-ivory-dim mb-1">Search Name/Email</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory-dim" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-bg border border-border-light text-ivory pl-9 pr-3 py-2 text-sm focus:border-gold focus:outline-none"
                  placeholder="Sarah..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ivory-dim mb-1">Min Points</label>
              <input
                type="number"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                className="w-full bg-bg border border-border-light text-ivory px-3 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory-dim mb-1">Min Total Spent ($)</label>
              <input
                type="number"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                className="w-full bg-bg border border-border-light text-ivory px-3 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <button onClick={fetchCustomers} className="btn-primary text-xs mt-4">Apply Filters</button>
        </div>

        {/* Table */}
        <div className="bg-surface border border-border/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ivory-dim text-xs uppercase tracking-widest">
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Tier</th>
                <th className="text-right p-4">Points</th>
                <th className="text-right p-4">Total Spent</th>
                <th className="text-right p-4">Coupons</th>
                <th className="text-left p-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-ivory-dim">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-ivory-dim">No royal customers found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/30 hover:bg-surface-elevated transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold text-xs font-bold">
                          {c.name?.[0] || "U"}
                        </div>
                        <div>
                          <div className="text-ivory font-medium">{c.name}</div>
                          <div className="text-ivory-dim text-xs flex items-center gap-1"><Mail size={10} /> {c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        c.tier === "Diamond" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                        c.tier === "Gold" ? "bg-gold/10 text-gold border-gold/30" :
                        c.tier === "Silver" ? "bg-gray-500/10 text-gray-400 border-gray-500/30" :
                        "bg-amber-700/10 text-amber-600 border-amber-700/30"
                      }`}>
                        {c.tier}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gold font-semibold">{c.points} pts</td>
                    <td className="p-4 text-right text-ivory">${(c.totalSpent / 100).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <span className="text-ivory-dim flex items-center justify-end gap-1"><Gift size={12} className="text-gold" /> {c.couponCount}</span>
                    </td>
                    <td className="p-4 text-ivory-dim text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
