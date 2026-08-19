import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { addToCart } from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const role = localStorage.getItem('role');

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
    if (!searchTerm.trim()) {
      return fetchProducts();
    }
    try {
      setLoading(true);
      const response = await api.get(`/products/search?keyword=${searchTerm}`);
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to search products.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId);
      alert('Product added to cart!');
    } catch (err) {
      alert('Failed to add to cart. Please try again.');
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-8">
        <h1>Our Products</h1>
        {role === 'ADMIN' && (
          <Link to="/add-product" className="btn btn-primary">Add New Product</Link>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-8" style={{ display: 'flex', gap: '1rem', maxWidth: '500px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="text-center mt-8">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center mt-8 glass-panel">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 animate-fade-in">
          {products.map((product) => (
            <div key={product.id} className="product-card glass-panel">
              {product.imageData ? (
                <img 
                  src={`data:${product.imageType};base64,${product.imageData}`} 
                  alt={product.name} 
                  className="product-image"
                />
              ) : (
                <div className="product-image flex items-center" style={{ justifyContent: 'center' }}>No Image</div>
              )}
              <div className="product-info">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="product-title" style={{ margin: 0 }}>{product.name}</h3>
                </div>
                <div className="product-brand">{product.brand}</div>
                <div className="product-price">${product.price}</div>
                <div className="product-actions">
                  <Link to={`/product/${product.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }}>View</Link>
                  {role === 'ADMIN' ? (
                    <Link to={`/edit-product/${product.id}`} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Edit</Link>
                  ) : (
                    <button onClick={() => handleAddToCart(product.id)} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Add to Cart</button>
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
