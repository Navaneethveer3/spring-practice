import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { addToCart, deleteProduct } from '../services/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const role = localStorage.getItem('role');
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError('Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async () => {
    if (!token) { navigate('/login'); return; }
    try {
      await addToCart(product.id);
      showToast('Added to cart!');
    } catch (err) {
      showToast('Failed to add to cart', 'error');
    }
  };

  const handleBuyNow = async () => {
    if (!token) { navigate('/login'); return; }
    try {
      await addToCart(product.id);
      navigate('/cart');
    } catch (err) {
      showToast('Failed to add to cart', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        navigate('/');
      } catch (err) {
        setError('Failed to delete product.');
      }
    }
  };

  const getStockInfo = (qty) => {
    if (!qty || qty <= 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (qty <= 5) return { text: `Only ${qty} left — order soon!`, class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  if (loading) {
    return (
      <div className="container">
        <div className="glass-panel flex gap-6" style={{ flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ flex: 1, minWidth: '300px', height: '400px' }}></div>
          <div style={{ flex: 1.5, minWidth: '300px' }}>
            <div className="skeleton mb-4" style={{ height: '20px', width: '30%' }}></div>
            <div className="skeleton mb-4" style={{ height: '32px', width: '70%' }}></div>
            <div className="skeleton mb-6" style={{ height: '40px', width: '25%' }}></div>
            <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="container error-message mt-8">{error}</div>;
  if (!product) return <div className="container text-center mt-8">Product not found.</div>;

  const stock = getStockInfo(product.quantity);

  return (
    <div className="container animate-fade-in">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.text}</div>
        </div>
      )}

      <Link to="/" className="btn btn-secondary btn-sm mb-6">← Back to Products</Link>

      <div className="glass-panel" style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
        {/* Product Image */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          {product.imageData ? (
            <img
              src={`data:${product.imageType};base64,${product.imageData}`}
              alt={product.name}
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', objectFit: 'cover', maxHeight: '450px' }}
            />
          ) : (
            <div style={{ width: '100%', height: '400px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No Image Available
            </div>
          )}
        </div>

        {/* Product Details */}
        <div style={{ flex: '1.5', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
          {product.brand && <div className="product-brand-badge mb-2">{product.brand}</div>}
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', background: 'none', WebkitTextFillColor: 'var(--text-primary)' }}>{product.name}</h1>

          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '1rem' }}>
            ${product.price}
          </div>

          <div className={`stock-badge ${stock.class}`} style={{ marginBottom: '1.5rem' }}>
            {stock.text}
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{product.description}</p>
            </div>
          )}

          <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
            {product.launchDate && (
              <div className="text-sm text-muted">
                📅 Launch: {product.launchDate}
              </div>
            )}
            {product.quantity != null && (
              <div className="text-sm text-muted">
                📦 Stock: {product.quantity} units
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {role === 'ADMIN' ? (
              <>
                <Link to={`/edit-product/${product.id}`} className="btn btn-primary btn-lg" style={{ flex: 1 }}>Edit Product</Link>
                <button onClick={handleDelete} className="btn btn-danger btn-lg" style={{ flex: 1 }}>Delete Product</button>
              </>
            ) : (
              <>
                <button onClick={handleAddToCart} className="btn btn-secondary btn-lg" style={{ flex: 1 }}
                  disabled={!product.quantity || product.quantity <= 0}>
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} className="btn btn-primary btn-lg" style={{ flex: 1 }}
                  disabled={!product.quantity || product.quantity <= 0}>
                  Buy Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
