import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [product, setProduct] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    quantity: '',
    launchDate: '',
    payments: [{ EMI: '', credit: '', debit: '' }]
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const response = await api.get(`/products/${id}`);
          const { name, brand, description, price, quantity, launchDate, imageData, imageType, payments } = response.data;
          setProduct({
            name,
            brand,
            description,
            price,
            quantity: quantity || '',
            launchDate: launchDate || '',
            payments: payments && payments.length > 0
              ? payments.map(p => ({ EMI: p.EMI || '', credit: p.credit || '', debit: p.debit || '' }))
              : [{ EMI: '', credit: '', debit: '' }]
          });
          if (payments && payments.some(p => p.EMI || p.credit || p.debit)) {
            setShowPaymentSection(true);
          }
          if (imageData) {
            setPreview(`data:${imageType};base64,${imageData}`);
          }
        } catch (err) {
          setError('Failed to fetch product details.');
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (field, value) => {
    setProduct(prev => ({
      ...prev,
      payments: [{ ...prev.payments[0], [field]: value }]
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Only include payments if user filled at least one field
      const payment = product.payments[0];
      const hasPayment = payment.EMI || payment.credit || payment.debit;
      const productPayload = {
        ...product,
        payments: hasPayment ? product.payments : []
      };

      const formData = new FormData();
      const productBlob = new Blob([JSON.stringify(productPayload)], { type: 'application/json' });
      formData.append('prod', productBlob);

      if (image) {
        formData.append('image', image);
      }

      if (isEdit) {
        await api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data || `Failed to ${isEdit ? 'update' : 'add'} product. Ensure all fields are correct and image is under 200KB.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <Link to="/" className="btn btn-secondary btn-sm mb-6">← Back to Products</Link>

      <div className="glass-panel" style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>
        <h2 className="text-center mb-6" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* ── Core product fields ── */}
          <div className="grid grid-cols-1 grid-cols-2" style={{ gap: '1.5rem' }}>
            <div>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" name="name" className="form-control" value={product.name} onChange={handleInputChange} required placeholder="e.g. iPhone 15 Pro" />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" name="brand" className="form-control" value={product.brand} onChange={handleInputChange} required placeholder="e.g. Apple" />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" name="price" className="form-control" value={product.price} onChange={handleInputChange} required min="0" placeholder="0" />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" name="quantity" className="form-control" value={product.quantity} onChange={handleInputChange} min="0" placeholder="0" />
              </div>
              <div className="form-group">
                <label>Launch Date</label>
                <input type="date" name="launchDate" className="form-control" value={product.launchDate} onChange={handleInputChange} />
              </div>
            </div>

            <div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" className="form-control" value={product.description} onChange={handleInputChange} required style={{ minHeight: '140px' }} placeholder="Describe the product..." />
              </div>
              <div className="form-group">
                <label>Product Image</label>
                <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
                <p className="text-xs text-muted mt-1">Max file size: 200KB</p>
                {preview && (
                  <div className="mt-4">
                    <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Payment Options Section ── */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowPaymentSection(s => !s)}
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--primary-color)',
                padding: '0.65rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                justifyContent: 'space-between',
                transition: 'background 0.2s',
              }}
            >
              <span>💳 Payment Offers & EMI Options (Optional)</span>
              <span>{showPaymentSection ? '▲' : '▼'}</span>
            </button>

            {showPaymentSection && (
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <p className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>
                  These details will be shown on the product page and used by the AI assistant to answer customer questions.
                </p>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>🏦 EMI Options</label>
                  <input
                    type="text"
                    className="form-control"
                    value={product.payments[0].EMI}
                    onChange={e => handlePaymentChange('EMI', e.target.value)}
                    placeholder="e.g. No Cost EMI up to 12 months with HDFC & ICICI"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>💳 Credit Card Offers</label>
                  <input
                    type="text"
                    className="form-control"
                    value={product.payments[0].credit}
                    onChange={e => handlePaymentChange('credit', e.target.value)}
                    placeholder="e.g. Instant discount of ₹5,000 on HDFC Credit Cards"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>💰 Debit Card Offers</label>
                  <input
                    type="text"
                    className="form-control"
                    value={product.payments[0].debit}
                    onChange={e => handlePaymentChange('debit', e.target.value)}
                    placeholder="e.g. Flat ₹2,000 cashback on ICICI Debit Card EMI"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6" style={{ gap: '1rem' }}>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1 }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
