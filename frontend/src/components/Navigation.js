import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">ProManage</Link>
      <div className="navbar-links">
        {token ? (
          <>
            <Link to="/" className="navbar-link">Home</Link>
            
            {role === 'ADMIN' && (
              <Link to="/add-product" className="navbar-link">Add Product</Link>
            )}

            {role === 'USER' && (
              <>
                <Link to="/cart" className="navbar-link">Cart</Link>
                <Link to="/orders" className="navbar-link">My Orders</Link>
              </>
            )}
            
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
