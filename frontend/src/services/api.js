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
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
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
          // Logout user if refresh fails
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Product API
export const getProducts = () => api.get('/products');
export const searchProducts = (keyword) => api.get(`/products/search?keyword=${keyword}`);
export const addProduct = (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Cart API
export const getCart = () => api.get('/cart');
export const getCartValue = () => api.get('/cart/get-cart-value');
export const addToCart = (productId) => api.post(`/cart/add?productId=${productId}`);
export const removeFromCart = (prodId) => api.delete(`/cart/delete?prodId=${prodId}`);
export const placeOrder = () => api.post('/cart/place-order');

// Orders API
export const getOrders = () => api.get('/orders');
export const cancelOrder = (orderId) => api.post(`/orders/${orderId}`);

export default api;
