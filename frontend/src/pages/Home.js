import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { addToCart, searchProducts } from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const role = localStorage.getItem('role');
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return fetchProducts();
    try {
      setLoading(true);
      const response = await searchProducts(searchTerm);
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to search products.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await addToCart(productId);
      showToast('Added to cart!', 'success');
    } catch (err) {
      showToast('Failed to add to cart', 'error');
    }
  };

  const getStockBadge = (quantity) => {
    if (!quantity || quantity <= 0) return <span className="stock-badge out-of-stock">Out of Stock</span>;
    if (quantity <= 5) return <span className="stock-badge low-stock">Only {quantity} left!</span>;
    return <span className="stock-badge in-stock">In Stock</span>;
  };

  return (
    <div className="container animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.text}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <h1 className="gradient-text">Explore Products</h1>
        <div className="page-header-actions">
          {role === 'USER' && (
            <>
              <Link to="/cart" className="btn btn-primary">🛒 My Cart</Link>
              <Link to="/orders" className="btn btn-accent">📦 My Orders</Link>
            </>
          )}
          {role === 'ADMIN' && (
            <Link to="/add-product" className="btn btn-primary">➕ Add New Product</Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6" style={{ maxWidth: '550px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, brand, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">Search</button>
        {searchTerm && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSearchTerm(''); fetchProducts(); }}>
            ✕
          </button>
        )}
      </form>

      {error && <div className="error-message">{error}</div>}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: '200px', borderRadius: 0 }}></div>
              <div style={{ padding: '1rem' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '0.5rem' }}></div>
                <div className="skeleton" style={{ height: '18px', width: '80%', marginBottom: '0.75rem' }}></div>
                <div className="skeleton" style={{ height: '24px', width: '30%' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or check back later.</p>
          {searchTerm && <button className="btn btn-primary" onClick={() => { setSearchTerm(''); fetchProducts(); }}>Clear Search</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card glass-panel"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="product-image-wrapper">
                {product.imageData ? (
                  <img
                    src={`data:${product.imageType};base64,${product.imageData}`}
                    alt={product.name}
                  />
                ) : (
                  <div className="product-image-placeholder">No Image</div>
                )}
              </div>
              <div className="product-info">
                {product.brand && <div className="product-brand-badge">{product.brand}</div>}
                <h3 className="product-title">{product.name}</h3>
                {getStockBadge(product.quantity)}
                <div className="product-price">₹{product.price}</div>
                <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                  {role === 'ADMIN' ? (
                    <Link to={`/edit-product/${product.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                      Edit
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => handleAddToCart(e, product.id)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      disabled={!product.quantity || product.quantity <= 0}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
