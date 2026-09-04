import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ShoppingCartIcon,
  CalendarIcon,
  CogIcon,
  HomeIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 glass-dark border-r border-dark-600/30 z-40">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-dark-600/30">
            <Link to="/admin" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-gray-300 font-semibold">Admin Portal</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-dark-800/50 transition-all duration-200"
            >
              <HomeIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/orders"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-dark-800/50 transition-all duration-200"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <span>Orders</span>
            </Link>

            <Link
              to="/admin/analytics"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-dark-800/50 transition-all duration-200"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>Analytics</span>
            </Link>

            <Link
              to="/admin/inventory"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-dark-800/50 transition-all duration-200"
            >
              <CogIcon className="h-5 w-5" />
              <span>Inventory</span>
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-dark-800/50 transition-all duration-200"
            >
              <UserGroupIcon className="h-5 w-5" />
              <span>Users</span>
            </Link>

            <Link
              to="/admin/bookings"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-dark-800/50 transition-all duration-200"
            >
              <CalendarIcon className="h-5 w-5" />
              <span>Bookings</span>
            </Link>

            <Link
              to="/admin/research"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-dark-800/50 transition-all duration-200"
            >
              <BookOpenIcon className="h-5 w-5" />
              <span>Research</span>
            </Link>
          </nav>

          {/* Admin Section */}
          <div className="p-4 border-t border-dark-600/30">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <CogIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-gray-300 text-sm font-medium">Admin User</p>
                <p className="text-gray-500 text-xs">Super Admin</p>
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
    </div>
  );
};

export default AdminLayout;
