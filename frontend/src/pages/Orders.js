import React, { useState, useEffect } from 'react';
import { getOrders, cancelOrder } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      setOrders(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch your orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      alert('Order cancelled successfully!');
      fetchOrders();
    } catch (err) {
      alert('Failed to cancel order.');
    }
  };

  if (loading) return <div className="container text-center mt-8">Loading Orders...</div>;

  return (
    <div className="container animate-fade-in">
      <h1 className="mb-8">Order History</h1>

      {error && <div className="error-message">{error}</div>}

      {orders.length === 0 ? (
        <div className="glass-panel text-center py-12">
          <h3 style={{ color: 'var(--text-secondary)' }}>You have no past orders</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1">
          {orders.map((order) => {
            // Calculate total for order (if backend doesn't provide it directly)
            const orderTotal = order.item.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

            return (
              <div key={order.id} className="glass-panel mb-6" style={{ padding: '2rem' }}>
                <div className="flex justify-between items-center mb-6 border-b" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Order #{order.id}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Status: Active
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      Total: ${orderTotal.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => handleCancelOrder(order.id)} 
                      className="btn btn-danger mt-2" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>

                <div className="order-items-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.item.map((orderItem) => (
                    <div key={orderItem.id} className="flex items-center gap-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                      {orderItem.product.imageData ? (
                        <img 
                          src={`data:${orderItem.product.imageType};base64,${orderItem.product.imageData}`} 
                          alt={orderItem.product.name} 
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      ) : (
                        <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                          No Img
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{orderItem.product.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Qty: {orderItem.quantity} x ${orderItem.product.price}
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
