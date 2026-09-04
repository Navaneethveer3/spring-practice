import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { addToCart, deleteProduct, placeDirectOrder, verifyPayment } from '../services/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [buyQty, setBuyQty] = useState(1);
  const [buying, setBuying] = useState(false);

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
    setTimeout(() => setToast(null), 3500);
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
    if (buying) return;
    setBuying(true);
    try {
      // Create Razorpay order directly for this product
      const { data } = await placeDirectOrder(product.id, buyQty);
      const { razorpayOrderId, amount, currency, keyId } = data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'ShopAI',
        description: `Order: ${product.name}`,
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
            setBuying(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled.', 'error');
            setBuying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        showToast('Payment failed: ' + response.error.description, 'error');
        setBuying(false);
      });
      rzp.open();
    } catch (err) {
      showToast(err?.response?.data || 'Failed to initiate payment.', 'error');
      setBuying(false);
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
  const isOutOfStock = !product.quantity || product.quantity <= 0;

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
            <div style={{ width: '100%', height: '400px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '3rem' }}>
              🛍️
            </div>
          )}
        </div>

        {/* Product Details */}
        <div style={{ flex: '1.5', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
          {product.brand && <div className="product-brand-badge mb-2">{product.brand}</div>}
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', background: 'none', WebkitTextFillColor: 'var(--text-primary)' }}>{product.name}</h1>

          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '1rem' }}>
            ₹{product.price?.toLocaleString('en-IN')}
          </div>

          <div className={`stock-badge ${stock.class}`} style={{ marginBottom: '1.5rem' }}>
            {stock.text}
          </div>

          {product.description && (
            <div className="mb-4">
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

          {/* Payment Options Card */}
          {product.payments && product.payments.length > 0 && (
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-color)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                💳 Payment Offers & EMI
              </div>
              {product.payments.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {p.EMI && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--primary-color)' }}>🏦</span>
                      <span><strong>EMI:</strong> {p.EMI}</span>
                    </div>
                  )}
                  {p.credit && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#10b981' }}>💳</span>
                      <span><strong>Credit Card:</strong> {p.credit}</span>
                    </div>
                  )}
                  {p.debit && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#f59e0b' }}>💰</span>
                      <span><strong>Debit Card:</strong> {p.debit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: 'auto' }}>
            {role === 'ADMIN' ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to={`/edit-product/${product.id}`} className="btn btn-primary btn-lg" style={{ flex: 1 }}>Edit Product</Link>
                <button onClick={handleDelete} className="btn btn-danger btn-lg" style={{ flex: 1 }}>Delete Product</button>
              </div>
            ) : (
              <>
                {/* Quantity + Buy Now row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button
                      onClick={() => setBuyQty(q => Math.max(1, q - 1))}
                      disabled={buying || isOutOfStock}
                      style={{ padding: '0.5rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', cursor: 'pointer' }}
                    >−</button>
                    <span style={{ padding: '0.5rem 1rem', fontWeight: 700, minWidth: '2.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>{buyQty}</span>
                    <button
                      onClick={() => setBuyQty(q => Math.min(product.quantity, q + 1))}
                      disabled={buying || isOutOfStock}
                      style={{ padding: '0.5rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', cursor: 'pointer' }}
                    >+</button>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Total: <strong style={{ color: 'var(--primary-color)' }}>₹{(product.price * buyQty).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleAddToCart}
                    className="btn btn-secondary btn-lg"
                    style={{ flex: 1 }}
                    disabled={isOutOfStock}
                  >
                    🛒 Add to Cart
                  </button>
                  <button
                    id="buy-now-btn"
                    onClick={handleBuyNow}
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1 }}
                    disabled={isOutOfStock || buying}
                  >
                    {buying ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span className="btn-spinner" /> Initiating...
                      </span>
                    ) : '⚡ Buy Now'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
