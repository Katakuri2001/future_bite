import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon,
  FireIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  QrCodeIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-primary-900/20 to-dark-900">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-6xl font-display font-bold gradient-text mb-6">
                Welcome to the Future of Dining
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Experience restaurant technology like never before. Scan QR codes to order, 
                track your loyalty points, and enjoy seamless service.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link
                to="/customer/menu"
                className="btn-primary group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <QrCodeIcon className="h-5 w-5" />
                  <span>Scan & Order</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/customer/booking"
                className="btn-secondary group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>Book Table</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-dark-700 to-dark-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-neon-blue/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-neon-green/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              Why Choose <span className="gradient-text">Futuristic Restaurant</span>?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="card-hover p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <QrCodeIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-primary-400 mb-3">Smart QR Ordering</h3>
              <p className="text-gray-400">
                Scan table QR codes for instant access to menus and ordering
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="card-hover p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-neon-green to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FireIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neon-green mb-3">Real-time Updates</h3>
              <p className="text-gray-400">
                Live order tracking and status updates in real-time
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="card-hover p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <StarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">Loyalty Rewards</h3>
              <p className="text-gray-400">
                Earn points with every order and redeem exclusive rewards
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="card-hover p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-neon-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neon-blue mb-3">Secure & Fast</h3>
              <p className="text-gray-400">
                Enterprise-grade security with lightning-fast performance
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-16">
              Trusted by <span className="gradient-text">Thousands</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text mb-2">10K+</div>
              <p className="text-gray-400">Happy Customers</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-400 mb-2">50K+</div>
              <p className="text-gray-400">Orders Processed</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-neon-green mb-2">4.9★</div>
              <p className="text-gray-400">Average Rating</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <Link
              to="/customer"
              className="btn-primary inline-flex items-center space-x-3 group"
            >
              <span>Get Started</span>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-900 to-dark-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              Ready to Experience the Future?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of satisfied customers enjoying our futuristic dining experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary flex-1 sm:flex-initial"
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Sign Up Now
              </Link>
              <Link
                to="/customer/menu"
                className="btn-ghost flex-1 sm:flex-initial"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Browse Menu
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
