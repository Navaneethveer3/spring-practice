import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCart, getCartValue, removeFromCart, addToCart, clearCart, createPaymentOrder, verifyPayment } from '../services/api';


const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();


  const fetchCartData = useCallback(async () => {
    try {
      setLoading(true);
      const [cartRes, valueRes] = await Promise.all([getCart(), getCartValue()]);
      setCartItems(cartRes.data);
      setTotalValue(valueRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load cart data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartData();
  }, [fetchCartData]);


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

  const handleProceedToPay = async () => {
    if (paying) return;
    setPaying(true);
    setError('');
    try {
      // Step 1: Create Razorpay order on the backend
      const { data } = await createPaymentOrder();
      const { razorpayOrderId, amount, currency, keyId } = data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'ShopAI',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        theme: { color: '#f59e0b' },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast('Payment successful! Order placed.', 'success');
            setTimeout(() => navigate('/orders'), 1800);
          } catch (err) {
            showToast('Payment verification failed. Contact support.', 'error');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled.', 'error');
            setPaying(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        showToast('Payment failed: ' + response.error.description, 'error');
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      const msg = err?.response?.data || 'Failed to initiate payment. Please try again.';
      setError(msg);
      setPaying(false);
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
                  <div className="text-sm text-secondary">₹{item.product.price} per unit</div>
                </div>

                <div className="cart-item-actions">
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    ₹{(item.product.price * item.quantity).toFixed(2)}
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
              <span className="text-secondary">Items ({cartItems.reduce((a, i) => a + i.quantity, 0)})</span>
              <span>₹{totalValue.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="text-secondary">Delivery</span>
              <span style={{ color: 'var(--success-color)' }}>FREE</span>
            </div>
            <div style={{ height: '1px', background: 'var(--surface-border)', margin: '0.75rem 0' }} />
            <div className="summary-row total">
              <span>Total Amount</span>
              <span style={{ color: 'var(--primary-color)' }}>₹{totalValue.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                id="proceed-to-pay-btn"
                onClick={handleProceedToPay}
                className="btn btn-primary btn-lg btn-block"
                disabled={paying}
              >
                {paying ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="btn-spinner" />
                    Initiating Payment...
                  </span>
                ) : '💳 Proceed to Pay'}
              </button>
            </div>

            <Link to="/" className="btn btn-secondary btn-block mt-2" style={{ textAlign: 'center', display: 'block' }}>
              Continue Shopping
            </Link>

            <div className="payment-trust-row">
              <span>🔒 Secure</span>
              <span>⚡ Instant</span>
              <span>🏦 Razorpay</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Cart;
