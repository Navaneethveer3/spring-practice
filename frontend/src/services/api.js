import axios from 'axios';

const API_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401/403 errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/refresh`, { refreshToken });
          if (res.status === 200) {
            localStorage.setItem('accessToken', res.data.accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (err) {
          console.error('Refresh token expired or invalid', err);
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ===== Auth API =====
export const login = (credentials) => api.post('/login', credentials);
export const register = (credentials) => api.post('/register', credentials);
export const logout = (refreshToken) => api.post('/logout', { refreshToken });
export const resetPassword = (password) => api.post('/reset-password', { password });

// ===== Product API =====
export const getProducts = () => api.get('/products');
export const getProductById = (id) => api.get(`/products/${id}`);
export const searchProducts = (keyword) => api.get(`/products/search?keyword=${keyword}`);
export const addProduct = (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
export const updateProduct = (id, formData) => api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ===== Cart API =====
export const getCart = () => api.get('/cart');
export const getCartValue = () => api.get('/cart/get-cart-value');
export const addToCart = (productId) => api.post(`/cart/add?productId=${productId}`);
export const removeFromCart = (prodId) => api.delete(`/cart/delete?prodId=${prodId}`);
export const clearCart = () => api.post('/cart/clear-cart');
export const placeOrder = () => api.post('/cart/place-order');

// ===== Orders API =====
export const getOrders = () => api.get('/orders');
export const cancelOrder = (orderId) => api.post(`/orders/${orderId}`);

// ===== Profile API =====
export const getProfile = (username) => api.get(`/profile/${username}`);
export const updateProfile = (username, formData) => api.put(`/profile/${username}/update`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});

export default api;
