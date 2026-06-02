const API_BASE = 'http://127.0.0.1:8080/products';

// Auth State
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const btnLogout = document.getElementById('btn-logout');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const productsContainer = document.getElementById('products-container');
const modal = document.getElementById('product-modal');
const closeBtn = document.querySelector('.close-btn');
const btnShowAdd = document.getElementById('btn-show-add');
const btnRefresh = document.getElementById('btn-refresh');
const btnSearch = document.getElementById('btn-search');
const searchInput = document.getElementById('search-input');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');
const toast = document.getElementById('toast');
const loading = document.getElementById('loading');
const imageUploadGroup = document.getElementById('image-upload-group');

// State
let isEditing = false;
let productsMap = {};

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);

function checkAuth() {
    if (accessToken && refreshToken) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        btnLogout.style.display = 'block';
        fetchProducts();
    } else {
        authSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        btnLogout.style.display = 'none';
    }
}

// Auth UI Toggles
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
});

// Auth Handlers
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch('http://127.0.0.1:8080/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Invalid credentials');
        const data = await res.json();
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        checkAuth();
        showToast('Logged in successfully!');
    } catch(err) {
        showToast(err.message, true);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    try {
        const res = await fetch('http://127.0.0.1:8080/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Registration failed (username might exist)');
        showToast('Registered successfully! Please log in.');
        tabLogin.click();
    } catch(err) {
        showToast(err.message, true);
    }
});

btnLogout.addEventListener('click', async () => {
    try {
        await fetchWithAuth('http://127.0.0.1:8080/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
    } catch(e) {} 
    doLogout();
});

function doLogout() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    checkAuth();
    showToast('Logged out');
}

// Custom Fetch Wrapper
async function fetchWithAuth(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${accessToken}`;

    let response = await fetch(url, options);

    if (response.status === 401 || response.status === 403) {
        try {
            const refreshRes = await fetch('http://127.0.0.1:8080/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!refreshRes.ok) throw new Error('Refresh failed');
            
            const data = await refreshRes.json();
            accessToken = data.accessToken;
            refreshToken = data.refreshToken;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            options.headers['Authorization'] = `Bearer ${accessToken}`;
            response = await fetch(url, options);
        } catch (err) {
            doLogout();
            throw new Error('Session expired. Please log in again.');
        }
    }
    return response;
}

// Event Listeners for Dashboard
btnShowAdd.addEventListener('click', () => openModal(false));
btnRefresh.addEventListener('click', fetchProducts);

btnSearch.addEventListener('click', async () => {
    const keyword = searchInput.value.trim();
    if (keyword) {
        await searchProducts(keyword);
    } else {
        await fetchProducts();
    }
});

searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const keyword = searchInput.value.trim();
        if (keyword) {
            await searchProducts(keyword);
        } else {
            await fetchProducts();
        }
    }
});

closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const price = document.getElementById('prod-price').value;
    const finalPrice = isNaN(parseInt(price, 10)) ? 0 : parseInt(price, 10);
    const brand = document.getElementById('prod-brand').value;
    const launchDate = document.getElementById('prod-launch-date').value;
    const imageFile = document.getElementById('prod-image').files[0];

    if (imageFile && imageFile.size > 200 * 1024) {
        showToast('Image exceeds 200KB limit', true);
        return;
    }

    try {
        const product = { 
            name, 
            price: finalPrice,
            brand: brand || null,
            launchDate: launchDate || null
        };
        
        if (isEditing) {
            product.id = parseInt(id);
            const existingProduct = productsMap[id];
            if (existingProduct && !imageFile) {
                product.imageName = existingProduct.imageName;
                product.imageType = existingProduct.imageType;
                product.imageData = existingProduct.imageData;
            }
        }

        const formData = new FormData();
        const productFile = new File(
            [JSON.stringify(product)], 
            'product.json', 
            { type: 'application/json' }
        );
        formData.append('prod', productFile);
        
        if (imageFile) {
            formData.append('image', imageFile);
        } else if (!isEditing) {
            showToast('Please select an image', true);
            return;
        }

        let url = API_BASE;
        let method = 'POST';
        if (isEditing) {
            url = `${API_BASE}/${id}`;
            method = 'PUT';
        }

        const response = await fetchWithAuth(url, {
            method: method,
            body: formData
        });

        if (!response.ok) throw new Error(isEditing ? 'Failed to update product' : 'Failed to add product');
        showToast(isEditing ? 'Product updated successfully!' : 'Product added successfully!');

        closeModal();
        fetchProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message, true);
    }
});

// Functions
async function fetchProducts() {
    showLoading(true);
    productsContainer.innerHTML = '';
    
    try {
        const response = await fetchWithAuth(API_BASE);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const products = await response.json();
        
        productsMap = {};
        products.forEach(p => productsMap[p.id] = p);
        
        renderProducts(products);
    } catch (error) {
        console.error(error);
        showToast(error.message, true);
    } finally {
        showLoading(false);
    }
}

async function searchProducts(keyword) {
    showLoading(true);
    productsContainer.innerHTML = '';
    
    try {
        const response = await fetchWithAuth(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) throw new Error('Failed to search products');
        
        const products = await response.json();
        
        productsMap = {};
        products.forEach(p => productsMap[p.id] = p);
        
        renderProducts(products);
    } catch (error) {
        console.error(error);
        showToast(error.message, true);
    } finally {
        showLoading(false);
    }
}

function renderProducts(products) {
    if (products.length === 0) {
        productsContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No products found. Add one to get started!</p>`;
        return;
    }

    productsContainer.innerHTML = products.map(product => {
        let imgSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23eeeeee'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' text-anchor='middle' fill='%23999999' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
        if (product.imageData) {
            imgSrc = `data:${product.imageType || 'image/jpeg'};base64,${product.imageData}`;
        }

        const escapedName = product.name.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const errorImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23ffdddd'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' text-anchor='middle' fill='%23cc0000' dy='.3em'%3EImage Error%3C/text%3E%3C/svg%3E";

        return `
            <div class="product-card">
                <img src="${imgSrc}" alt="${escapedName}" class="product-image" onerror="this.onerror=null; this.src='${errorImg}'">
                <div class="product-info">
                    <h3>${product.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>
                    <div class="price">$${product.price}</div>
                    <div class="details">
                        ${product.brand ? `<div><strong>Brand:</strong> ${product.brand.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ''}
                        ${product.launchDate ? `<div><strong>Launched:</strong> ${product.launchDate}</div>` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn edit-btn" onclick="openModal(true, ${product.id})">Edit</button>
                    <button class="btn danger-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetchWithAuth(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete product');
        
        showToast('Product deleted successfully!');
        fetchProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message, true);
    }
}

function openModal(editMode, id = '') {
    isEditing = editMode;
    modalTitle.textContent = editMode ? 'Edit Product' : 'Add New Product';
    
    let product = editMode && id ? productsMap[id] : null;

    document.getElementById('prod-id').value = product ? product.id : '';
    document.getElementById('prod-name').value = product ? product.name : '';
    document.getElementById('prod-price').value = product ? product.price : '';
    document.getElementById('prod-brand').value = product && product.brand ? product.brand : '';
    document.getElementById('prod-launch-date').value = product && product.launchDate ? product.launchDate : '';
    
    imageUploadGroup.style.display = 'block';
    if (editMode) {
        document.getElementById('prod-image').removeAttribute('required');
    } else {
        document.getElementById('prod-image').setAttribute('required', 'required');
        document.getElementById('prod-image').value = ''; 
    }

    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
    productForm.reset();
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}
