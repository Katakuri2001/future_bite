import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a]" />
        <div className="relative text-center px-4 max-w-4xl mx-auto">
          <p className="text-[#c9a96e] text-xs tracking-[0.4em] uppercase mb-6">
            Yangon · Myanmar
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
            Dining,<br />Reimagined.
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            An extraordinary dining experience where precision, atmosphere, and cuisine converge to create unforgettable memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="bg-[#c9a96e] text-black px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#d4b87a] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="border border-[#c9a96e] text-[#c9a96e] px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#c9a96e]/10 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <p className="text-gray-500 text-xs tracking-[0.3em] uppercase">Scroll</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
              The FutureBite Experience
            </h2>
            <p className="text-gray-500 text-sm tracking-wide">
              Where technology meets culinary excellence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-[#222] p-8 hover:border-[#c9a96e]/50 transition-colors">
              <div className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-4">01</div>
              <h3 className="text-lg font-serif text-white mb-3">Smart Ordering</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Scan QR codes for instant access to our menu and seamless ordering experience.
              </p>
            </div>

            <div className="border border-[#222] p-8 hover:border-[#c9a96e]/50 transition-colors">
              <div className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-4">02</div>
              <h3 className="text-lg font-serif text-white mb-3">Real-time Updates</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Live order tracking and status updates from kitchen to table.
              </p>
            </div>

            <div className="border border-[#222] p-8 hover:border-[#c9a96e]/50 transition-colors">
              <div className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-4">03</div>
              <h3 className="text-lg font-serif text-white mb-3">Loyalty Rewards</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Earn points with every visit and redeem exclusive rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 border-t border-[#111]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
            Ready to Experience the Future?
          </h2>
          <p className="text-gray-500 mb-10">
            Join us for an unforgettable dining experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-[#c9a96e] text-black px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#d4b87a] transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-[#c9a96e] text-[#c9a96e] px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#c9a96e]/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#111]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[#c9a96e] text-sm tracking-[0.3em] uppercase font-serif">
            FutureBite
          </div>
          <p className="text-gray-600 text-xs tracking-wide">
            Open Tonight · 6:00 PM — 11:00 PM
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
