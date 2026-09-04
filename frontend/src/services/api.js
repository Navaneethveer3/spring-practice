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
export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);
export const cancelOrder = (orderId) => api.post(`/orders/${orderId}/cancel`);

// ===== Payments API =====
export const createPaymentOrder = () => api.post('/payments/create-order');
export const verifyPayment = (paymentData) => api.post('/payments/verify', paymentData);
// Direct product order (Buy Now from product page)
export const placeDirectOrder = (prodId, quantity) => api.post(`/payments/create-order/${prodId}?quantity=${quantity}`);
// Refund a paid order
export const refundOrder = (orderId) => api.post(`/payments/refund/${orderId}`);

// ===== Profile API =====
export const getProfile = (username) => api.get(`/profile/${username}`);
export const updateProfile = (username, formData) => api.put(`/profile/${username}/update`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});

// ===== AI Chat API =====
/**
 * Opens a Server-Sent Events stream to the AI chat endpoint.
 * @param {string} prompt - The user's message
 * @param {number|null} productId - Current product ID if on a product page
 * @param {function} onChunk - Callback called with each streamed token
 * @param {function} onDone - Callback called when the stream closes
 * @param {function} onError - Callback called on error
 * @returns {EventSource} - The event source instance (call .close() to abort)
 */
export const streamChat = (prompt, productId, onChunk, onDone, onError) => {
  const token = localStorage.getItem('accessToken');
  const params = new URLSearchParams({ prompt });
  if (productId != null) params.append('productId', productId);

  // EventSource doesn't support custom headers natively, so we append token as a query param
  // The backend security config must allow this via a query-parameter token filter.
  // As a workaround we use fetch() with ReadableStream for proper auth header support.
  const controller = new AbortController();

  fetch(`${API_URL}/ai/chat?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
    },
    signal: controller.signal,
  }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const read = () => {
      reader.read().then(({ done, value }) => {
        if (done) { onDone(); return; }
        const text = decoder.decode(value, { stream: true });
        // SSE format: lines starting with "data:"
        const lines = text.split('\n');
        lines.forEach(line => {
          if (line.startsWith('data:')) {
            const chunk = line.slice(5).trimStart();
            if (chunk && chunk !== '[DONE]') onChunk(chunk);
          }
        });
        read();
      }).catch(err => {
        if (err.name !== 'AbortError') onError(err);
      });
    };
    read();
  }).catch(err => {
    if (err.name !== 'AbortError') onError(err);
  });

  // Return an object with a close method to let callers abort
  return { close: () => controller.abort() };
};

export default api;
