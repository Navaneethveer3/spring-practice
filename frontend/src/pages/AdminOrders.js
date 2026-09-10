import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSuccessfulOrders } from '../services/api';

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
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

const AdminOrderCard = ({ successRecord }) => {
  const [expanded, setExpanded] = useState(false);
  const order = successRecord.order || {};
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PAID;
  const orderTotal = order.price || order.item?.reduce((acc, oi) => acc + (oi.product?.price || 0) * oi.quantity, 0) || 0;
  const items = order.item || [];

  return (
    <div className="order-card-v2" style={{ borderLeft: '4px solid var(--success-color)' }}>
      {/* ── Top bar ── */}
      <div className="ocv2-header">
        <div className="ocv2-header-left">
          <div className="ocv2-order-id">
            <span className="ocv2-label">Order ID</span>
            <span className="ocv2-value font-mono">#{order.id || successRecord.id}</span>
          </div>
          <div className="ocv2-divider" />
          <div>
            <span className="ocv2-label">Placed Time</span>
            <span className="ocv2-value">
              {formatDate(order.createdAt)}
              {order.createdAt && (
                <span className="text-muted text-xs" style={{ marginLeft: '0.4rem' }}>
                  ({formatTimeAgo(order.createdAt)})
                </span>
              )}
            </span>
          </div>
          <div className="ocv2-divider" />
          <div>
            <span className="ocv2-label">Amount Received</span>
            <span className="ocv2-value" style={{ color: 'var(--success-color)', fontWeight: 700, fontSize: '1.05rem' }}>
              ₹{Number(orderTotal).toFixed(2)}
            </span>
          </div>
          <div className="ocv2-divider" />
          <div>
            <span className="ocv2-label">Items Count</span>
            <span className="ocv2-value">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="ocv2-header-right">
          <span
            className="ocv2-status-badge"
            style={{ color: status.color, background: status.bg }}
          >
            {status.icon} {status.label}
          </span>
          <button
            onClick={() => setExpanded(e => !e)}
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: '0.5rem' }}
          >
            {expanded ? '▲ Hide Details' : '▼ View Items'}
          </button>
        </div>
      </div>

      {/* ── Product Preview Strip ── */}
      <div className="ocv2-preview" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        <div className="ocv2-preview-images">
          {items.slice(0, 3).map((oi, idx) => (
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
          {items.length > 3 && (
            <div className="ocv2-thumb ocv2-thumb-more">+{items.length - 3}</div>
          )}
        </div>
        <div className="ocv2-preview-names">
          {items.slice(0, 3).map((oi, idx) => (
            <span key={idx} className="ocv2-product-name">
              {oi.product?.name || 'Product'} <span className="text-muted">(×{oi.quantity})</span>
            </span>
          ))}
          {items.length > 3 && <span className="text-muted text-sm">& {items.length - 3} more</span>}
        </div>
      </div>

      {/* ── Expanded Detail Panel ── */}
      {expanded && (
        <div className="ocv2-detail-panel animate-fade-in">
          {/* Items Section */}
          <div className="ocv2-items-section">
            <h4 className="ocv2-section-title">Purchased Items</h4>
            <div className="ocv2-items-list">
              {items.map((oi, index) => (
                <div key={oi.id || index} className="ocv2-item-row">
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
                    <div className="ocv2-item-name font-semibold">{oi.product?.name || 'Item'}</div>
                    {oi.product?.brand && (
                      <div className="ocv2-item-brand text-muted text-xs">{oi.product.brand}</div>
                    )}
                  </div>
                  <div className="ocv2-item-qty">Qty: {oi.quantity}</div>
                  <div className="ocv2-item-price">
                    ₹{((oi.product?.price || 0) * oi.quantity).toFixed(2)}
                    <div className="ocv2-item-unit">₹{oi.product?.price} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="ocv2-payment-section">
            <h4 className="ocv2-section-title">Payment & Gateway Info</h4>
            <div className="ocv2-payment-grid">
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Razorpay Order ID</span>
                <span className="ocv2-value font-mono text-sm">{order.razorpayOrderId || '—'}</span>
              </div>
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Razorpay Payment ID</span>
                <span className="ocv2-value font-mono text-sm">{order.razorpayPaymentId || '—'}</span>
              </div>
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Payment Status</span>
                <span style={{ color: status.color, fontWeight: 600 }}>{status.icon} {status.label}</span>
              </div>
              <div className="ocv2-payment-row">
                <span className="ocv2-label">Notification Record ID</span>
                <span className="ocv2-value font-mono text-sm">#{successRecord.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const previousCountRef = useRef(0);

  const fetchSuccessfulOrders = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const response = await getSuccessfulOrders();
      const data = Array.isArray(response.data) ? response.data : [];

      // Sort newest first by order id or creation time
      const sorted = [...data].sort((a, b) => {
        const timeA = new Date(a.order?.createdAt || 0).getTime();
        const timeB = new Date(b.order?.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (b.order?.id || b.id) - (a.order?.id || a.id);
      });

      // Detect new incoming order when polling
      if (isPolling && sorted.length > previousCountRef.current && previousCountRef.current > 0) {
        const newCount = sorted.length - previousCountRef.current;
        const latest = sorted[0];
        const latestAmt = latest.order?.price ? `(₹${latest.order.price})` : '';
        setToast({
          text: newCount > 1
            ? `🔔 ${newCount} New Orders Received!`
            : `🔔 New Order Received! Order #${latest.order?.id || latest.id} placed ${latestAmt}`,
          type: 'success'
        });
        setTimeout(() => setToast(null), 5000);
      }

      previousCountRef.current = sorted.length;
      setOrders(sorted);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      if (!isPolling) {
        setError('Failed to fetch successful customer orders. Please ensure you are logged in as Admin.');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSuccessfulOrders(false);
  }, [fetchSuccessfulOrders]);

  // Live polling every 5 seconds so admin is notified the moment a user places an order
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchSuccessfulOrders(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSuccessfulOrders]);

  // Filtered orders
  const filteredOrders = orders.filter(rec => {
    const o = rec.order || {};
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;

    const matchesId = String(o.id || rec.id).includes(query);
    const matchesRzOrderId = (o.razorpayOrderId || '').toLowerCase().includes(query);
    const matchesRzPaymentId = (o.razorpayPaymentId || '').toLowerCase().includes(query);
    const matchesProduct = (o.item || []).some(oi =>
      (oi.product?.name || '').toLowerCase().includes(query) ||
      (oi.product?.brand || '').toLowerCase().includes(query)
    );

    return matchesId || matchesRzOrderId || matchesRzPaymentId || matchesProduct;
  });

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, rec) => sum + (rec.order?.price || 0), 0);
  const totalItemsSold = orders.reduce((sum, rec) => {
    const items = rec.order?.item || [];
    return sum + items.reduce((iSum, oi) => iSum + (oi.quantity || 0), 0);
  }, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="container animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999 }}>
          <div className={`toast toast-${toast.type}`} style={{ minWidth: '320px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
            {toast.text}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="gradient-text">Customer Orders</h1>
            {autoRefresh && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(34,197,94,0.15)',
                  color: 'var(--success-color)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-color)',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                Live Updates Active
              </span>
            )}
          </div>
          <p className="text-muted text-sm mt-1">
            Real-time feed of successful customer orders received upon checkout.
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>

        <div className="page-header-actions flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(r => !r)}
            className={`btn btn-sm ${autoRefresh ? 'btn-secondary' : 'btn-primary'}`}
            title="Toggle automatic background updates"
          >
            {autoRefresh ? '⏸ Pause Auto-Refresh' : '▶ Enable Auto-Refresh'}
          </button>
          <button
            onClick={() => fetchSuccessfulOrders(false)}
            className="btn btn-secondary btn-sm"
            title="Manual Refresh"
          >
            🔄 Refresh
          </button>
          <Link to="/" className="btn btn-secondary btn-sm">← Back to Store</Link>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 grid-cols-2 grid-cols-3" style={{ gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Total Successful Orders</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {orders.length}
          </div>
          <div className="text-xs text-muted mt-1">Confirmed customer orders</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Total Revenue</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-color)' }}>
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted mt-1">Total payments collected</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Total Items Sold</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-color)' }}>
            {totalItemsSold}
          </div>
          <div className="text-xs text-muted mt-1">Avg Order Value: ₹{avgOrderValue.toFixed(0)}</div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex gap-3 mb-6" style={{ maxWidth: '600px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Filter by Order #, Razorpay ID, or Product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchTerm('')}>
            ✕ Clear
          </button>
        )}
      </div>

      {error && <div className="error-message mb-4">{error}</div>}

      {/* ── Orders Content ── */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '12px' }}></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>{searchTerm ? 'No matching orders found' : 'No customer orders yet'}</h3>
          <p>
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'When customers complete payments at checkout, their orders will appear here automatically in real time.'}
          </p>
          {searchTerm && (
            <button className="btn btn-secondary mt-3" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((rec) => (
            <AdminOrderCard key={rec.id} successRecord={rec} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
