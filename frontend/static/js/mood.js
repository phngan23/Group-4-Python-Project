// Mood Tracker Functionality với database thật
const moods = [
    { emoji: '😊', label: 'Happy', color: '#4CAF50', value: 'happy' },
    { emoji: '😢', label: 'Sad', color: '#2196F3', value: 'sad' },
    { emoji: '😴', label: 'Tired', color: '#FF9800', value: 'tired' },
    { emoji: '😤', label: 'Stressed', color: '#F44336', value: 'stressed' },
    { emoji: '🤩', label: 'Excited', color: '#9C27B0', value: 'excited' },
    { emoji: '😌', label: 'Calm', color: '#009688', value: 'calm' }
];

let userMoodData = {
    currentMood: null,
    weeklyDistribution: [],
    moodStats: {}
};

// FORM FUNCTIONALITY
function initializeMoodForm() {
    const moodOptions = document.getElementById('mood-options');
    const saveBtn = document.getElementById('save-mood-btn');
    
    if (!moodOptions) return;

    // Render mood options
    moodOptions.innerHTML = moods.map(mood => `
        <div class="mood-option" data-mood="${mood.value}">
            <div class="mood-icon">${mood.emoji}</div>
            <div class="mood-label">${mood.label}</div>
        </div>
    `).join('');
    
    // Add event listeners to mood options
    document.querySelectorAll('.mood-option').forEach(option => {
        option.addEventListener('click', function() {
            const mood = this.getAttribute('data-mood');
            selectMood(mood);
            
            document.querySelectorAll('.mood-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            
            saveBtn.disabled = false;
        });
    });
    
    saveBtn.addEventListener('click', function() {
        if (userMoodData.currentMood) {
            saveMoodToServer(userMoodData.currentMood);
        }
    });
    
    function selectMood(mood) {
        userMoodData.currentMood = mood;
    }
}

// VIEW FUNCTIONALITY
function initializeMoodView() {
    loadUserMoodData().then(() => {
        renderEmotionDistribution();
        renderMoodStats();
        updateCurrentMoodDisplay();
    });
}

function loadUserMoodData() {
    return fetch("/emotion/stats/")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                userMoodData = {
                    currentMood: data.current_mood,
                    weeklyDistribution: data.weekly_distribution || [],
                    moodStats: data.mood_stats || {}
                };
            } else {
                console.error('Error in response:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading mood data:', error);
            // Set default data for fallback
            userMoodData = {
                currentMood: null,
                weeklyDistribution: [],
                moodStats: {}
            };
        });
}

function renderEmotionDistribution() {
    const distributionElement = document.getElementById('emotion-distribution');
    if (!distributionElement) return;
    
    const distribution = userMoodData.weeklyDistribution || [];
    
    if (distribution.length === 0) {
        distributionElement.innerHTML = `
            <div class="empty-distribution">
                <i class="fas fa-chart-pie"></i>
                <p>No mood data available for the last 7 days</p>
                <p class="subtitle">Start tracking your mood to see the distribution</p>
            </div>
        `;
        return;
    }
    
    // Tìm count lớn nhất để tính chiều rộng %
    const maxCount = Math.max(...distribution.map(item => item.count));
    
    distributionElement.innerHTML = distribution.map(item => {
        const widthPercentage = maxCount > 0 ? (item.count / maxCount * 100) : 0;
        const hasEntries = item.count > 0;
        
        return `
            <div class="distribution-item">
                <div class="emotion-icon">${item.icon}</div>
                <div class="distribution-bar-container">
                    <div class="distribution-info">
                        <span class="emotion-label">${item.label}</span>
                        <span class="emotion-count">
                            ${item.count} ${item.count === 1 ? 'entry' : 'entries'} 
                            ${hasEntries ? `(${item.percentage}%)` : ''}
                        </span>
                    </div>
                    <div class="distribution-bar" 
                         style="width: ${hasEntries ? widthPercentage : 0}%; 
                                background: ${item.color};
                                opacity: ${hasEntries ? 1 : 0.5}">
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add animation delay for each bar
    setTimeout(() => {
        document.querySelectorAll('.distribution-bar').forEach((bar, index) => {
            bar.style.transition = `width 0.8s ease-in-out ${index * 0.1}s`;
        });
    }, 100);
}

function renderMoodStats() {
    const statsElement = document.getElementById('mood-stats');
    if (!statsElement) return;
    
    const stats = userMoodData.moodStats || {};
    const mostFrequentMoodConfig = moods.find(m => m.value === stats.most_frequent_emotion);
    
    statsElement.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Total Entries</div>
            <div class="stat-value">${stats.total_entries || 0}</div>
            <div class="stat-desc">All time mood records</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Most Frequent Mood</div>
            <div class="stat-value">
                ${mostFrequentMoodConfig ? mostFrequentMoodConfig.emoji + ' ' + mostFrequentMoodConfig.label : 'No data'}
            </div>
            <div class="stat-desc">
                ${stats.most_frequent_count ? `Appeared ${stats.most_frequent_count} times` : 'Start tracking to see'}
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Current Streak</div>
            <div class="stat-value">${stats.current_streak || 0} days</div>
            <div class="stat-desc">Consecutive days with mood entries</div>
        </div>
    `;
}

function updateCurrentMoodDisplay() {
    const moodElement = document.getElementById('current-mood');
    if (!moodElement) return;

    if (userMoodData.currentMood) {
        const moodConfig = moods.find(m => m.value === userMoodData.currentMood);
        if (moodConfig) {
            moodElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <span style="font-size: 1.5em;">${moodConfig.emoji}</span>
                    <span>${moodConfig.label}</span>
                </div>
            `;
            moodElement.style.color = moodConfig.color;
        } else {
            moodElement.textContent = userMoodData.currentMood;
            moodElement.style.color = '#6C63FF';
        }
    } else {
        moodElement.innerHTML = `
            <div style="color: #999; font-style: italic;">
                No mood set yet - <a href="#" onclick="location.reload()" style="color: var(--primary);">refresh</a>
            </div>
        `;
    }
}

function saveMoodToServer(mood) {
    const notes = document.getElementById('mood-notes')?.value || '';
    const sessionId = getCurrentSessionId(); // You might need to implement this
    
    fetch("/emotion/save-mood/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
            session_id: sessionId,
            emotion: mood,
            notes: notes
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            showNotification('Mood saved successfully!', 'success');
            // Redirect to history page after a short delay
            setTimeout(() => {
                window.location.href = "/emotion/history/";
            }, 1500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving mood:', error);
        showNotification('Error saving mood. Please try again.', 'error');
    });
}

// Helper function to get current session ID (you might need to implement this based on your app structure)
function getCurrentSessionId() {
    // Try to get session ID from URL if in form page
    const path = window.location.pathname;
    const match = path.match(/\/form\/(\d+)\//);
    if (match) {
        return match[1];
    }
    
    // Or get from hidden input if available
    const sessionInput = document.querySelector('input[name="session_id"]');
    if (sessionInput) {
        return sessionInput.value;
    }
    
    // Return a default or handle appropriately
    console.warn('Session ID not found');
    return null;
}

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `mood-notification mood-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#mood-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'mood-notification-styles';
        styles.textContent = `
            .mood-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .mood-notification-success { background: #4CAF50; }
            .mood-notification-error { background: #F44336; }
            .mood-notification-info { background: #2196F3; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .mood-notification.show {
                transform: translateX(0);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// CSRF token helper function
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

// Export functions for global access (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeMoodForm,
        initializeMoodView,
        loadUserMoodData,
        renderEmotionDistribution,
        renderMoodStats,
        updateCurrentMoodDisplay
    };
}