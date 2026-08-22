import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import AddEditProduct from './pages/AddEditProduct';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Navigation from './components/Navigation';
import ChatWidget from './components/ChatWidget';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
};

/**
 * Extracts the current productId from the route if the user is on /product/:id.
 * Used to give the ChatWidget context about which product the user is viewing.
 */
function useChatProductId() {
  const location = useLocation();
  // Match /product/123 or /edit-product/123
  const match = location.pathname.match(/\/(?:product|edit-product)\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Renders the ChatWidget only when the user is authenticated,
 * and passes the productId if they are on a product page.
 */
function ChatWidgetWrapper() {
  const token = localStorage.getItem('accessToken');
  const location = useLocation();
  const productId = useChatProductId();

  // Don't show on login / register pages
  const hideOnPaths = ['/login', '/register'];
  if (!token || hideOnPaths.includes(location.pathname)) return null;

  return <ChatWidget productId={productId} />;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main style={{ padding: '2rem 0' }}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/add-product" element={<AdminRoute><AddEditProduct /></AdminRoute>} />
            <Route path="/edit-product/:id" element={<AdminRoute><AddEditProduct /></AdminRoute>} />
          </Routes>
        </main>

        {/* Global floating chat widget – aware of current product page */}
        <ChatWidgetWrapper />
      </div>
    </Router>
  );
}

export default App;
