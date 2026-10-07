"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        router.push("/account");
      } else {
        setError(data.error || "Login failed");
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
            <p className="text-label mb-4">Enterprise Access</p>
            <h1 className="text-display-lg text-ivory max-w-md">Dining,<br />Reimagined.</h1>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-ivory-dim text-sm">
              <Shield size={16} className="text-gold" />
              <span>Enterprise-grade security & encryption</span>
            </div>
            <div className="flex items-center gap-3 text-ivory-dim text-sm">
              <div className="w-1 h-1 rounded-full bg-gold" />
              <span>Multi-branch support & role-based access</span>
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
            <p className="text-label mb-3">Welcome Back</p>
            <h2 className="text-display-md text-ivory">Sign in to your account</h2>
            <p className="text-ivory-muted text-sm mt-2">Enter your credentials to access reservations, orders, and loyalty rewards.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-error/10 border border-error/30 text-error text-sm">
                {error}
              </div>
            )}

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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-ivory-dim text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-light bg-bg text-gold focus:ring-gold"
                />
                Remember me
              </label>
              <a href="#" className="text-gold text-xs hover:text-ivory-dim transition-colors">Forgot password?</a>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-4 disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-ivory-dim text-xs">
              New to FutureBite?{" "}
              <a href="/register" className="text-gold hover:text-ivory-dim transition-colors">Create an account</a>
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
