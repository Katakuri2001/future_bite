"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ChefHat, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        router.push("/admin");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <ChefHat size={32} className="text-gold" />
            <span className="text-display text-3xl text-ivory">FutureBite</span>
          </div>
          <p className="text-ivory-dim text-sm">Admin Sign In</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface border border-border/50 p-8">
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-error/10 border border-error/30 text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="admin@futurebite.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm py-4 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center text-ivory-dim text-xs mt-6">
          Demo: use any email/password to sign in
        </p>
      </motion.div>
    </div>
  );
}
