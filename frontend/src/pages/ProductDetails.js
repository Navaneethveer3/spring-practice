import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        navigate('/');
      } catch (err) {
        setError('Failed to delete product.');
      }
    }
  };

  if (loading) return <div className="container text-center mt-8">Loading...</div>;
  if (error) return <div className="container error-message mt-8">{error}</div>;
  if (!product) return <div className="container text-center mt-8">Product not found.</div>;

  return (
    <div className="container animate-fade-in">
      <Link to="/" className="btn btn-secondary mb-4">&larr; Back to Products</Link>
      
      <div className="glass-panel" style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          {product.imageData ? (
            <img 
              src={`data:${product.imageType};base64,${product.imageData}`} 
              alt={product.name} 
              style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '400px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image Available</div>
          )}
        </div>
        <div style={{ flex: '1.5', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>{product.name}</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{product.brand}</div>
          
          <div style={{ fontSize: '2.5rem', color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '2rem' }}>
            ${product.price}
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>Description</h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{product.description}</p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
             <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>Launch Date</h3>
             <p style={{ color: 'var(--text-secondary)' }}>{product.launchDate || 'Not specified'}</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
            <Link to={`/edit-product/${product.id}`} className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Edit Product</Link>
            <button onClick={handleDelete} className="btn btn-danger" style={{ padding: '1rem 2rem' }}>Delete Product</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
