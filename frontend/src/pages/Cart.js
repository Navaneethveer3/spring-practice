import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCart, getCartValue, removeFromCart, addToCart, clearCart, placeOrder } from '../services/api';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const [cartRes, valueRes] = await Promise.all([getCart(), getCartValue()]);
      setCartItems(cartRes.data);
      setTotalValue(valueRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load cart data.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleIncrement = async (productId) => {
    try {
      await addToCart(productId);
      fetchCartData();
    } catch (err) {
      showToast('Failed to update quantity', 'error');
    }
  };

  const handleDecrement = async (productId) => {
    try {
      await removeFromCart(productId);
      fetchCartData();
    } catch (err) {
      showToast('Failed to update quantity', 'error');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Remove all items from your cart?')) return;
    try {
      await clearCart();
      fetchCartData();
      showToast('Cart cleared');
    } catch (err) {
      showToast('Failed to clear cart', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!window.confirm('Place your order?')) return;
    setPlacing(true);
    try {
      await placeOrder();
      showToast('🎉 Order placed successfully!');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      showToast('Failed to place order', 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="gradient-text mb-6">Shopping Cart</h1>
        <div className="two-col-layout">
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton mb-4" style={{ height: '110px' }}></div>
            ))}
          </div>
          <div className="skeleton" style={{ height: '200px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.text}</div>
        </div>
      )}

      <div className="page-header">
        <h1 className="gradient-text">Shopping Cart</h1>
        {cartItems.length > 0 && (
          <button onClick={handleClearCart} className="btn btn-danger btn-sm">🗑️ Clear Cart</button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {cartItems.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="btn btn-primary">Continue Shopping</Link>
        </div>
      ) : (
        <div className="two-col-layout">
          {/* Cart Items */}
          <div className="flex flex-col gap-3">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                {item.product.imageData ? (
                  <img
                    src={`data:${item.product.imageType};base64,${item.product.imageData}`}
                    alt={item.product.name}
                    className="cart-item-image"
                  />
                ) : (
                  <div className="cart-item-image" style={{ background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    No Img
                  </div>
                )}

                <div className="cart-item-details">
                  <Link to={`/product/${item.product.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{item.product.name}</h3>
                  </Link>
                  {item.product.brand && <div className="text-sm text-muted mb-1">{item.product.brand}</div>}
                  <div className="text-sm text-secondary">${item.product.price} per unit</div>
                </div>

                <div className="cart-item-actions">
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                  <div className="qty-stepper">
                    <button onClick={() => handleDecrement(item.product.id)} title="Decrease quantity">−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleIncrement(item.product.id)} title="Increase quantity">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="summary-card">
            <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>

            <div className="summary-row">
              <span className="text-secondary">Items</span>
              <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span style={{ color: 'var(--primary-color)' }}>${totalValue.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="btn btn-primary btn-lg btn-block mt-6"
              disabled={placing}
            >
              {placing ? 'Placing Order...' : '🛍️ Place Order'}
            </button>

            <Link to="/" className="btn btn-secondary btn-block mt-2" style={{ textAlign: 'center' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
