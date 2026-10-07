import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setAuthToken, setRefreshToken } from '../../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res: any = await api.post('/auth/register', { name, email, password });

      if (res.success) {
        const token = res.data?.accessToken || res.data?.token;
        const refreshToken = res.data?.refreshToken;
        if (token) setAuthToken(token);
        if (refreshToken) setRefreshToken(refreshToken);
        navigate('/customer');
      } else {
        setError(res.error?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-8">
            <div className="text-2xl font-serif tracking-[0.3em] text-[#c9a96e] uppercase">
              FutureBite
            </div>
          </Link>
          <h1 className="text-4xl font-serif text-white mb-3">Join Us</h1>
          <p className="text-gray-400 text-sm tracking-wide">Create your account</p>
        </div>

        {/* Form */}
        <div className="bg-[#111] border border-[#222] rounded-sm p-8">
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-900/20 border border-red-800/50 text-red-400 text-sm rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full bg-transparent border-b border-[#333] text-white py-3 px-0 placeholder-gray-600 focus:outline-none focus:border-[#c9a96e] transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-transparent border-b border-[#333] text-white py-3 px-0 placeholder-gray-600 focus:outline-none focus:border-[#c9a96e] transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-transparent border-b border-[#333] text-white py-3 px-0 placeholder-gray-600 focus:outline-none focus:border-[#c9a96e] transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-transparent border-b border-[#333] text-white py-3 px-0 placeholder-gray-600 focus:outline-none focus:border-[#c9a96e] transition-colors text-sm"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 rounded border-[#333] bg-transparent text-[#c9a96e] focus:ring-[#c9a96e]" />
              <span>I agree to the Terms of Service and Privacy Policy</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9a96e] text-black font-medium py-3.5 text-sm tracking-[0.15em] uppercase hover:bg-[#d4b87a] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#c9a96e] hover:text-[#d4b87a] transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 tracking-[0.15em] uppercase transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
