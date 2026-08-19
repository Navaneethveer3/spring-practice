import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getCartValue, removeFromCart, placeOrder } from '../services/api';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const [cartRes, valueRes] = await Promise.all([
        getCart(),
        getCartValue()
      ]);
      setCartItems(cartRes.data);
      setTotalValue(valueRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load cart data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      fetchCartData(); // Refresh cart
    } catch (err) {
      alert('Failed to remove item.');
    }
  };

  const handleCheckout = async () => {
    try {
      await placeOrder();
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      alert('Checkout failed.');
    }
  };

  if (loading) return <div className="container text-center mt-8">Loading Cart...</div>;

  return (
    <div className="container animate-fade-in">
      <h1 className="mb-8">Your Shopping Cart</h1>
      
      {error && <div className="error-message">{error}</div>}

      {cartItems.length === 0 ? (
        <div className="glass-panel text-center py-12">
          <h3 style={{ color: 'var(--text-secondary)' }}>Your cart is empty</h3>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
          
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="glass-panel mb-4 flex justify-between items-center" style={{ padding: '1rem 1.5rem' }}>
                <div className="flex items-center gap-4">
                  {item.product.imageData ? (
                    <img 
                      src={`data:${item.product.imageType};base64,${item.product.imageData}`} 
                      alt={item.product.name} 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      No Image
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{item.product.name}</h3>
                    <div style={{ color: 'var(--text-secondary)' }}>${item.product.price} x {item.quantity}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => handleRemove(item.product.id)} 
                    className="btn btn-danger" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel sticky" style={{ top: '100px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Order Summary</h2>
            <div className="flex justify-between mb-4" style={{ fontSize: '1.1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Items</span>
              <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between mb-6" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <span>Total Value</span>
              <span style={{ color: 'var(--primary-color)' }}>${totalValue.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            >
              Checkout Now
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default Cart;
