import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Customer Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 glass-dark border-r border-dark-600/30 z-40">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-dark-600/30">
            <Link to="/customer" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-gray-300 font-semibold">Customer Portal</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/customer"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/customer') && !isActive('/customer/menu')
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-800/50'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span>Home</span>
            </Link>

            <Link
              to="/customer/menu"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/customer/menu')
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-800/50'
              }`}
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <span>Menu & Orders</span>
            </Link>

            <Link
              to="/customer/orders"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/customer/orders')
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-800/50'
              }`}
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <span>Order History</span>
            </Link>

            <Link
              to="/customer/profile"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/customer/profile')
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-800/50'
              }`}
            >
              <UserIcon className="h-5 w-5" />
              <span>Profile</span>
            </Link>

            <Link
              to="/customer/booking"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/customer/booking')
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-800/50'
              }`}
            >
              <CalendarIcon className="h-5 w-5" />
              <span>Bookings</span>
            </Link>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-dark-600/30">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-gray-300 text-sm font-medium">John Doe</p>
                <p className="text-gray-500 text-xs">Premium Member</p>
              </div>
            </div>
            
            <Link
              to="/login"
              className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <button className="glass-dark p-3 rounded-full neon-glow">
          <HomeIcon className="h-5 w-5 text-primary-400" />
        </button>
      </div>
    </div>
  );
};

export default CustomerLayout;
