import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Layout from '@/components/layout/Layout';
import CustomerLayout from '@/components/layout/CustomerLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Page Components
import HomePage from '@/pages/customer/Home';
import MenuPage from '@/pages/customer/Menu';
import CartPage from '@/pages/customer/Cart';
import OrdersPage from '@/pages/customer/Orders';
import ProfilePage from '@/pages/customer/Profile';
import BookingPage from '@/pages/customer/Booking';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminOrders from '@/pages/admin/Orders';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminInventory from '@/pages/admin/Inventory';
import AdminUsers from '@/pages/admin/Users';
import AdminBookings from '@/pages/admin/Bookings';
import AdminResearch from '@/pages/admin/Research';

// Auth Pages
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';

// Styles
import '@/styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-dark-900 futuristic-bg">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            {/* Customer Routes */}
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<HomePage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="booking" element={<BookingPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="research" element={<AdminResearch />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-primary-400 mb-4">404</h1>
                <p className="text-gray-400">Page not found</p>
              </div>
            </div>} />
          </Routes>
          
          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-dark border border-dark-600/30 text-gray-100',
              success: {
                iconTheme: {
                  primary: '#00ff88',
                  secondary: '#0f0f23',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff006e',
                  secondary: '#0f0f23',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
