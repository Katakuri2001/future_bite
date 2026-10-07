"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        router.push("/account");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface to-bg" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(201,169,110,0.15) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 flex flex-col justify-between p-16">
          <div>
            <img src="/future_bite_logo.jpeg" alt="FutureBite" className="h-10 w-auto object-contain mb-8" />
            <p className="text-label mb-4">Join FutureBite</p>
            <h1 className="text-display-lg text-ivory max-w-md">Create your<br />enterprise account.</h1>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-ivory-dim text-sm">
              <div className="w-1 h-1 rounded-full bg-gold" />
              <span>Access across all branches & devices</span>
            </div>
            <div className="flex items-center gap-3 text-ivory-dim text-sm">
              <div className="w-1 h-1 rounded-full bg-gold" />
              <span>Secure, encrypted, role-based access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <p className="text-label mb-3">Get Started</p>
            <h2 className="text-display-md text-ivory">Create your account</h2>
            <p className="text-ivory-muted text-sm mt-2">Sign up to unlock reservations, orders, and loyalty rewards.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-error/10 border border-error/30 text-error text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="you@futurebite.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg border border-border-light text-ivory pl-11 pr-12 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ivory-dim hover:text-ivory transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg border border-border-light text-ivory pl-11 pr-4 py-4 text-sm focus:border-gold focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-ivory-dim text-xs cursor-pointer">
              <input type="checkbox" required className="mt-0.5 rounded border-border-light bg-bg text-gold focus:ring-gold" />
              <span>I agree to the Terms of Service and Privacy Policy</span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-4 disabled:opacity-50">
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-ivory-dim text-xs">
              Already have an account?{" "}
              <a href="/login" className="text-gold hover:text-ivory-dim transition-colors">Sign in</a>
            </p>
          </div>

          <div className="mt-4 text-center">
            <a href="/account" className="text-ivory-dim text-xs hover:text-gold transition-colors">Back to account</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
