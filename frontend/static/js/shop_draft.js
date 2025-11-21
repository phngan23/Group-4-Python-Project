// Shop với data thật
let shopItems = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadShopItems();
    setupEventListeners();
});

function setupEventListeners() {
    // Category filters
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentCategory = this.getAttribute('data-category');
            
            // Update active state
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
            filterItems();
        });
    });
}

function loadShopItems() {
    fetch('/shop/api/shop/items/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                shopItems = data.items;
                renderShopItems();
            } else {
                showError('Failed to load shop items');
            }
        })
        .catch(error => {
            console.error('Error loading shop items:', error);
            showError('Error loading shop items');
        });
}

function renderShopItems() {
    filterItems();
}

function filterItems() {
    const container = document.getElementById('shop-items');
    
    let filteredItems = shopItems;
    if (currentCategory !== 'all') {
        filteredItems = shopItems.filter(item => item.category === currentCategory);
    }
    
    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <i class="fas fa-store-slash"></i>
                <p>No items available in this category.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredItems.map(item => {
        return `
            <div class="character-card ${item.is_owned ? 'unlocked' : 'locked'}">

                <div class="character-avatar">
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
                    <div class="character-emoji">${item.emoji || ''}</div>
                    ${item.is_owned ? '' : '<div class="lock-icon">🔒</div>'}
                </div>

                <div class="character-name">${item.name}</div>

                <div class="character-status ${item.is_owned ? 'unlocked' : 'locked'}">
                    ${item.is_owned ? 'UNLOCKED' : 'LOCKED'}
                </div>

                ${item.is_owned ? '' : `<div class="character-price">Price: ${item.price} Coins</div>`}

                <div class="character-actions">
                    ${item.is_owned
                        ? `<button class="select-btn" onclick="selectOwned(${item.id})">SELECT</button>`
                        : `<button class="unlock-btn" onclick="openPurchaseModal(${item.id})">UNLOCK</button>`
                    }
                </div>
                
            </div>
        `;
    }).join('');
}

function openPurchaseModal(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="purchase-details">
            <div class="item-image-large">${item.image}</div>
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <div class="price-section">
                    <span class="price">${item.price} coins</span>
                </div>
            </div>
        </div>
    `;
    
    // Update confirm button
    const confirmBtn = document.getElementById('confirm-purchase');
    confirmBtn.onclick = () => purchaseItem(itemId);
    
    // Show modal
    document.getElementById('purchase-modal').classList.add('active');
}

function closePurchaseModal() {
    document.getElementById('purchase-modal').classList.remove('active');
}

function purchaseItem(itemId) {
    fetch(`/shop/buy/${itemId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('Item purchased successfully!', 'success');
            closePurchaseModal();
            
            // Update coins display
            updateCoinsDisplay(data.new_balance);
            
            // Reload shop items to update owned status
            loadShopItems();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error purchasing item:', error);
        showNotification('Error purchasing item', 'error');
    });
}

function updateCoinsDisplay(newBalance) {
    const coinElements = document.querySelectorAll('.coins-amount');
    coinElements.forEach(element => {
        element.textContent = newBalance;
    });
    
    // Also update header coins
    const headerCoins = document.getElementById('coinCount');
    if (headerCoins) {
        headerCoins.textContent = newBalance;
    }
}

function showError(message) {
    const container = document.getElementById('shop-items');
    container.innerHTML = `
        <div class="no-items error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Close modal khi click outside
document.getElementById('purchase-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        closePurchaseModal();
    }
});

// ESC key để close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePurchaseModal();
    }
});

// Helper function để lấy CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showNotification(message, type = 'info') {
    // Sử dụng cùng notification system
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}