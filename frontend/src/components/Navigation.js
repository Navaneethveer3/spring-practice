import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getProfile, getCart, logout as logoutApi } from '../services/api';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  const [profilePic, setProfilePic] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const fetchNavData = useCallback(async () => {
    if (!token || !username) return;
    try {
      const [profileRes, cartRes] = await Promise.allSettled([
        getProfile(username),
        role === 'USER' ? getCart() : Promise.resolve({ data: [] })
      ]);
      if (profileRes.status === 'fulfilled' && profileRes.value.data?.imageData) {
        setProfilePic(`data:${profileRes.value.data.imageType};base64,${profileRes.value.data.imageData}`);
      }
      if (cartRes.status === 'fulfilled' && Array.isArray(cartRes.value.data)) {
        const total = cartRes.value.data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
      }
    } catch (err) {
      console.log('Nav data fetch error:', err);
    }
  }, [token, username, role]);

  useEffect(() => {
    fetchNavData();
  }, [fetchNavData, location.pathname]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (err) {
      console.log('Logout API error:', err);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🛒 ShopVault</Link>

      <div className="navbar-links">
        {token ? (
          <>
            <Link to="/" className="navbar-link">Home</Link>

            {role === 'ADMIN' && (
              <Link to="/add-product" className="navbar-link">➕ Add Product</Link>
            )}

            {role === 'USER' && (
              <>
                <Link to="/orders" className="navbar-link">📦 Orders</Link>
                <Link to="/cart" className="navbar-link cart-link">
                  🛒 Cart
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              </>
            )}

            <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>

            <Link to="/profile" title="My Profile" style={{ marginLeft: '0.25rem' }}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
