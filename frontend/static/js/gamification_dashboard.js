// Gamification Dashboard với data thật
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventListeners();
});

function setupEventListeners() {
    // Các event listeners cho quick actions
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.querySelector('span').textContent.toLowerCase();
            handleQuickAction(action);
        });
    });
}

function loadDashboardData() {
    // Trong thực tế sẽ gọi API để lấy data
    // Hiện tại dùng dummy data
    updateDashboardUI();
}

function updateDashboardUI() {
    // Cập nhật coins từ profile
    const coinCount = document.getElementById('coinCount');
    if (coinCount) {
        // Trong thực tế sẽ lấy từ API
        coinCount.textContent = coinCount.textContent; 
    }
}

function handleQuickAction(action) {
    switch(action) {
        case 'daily reward':
            claimDailyReward();
            break;
        case 'achievements':
            viewAchievements();
            break;
        case 'shop':
            openShop();
            break;
        case 'leaderboard':
            viewLeaderboard();
            break;
        default:
            console.log('Action not implemented:', action);
    }
}

function claimDailyReward() {
    // Simulate API call
    showNotification('🎁 Daily reward claimed! +50 coins', 'success');
    
    // Update coins display
    updateCoinsDisplay(50);
}

function viewAchievements() {
    window.location.href = '/visualization/achievements/';
}

function openShop() {
    window.location.href = '/gamification/shop/';
}

function viewLeaderboard() {
    showNotification('🏆 Leaderboard feature coming soon!', 'info');
}

function updateCoinsDisplay(coinsToAdd) {
    const coinElement = document.getElementById('coinCount');
    if (coinElement) {
        const currentCoins = parseInt(coinElement.textContent) || 0;
        const newCoins = currentCoins + coinsToAdd;
        coinElement.textContent = newCoins;
        
        // Animation
        coinElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            coinElement.style.transform = 'scale(1)';
        }, 300);
    }
}

function showNotification(message, type = 'info') {
    // Tạo notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Thêm styles nếu chưa có
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 10px;
                padding: 15px 20px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                animation: slideIn 0.3s ease;
                border-left: 4px solid #6C63FF;
            }
            .notification.success { border-left-color: #4CAF50; }
            .notification.error { border-left-color: #F44336; }
            .notification.info { border-left-color: #2196F3; }
            .notification-warning { border-left-color: #FF9800; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                color: #666;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Tự động xóa sau 5 giây
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
            case '1':
                event.preventDefault();
                claimDailyReward();
                break;
            case '2':
                event.preventDefault();
                openShop();
                break;
        }
    }
});