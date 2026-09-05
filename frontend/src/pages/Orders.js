import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, cancelOrder, refundOrder } from '../services/api';

const STATUS_CONFIG = {
  PAID:      { label: 'Paid',      color: 'var(--success-color)',  bg: 'rgba(34,197,94,0.12)',   icon: '✅' },
  PENDING:   { label: 'Pending',   color: 'var(--warning-color)',  bg: 'rgba(245,158,11,0.12)',  icon: '⏳' },
  FAILED:    { label: 'Failed',    color: 'var(--error-color)',    bg: 'rgba(239,68,68,0.12)',   icon: '❌' },
  CANCELLED: { label: 'Cancelled', color: 'var(--text-muted)',     bg: 'rgba(100,116,139,0.12)', icon: '🚫' },
  REFUNDED:  { label: 'Refunded',  color: '#a78bfa',               bg: 'rgba(167,139,250,0.12)', icon: '↩️' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const OrderCard = ({ order, onCancelOrRefund }) => {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const orderTotal = order.price || order.item?.reduce((acc, oi) => acc + (oi.product?.price || 0) * oi.quantity, 0) || 0;
  const firstItems = order.item?.slice(0, 2) || [];
  const extraCount = (order.item?.length || 0) - 2;

  const canCancel = order.status === 'PENDING' || order.status === 'PAID';

  return (
    <div className="order-card-v2">
      {/* ── Top bar ── */}
      <div className="ocv2-header">
        <div className="ocv2-header-left">
          <div className="ocv2-order-id">
            <span className="ocv2-label">Order ID</span>
            <span className="ocv2-value font-mono">#{order.id}</span>
          </div>
          <div className="ocv2-divider" />
          <div>
            <span className="ocv2-label">Placed on</span>
            <span className="ocv2-value">{formatDate(order.createdAt)}</span>
          </div>
          <div className="ocv2-divider" />
          <div>
            <span className="ocv2-label">Total</span>
            <span className="ocv2-value" style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '1rem' }}>
              ₹{orderTotal.toFixed ? orderTotal.toFixed(2) : orderTotal}
            </span>
          </div>
          <div className="ocv2-divider" />
          <div>
            <span className="ocv2-label">Items</span>
            <span className="ocv2-value">{order.item?.length || 0}</span>
          </div>
        </div>
        <div className="ocv2-header-right">
          <span
            className="ocv2-status-badge"
            style={{ color: status.color, background: status.bg }}
          >
            {status.icon} {status.label}
          </span>
          {canCancel && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onCancelOrRefund(order.id, order.status)}
            >
              {order.status === 'PAID' ? '↩️ Cancel & Refund' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      {/* ── Product Preview Strip ── */}
      <div className="ocv2-preview" onClick={() => setExpanded(e => !e)}>
        <div className="ocv2-preview-images">
          {firstItems.map((oi, idx) => (
            oi.product?.imageData ? (
              <img
                key={idx}
                src={`data:${oi.product.imageType};base64,${oi.product.imageData}`}
                alt={oi.product.name}
                className="ocv2-thumb"
                title={oi.product.name}
              />
            ) : (
              <div key={idx} className="ocv2-thumb ocv2-thumb-placeholder">📦</div>
            )
          ))}
          {extraCount > 0 && (
            <div className="ocv2-thumb ocv2-thumb-more">+{extraCount}</div>
          )}
        </div>
        <div className="ocv2-preview-names">
          {firstItems.map((oi, idx) => (
            <span key={idx} className="ocv2-product-name">{oi.product?.name}</span>
          ))}
          {extraCount > 0 && <span className="text-muted text-sm">& {extraCount} more</span>}
        </div>
        <button className="ocv2-expand-btn">
          {expanded ? '▲ Less' : '▼ Details'}
        </button>
      </div>

      {/* ── Expanded Detail Panel ── */}
      {expanded && (
        <div className="ocv2-detail-panel">
          {/* Items table */}
          <div className="ocv2-items-section">
            <h4 className="ocv2-section-title">Order Items</h4>
            <div className="ocv2-items-list">
              {order.item?.map((oi) => (
                <div key={oi.id} className="ocv2-item-row">
                  {oi.product?.imageData ? (
                    <img
                      src={`data:${oi.product.imageType};base64,${oi.product.imageData}`}
                      alt={oi.product.name}
                      className="ocv2-item-img"
                    />
                  ) : (
                    <div className="ocv2-item-img ocv2-item-img-placeholder">📦</div>
                  )}
                  <div className="ocv2-item-info">
                    <Link to={`/product/${oi.product?.id}`} className="ocv2-item-name">
                      {oi.product?.name}
                    </Link>
                    {oi.product?.brand && (
                      <div className="ocv2-item-brand">{oi.product.brand}</div>
                    )}
                  </div>
                  <div className="ocv2-item-qty">Qty: {oi.quantity}</div>
                  <div className="ocv2-item-price">
                    ₹{((oi.product?.price || 0) * oi.quantity).toFixed(2)}
                    <div className="ocv2-item-unit">₹{oi.product?.price} / unit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="ocv2-payment-section">
            <h4 className="ocv2-section-title">Payment Details</h4>
            <div className="ocv2-payment-grid">
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Payment Status</span>
                <span style={{ color: status.color, fontWeight: 600 }}>{status.icon} {status.label}</span>
              </div>
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Razorpay Order ID</span>
                <span className="ocv2-value font-mono text-sm">{order.razorpayOrderId || '—'}</span>
              </div>
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Payment ID</span>
                <span className="ocv2-value font-mono text-sm">{order.razorpayPaymentId || '—'}</span>
              </div>
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Amount Paid</span>
                <span className="ocv2-value" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                  ₹{orderTotal.toFixed ? orderTotal.toFixed(2) : orderTotal}
                </span>
              </div>
              {order.status === 'REFUNDED' && (
                <div className="ocv2-payment-row">
                  <span className="ocv2-label">Refund Status</span>
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>↩️ Refunded to original payment method</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrders();
    const handleOrdersUpdated = () => {
      fetchOrders();
    };
    window.addEventListener('orders-updated', handleOrdersUpdated);
    return () => window.removeEventListener('orders-updated', handleOrdersUpdated);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      // Sort newest first
      const sorted = (response.data || []).sort((a, b) => b.id - a.id);
      setOrders(sorted);
      setError('');
    } catch (err) {
      setError('Failed to fetch your orders.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancelOrRefund = async (orderId, status) => {
    const isPaid = status === 'PAID';
    const confirmMsg = isPaid
      ? 'This is a PAID order. Cancelling will initiate a full refund to your original payment method. Continue?'
      : 'Are you sure you want to cancel this order?';

    if (!window.confirm(confirmMsg)) return;

    try {
      if (isPaid) {
        await refundOrder(orderId);
        showToast('Order cancelled & refund initiated successfully!', 'success');
      } else {
        await cancelOrder(orderId);
        showToast('Order cancelled successfully.', 'success');
      }
      fetchOrders();
    } catch (err) {
      const msg = err?.response?.data || (isPaid ? 'Failed to process refund.' : 'Failed to cancel order.');
      showToast(msg, 'error');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="gradient-text mb-6">My Orders</h1>
        {[1, 2].map(i => (
          <div key={i} className="skeleton mb-4" style={{ height: '130px', borderRadius: '12px' }}></div>
        ))}
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.text}
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="gradient-text">My Orders</h1>
          <p className="text-muted text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/" className="btn btn-secondary btn-sm">← Continue Shopping</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {orders.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
          <Link to="/" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onCancelOrRefund={handleCancelOrRefund} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
