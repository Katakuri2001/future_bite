import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Admin from './pages/Admin'
import AdminDishes from './pages/AdminDishes'
import AdminBookings from './pages/AdminBookings'
import AdminSupplies from './pages/AdminSupplies'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminGuard from './components/AdminGuard'
import { CartProvider } from './context/CartContext'
import CartToggle from './components/CartToggle'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
      <div className="min-h-screen">
        <header className="py-4 container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold neon">FUTURE<span className="text-white">BITE</span></div>
            <div className="text-sm text-gray-400 ml-2">Futuristic dining experience</div>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-300 hover:text-white">Home</Link>
            <Link to="/auth" className="text-sm text-gray-300 hover:text-white">Sign In</Link>
            <CartToggle />
          </nav>
        </header>

        <main className="container py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminGuard><Admin/></AdminGuard>} />
            <Route path="/admin/dishes" element={<AdminGuard><AdminDishes/></AdminGuard>} />
            <Route path="/admin/bookings" element={<AdminGuard><AdminBookings/></AdminGuard>} />
            <Route path="/admin/supplies" element={<AdminGuard><AdminSupplies/></AdminGuard>} />
            <Route path="/admin/analytics" element={<AdminGuard><AdminAnalytics/></AdminGuard>} />
          </Routes>
        </main>
      </div>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
