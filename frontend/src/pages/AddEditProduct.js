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
    launchDate: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const response = await api.get(`/products/${id}`);
          const { name, brand, description, price, launchDate, imageData, imageType } = response.data;
          setProduct({ name, brand, description, price, launchDate: launchDate || '' });
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
      const formData = new FormData();
      // The backend expects "prod" as a RequestPart (Product object)
      const productBlob = new Blob([JSON.stringify(product)], { type: 'application/json' });
      formData.append('prod', productBlob);
      
      if (image) {
        formData.append('image', image);
      } else if (!isEdit) {
        // If it's a new product, require an image if possible. But backend might handle it.
        // The backend expects @RequestPart("image") MultipartFile image.
        // We can append an empty blob if there's no image just in case, but let's assume it's handled.
      }

      if (isEdit) {
        await api.put(`/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(`Failed to ${isEdit ? 'update' : 'add'} product. Ensure all fields are correct.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <Link to="/" className="btn btn-secondary mb-4">&larr; Back to Products</Link>
      
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 grid-cols-2" style={{ gap: '2rem' }}>
            <div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" className="form-control" value={product.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" name="brand" className="form-control" value={product.brand} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input type="number" name="price" className="form-control" value={product.price} onChange={handleInputChange} required min="0" />
              </div>
              <div className="form-group">
                <label>Launch Date</label>
                <input type="date" name="launchDate" className="form-control" value={product.launchDate} onChange={handleInputChange} />
              </div>
            </div>

            <div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" className="form-control" value={product.description} onChange={handleInputChange} required style={{ minHeight: '120px', resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Product Image</label>
                <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
                {preview && (
                  <div style={{ marginTop: '1rem' }}>
                    <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
