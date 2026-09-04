"use client";

import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-xl font-bold text-ivory mb-6">Settings</h1>

        <div className="max-w-2xl space-y-6">
          <div className="bg-surface border border-border/50 p-6">
            <h3 className="text-sm font-medium text-ivory mb-4">
              Restaurant Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  defaultValue="FutureBite"
                  className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                  Address
                </label>
                <input
                  type="text"
                  defaultValue="123 Innovation Avenue"
                  className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+95 9 123 456 789"
                    className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="hello@futurebite.com"
                    className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border/50 p-6">
            <h3 className="text-sm font-medium text-ivory mb-4">
              Operating Hours
            </h3>
            <div className="space-y-3">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                (day) => (
                  <div
                    key={day}
                    className="flex items-center justify-between"
                  >
                    <span className="text-ivory text-sm w-24">{day}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        defaultValue="6:00 PM"
                        className="w-24 bg-bg border border-border-light text-ivory px-3 py-2 text-xs text-center focus:border-gold focus:outline-none transition-colors"
                      />
                      <span className="text-ivory-dim text-xs">to</span>
                      <input
                        type="text"
                        defaultValue="11:00 PM"
                        className="w-24 bg-bg border border-border-light text-ivory px-3 py-2 text-xs text-center focus:border-gold focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <button className="btn-primary text-xs">Save Settings</button>
        </div>
      </div>
    </AdminLayout>
  );
}
