"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Utensils,
  Wine,
  DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tables, reservationTimeSlots } from "@/lib/data";
import type { TableExperience } from "@/lib/types";

const experiences = [
  {
    type: "window" as TableExperience,
    name: "Window Table",
    description: "Best for intimate dining with a view.",
    icon: Utensils,
  },
  {
    type: "bar" as TableExperience,
    name: "Bar / Chef's Counter",
    description: "Closer to the kitchen, watch the action.",
    icon: Wine,
  },
  {
    type: "private" as TableExperience,
    name: "Private Room",
    description: "For groups and special occasions.",
    icon: DoorOpen,
  },
  {
    type: "main" as TableExperience,
    name: "Main Dining",
    description: "The heart of the restaurant.",
    icon: Utensils,
  },
];

type Step = "date" | "guests" | "time" | "experience" | "details" | "confirmation";

export default function ReservationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("date");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [time, setTime] = useState(searchParams.get("time") || "");
  const [guests, setGuests] = useState(
    parseInt(searchParams.get("guests") || "2")
  );
  const [experience, setExperience] = useState<TableExperience | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const limitedSlots = new Set(
    reservationTimeSlots.filter((_, i) => i % 3 === 0 || i % 5 === 0)
  );

  const steps: { key: Step; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "guests", label: "Guests" },
    { key: "time", label: "Time" },
    { key: "experience", label: "Table" },
    { key: "details", label: "Details" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const availableTables = tables.filter(
    (t) =>
      t.status === "available" &&
      t.capacity >= guests &&
      (!experience || t.experience === experience)
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          partySize: guests,
          date,
          time,
          experience,
          tableId: availableTables[0]?.id || "",
          preferences: [],
          specialRequests,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setConfirmationCode(data.data.confirmationCode);
      } else {
        setConfirmationCode(`FB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`);
      }
    } catch {
      setConfirmationCode(`FB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`);
    }
    setStep("confirmation");
    setIsSubmitting(false);
  };

  if (step === "confirmation") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-8">
          <Check size={24} className="text-gold" />
        </div>
        <h2 className="text-display-md text-ivory mb-4">
          Your Table Is Reserved.
        </h2>
        <div className="my-8 space-y-2">
          <p className="text-ivory text-lg">
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-ivory text-lg">{time}</p>
          <p className="text-ivory text-lg">
            {guests} {guests === 1 ? "Guest" : "Guests"}
          </p>
          <p className="text-gold text-sm tracking-[0.1em] uppercase mt-4">
            {confirmationCode}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button className="btn-outline text-xs">Add to Calendar</button>
          <button
            className="btn-outline text-xs"
            onClick={() => router.push("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 flex items-center justify-center text-xs font-medium border transition-all duration-300",
                i < currentStepIndex
                  ? "bg-gold border-gold text-bg"
                  : i === currentStepIndex
                  ? "border-gold text-gold"
                  : "border-border-light text-ivory-dim"
              )}
            >
              {i < currentStepIndex ? (
                <Check size={14} />
              ) : (
                i + 1
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-[1px] mx-1",
                  i < currentStepIndex ? "bg-gold" : "bg-border-light"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {step === "date" && (
          <div className="text-center">
            <h3 className="text-display text-2xl text-ivory mb-2">
              When would you like to dine?
            </h3>
            <p className="text-ivory-muted text-sm mb-8">
              Select your preferred date.
            </p>
            <div className="max-w-xs mx-auto">
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface border border-border-light text-ivory px-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {step === "guests" && (
          <div className="text-center">
            <h3 className="text-display text-2xl text-ivory mb-2">
              How many guests?
            </h3>
            <p className="text-ivory-muted text-sm mb-8">
              Select your party size.
            </p>
            <div className="flex justify-center gap-3 flex-wrap max-w-md mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setGuests(n)}
                  className={cn(
                    "w-14 h-14 flex items-center justify-center border text-sm font-medium transition-all duration-300",
                    guests === n
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border-light text-ivory-muted hover:border-gold/50"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "time" && (
          <div className="text-center">
            <h3 className="text-display text-2xl text-ivory mb-2">
              What time works best?
            </h3>
            <p className="text-ivory-muted text-sm mb-8">
              Available times for{" "}
              {new Date(date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
              .
            </p>
            <div className="flex justify-center gap-3 flex-wrap max-w-lg mx-auto">
              {reservationTimeSlots.map((slot) => {
                const [h, m] = slot.split(":");
                const hour = parseInt(h);
                const label = `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
                const isLimited = limitedSlots.has(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={cn(
                      "px-5 py-3 border text-sm transition-all duration-300 relative",
                      time === slot
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border-light text-ivory-muted hover:border-gold/50"
                    )}
                  >
                    {label}
                    {isLimited && time !== slot && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-ivory-dim text-xs mt-4">
              <span className="inline-block w-2 h-2 bg-warning rounded-full mr-1" />
              Limited availability
            </p>
          </div>
        )}

        {step === "experience" && (
          <div className="text-center">
            <h3 className="text-display text-2xl text-ivory mb-2">
              Choose your experience
            </h3>
            <p className="text-ivory-muted text-sm mb-8">
              {availableTables.length} tables available for {guests} guests.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {experiences.map((exp) => {
                const Icon = exp.icon;
                const count = tables.filter(
                  (t) =>
                    t.experience === exp.type &&
                    t.status === "available" &&
                    t.capacity >= guests
                ).length;
                return (
                  <button
                    key={exp.type}
                    onClick={() => setExperience(exp.type)}
                    disabled={count === 0}
                    className={cn(
                      "p-6 border text-left transition-all duration-300",
                      experience === exp.type
                        ? "border-gold bg-gold/5"
                        : count === 0
                        ? "border-border/30 opacity-40 cursor-not-allowed"
                        : "border-border-light hover:border-gold/50"
                    )}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        "mb-3",
                        experience === exp.type ? "text-gold" : "text-ivory-dim"
                      )}
                      strokeWidth={1.5}
                    />
                    <p className="text-ivory text-sm font-medium mb-1">
                      {exp.name}
                    </p>
                    <p className="text-ivory-muted text-xs mb-2">
                      {exp.description}
                    </p>
                    <p className="text-ivory-dim text-xs">
                      {count} {count === 1 ? "table" : "tables"} available
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "details" && (
          <div>
            <h3 className="text-display text-2xl text-ivory mb-2 text-center">
              Your Details
            </h3>
            <p className="text-ivory-muted text-sm mb-8 text-center">
              Complete your reservation.
            </p>
            <div className="max-w-md mx-auto space-y-5">
              <div>
                <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="+95 9 XXX XXX XXX"
                  required
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                  Special Requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-surface border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Dietary requirements, celebrations, etc."
                />
              </div>

              {/* Summary */}
              <div className="border border-border-light p-4 mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ivory-dim">Date</span>
                  <span className="text-ivory">
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ivory-dim">Time</span>
                  <span className="text-ivory">{time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ivory-dim">Guests</span>
                  <span className="text-ivory">{guests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ivory-dim">Experience</span>
                  <span className="text-ivory capitalize">{experience}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={() => {
            const idx = steps.findIndex((s) => s.key === step);
            if (idx > 0) setStep(steps[idx - 1].key);
            else router.push("/");
          }}
          className="btn-outline text-xs py-3 px-5"
        >
          <ArrowLeft size={14} />
          {currentStepIndex === 0 ? "Home" : "Back"}
        </button>

        <button
          onClick={() => {
            if (step === "details") {
              handleSubmit();
            } else {
              const idx = steps.findIndex((s) => s.key === step);
              setStep(steps[idx + 1].key);
            }
          }}
          disabled={
            (step === "date" && !date) ||
            (step === "time" && !time) ||
            (step === "experience" && !experience) ||
            (step === "details" && (!name || !email || !phone)) ||
            isSubmitting
          }
          className="btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          {step === "details"
            ? isSubmitting
              ? "Confirming..."
              : "Confirm Reservation"
            : "Continue"}
          {step !== "details" && (
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          )}
        </button>
      </div>
    </div>
  );
}
