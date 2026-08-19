import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, cancelOrder } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      setOrders(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch your orders.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      showToast('Order cancelled');
      fetchOrders();
    } catch (err) {
      showToast('Failed to cancel order', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="gradient-text mb-6">My Orders</h1>
        {[1, 2].map(i => (
          <div key={i} className="skeleton mb-4" style={{ height: '180px' }}></div>
        ))}
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
        <h1 className="gradient-text">My Orders</h1>
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
          {orders.map((order) => {
            const orderTotal = order.item?.reduce((acc, oi) => acc + (oi.product.price * oi.quantity), 0) || order.price || 0;

            return (
              <div key={order.id} className="order-card">
                {/* Order Header */}
                <div className="order-header">
                  <div className="flex gap-6 flex-wrap items-center">
                    <div>
                      <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</div>
                      <div className="font-bold">#{order.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                      <div className="font-bold" style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                        ${orderTotal.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</div>
                      <div className="font-semibold">{order.item?.length || 0} products</div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <span className="status-badge status-active">● Active</span>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-body">
                  {order.item?.map((orderItem) => (
                    <div key={orderItem.id} className="order-item-card">
                      {orderItem.product.imageData ? (
                        <img
                          src={`data:${orderItem.product.imageType};base64,${orderItem.product.imageData}`}
                          alt={orderItem.product.name}
                          className="order-item-image"
                        />
                      ) : (
                        <div className="order-item-image" style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          No Img
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm" style={{ marginBottom: '0.2rem' }}>{orderItem.product.name}</div>
                        <div className="text-xs text-muted">Qty: {orderItem.quantity} × ${orderItem.product.price}</div>
                        <div className="text-sm font-bold mt-1" style={{ color: 'var(--primary-color)' }}>
                          ${(orderItem.product.price * orderItem.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
