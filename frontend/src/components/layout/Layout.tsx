import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ShoppingCartIcon, 
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation Header */}
      <header className="glass-dark border-b border-dark-600/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="gradient-text font-display text-2xl font-bold">Futuristic Restaurant</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/customer/menu" className="nav-link">Menu</Link>
              <Link to="/customer/orders" className="nav-link">Orders</Link>
              <Link to="/customer/booking" className="nav-link">Bookings</Link>
              <Link to="/admin" className="nav-link">Admin</Link>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-dark-800/50 transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <motion.nav
        initial={false}
        animate={isMenuOpen ? 'open' : 'closed'}
        variants={{
          open: { opacity: 1, x: 0 },
          closed: { opacity: 0, x: '-100%' }
        }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 left-0 z-40 w-64 glass-dark border-r border-dark-600/30 md:hidden"
      >
        <div className="flex flex-col space-y-4 p-6">
          <Link to="/" className="nav-link block">Home</Link>
          <Link to="/customer/menu" className="nav-link block">Menu</Link>
          <Link to="/customer/orders" className="nav-link block">Orders</Link>
          <Link to="/customer/booking" className="nav-link block">Bookings</Link>
          <Link to="/admin" className="nav-link block">Admin</Link>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-dark-900/80 z-30 md:hidden"
        />
      )}
    </div>
  );
};

export default Layout;
