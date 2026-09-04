"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { reservationTimeSlots } from "@/lib/data";

export default function ReservationFinder() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    params.set("guests", guests.toString());
    router.push(`/reserve?${params.toString()}`);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="section-padding bg-bg-elevated">
      <div className="container-narrow mx-auto">
        <div className="text-center mb-12">
          <p className="text-label mb-4">Reservations</p>
          <h2 className="text-display-md text-ivory mb-4">Find Your Table</h2>
          <p className="text-body-lg max-w-lg mx-auto">
            Select your preferred date, time, and party size to discover available experiences.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Date */}
            <div className="relative">
              <label className="block text-xs tracking-[0.15em] uppercase text-ivory-dim mb-3">
                Date
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim"
                />
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase text-ivory-dim mb-3">
                Time
              </label>
              <div className="relative">
                <Clock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim"
                />
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-surface border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select time</option>
                  {reservationTimeSlots.map((slot) => {
                    const [h, m] = slot.split(":");
                    const hour = parseInt(h);
                    const label = `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
                    return (
                      <option key={slot} value={slot}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase text-ivory-dim mb-3">
                Guests
              </label>
              <div className="relative">
                <Users
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim"
                />
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full bg-surface border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button type="submit" className="btn-primary group">
              Find a Table
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
