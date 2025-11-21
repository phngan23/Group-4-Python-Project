// Mood Tracker Functionality với database thật
const moods = [
    { emoji: '😊', label: 'Happy', color: '#4CAF50', value: 'happy' },
    { emoji: '😢', label: 'Sad', color: '#2196F3', value: 'sad' },
    { emoji: '😴', label: 'Tired', color: '#FF9800', value: 'tired' },
    { emoji: '😤', label: 'Stressed', color: '#F44336', value: 'stressed' },
    { emoji: '😃', label: 'Excited', color: '#9C27B0', value: 'excited' },
    { emoji: '😌', label: 'Calm', color: '#009688', value: 'calm' }
];

let userMoodData = {
    currentMood: null,
    moodHistory: [],
    moodStats: {}
};

// FORM FUNCTIONALITY
function initializeMoodForm() {
    const moodOptions = document.getElementById('mood-options');
    const saveBtn = document.getElementById('save-mood-btn');
    
    if (!moodOptions) return;

    // Load current user data
    loadUserMoodData().then(() => {
        // Pre-select current mood if exists
        if (userMoodData.currentMood) {
            const currentOption = document.querySelector(`[data-mood="${userMoodData.currentMood}"]`);
            if (currentOption) {
                currentOption.classList.add('selected');
                saveBtn.disabled = false;
            }
        }
    });
    
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
        renderMoodHistory();
        renderMoodStats();
        updateCurrentMoodDisplay();
    });
}

function loadUserMoodData() {
    return fetch("/emotion/stats/")
        .then(response => response.json())
        .then(data => {
            // data = {weekly, stats, current_emotion}
            //if (data.status === 'success') {
                userMoodData = {
                    currentMood: data.current_mood,   // ex: "happy"
                    moodHistory: data.mood_history,   // list 7 ngày {day, emotion, icon, level}
                    moodStats: data.mood_stats        // thống kê
                };
            //}
        })
        .catch(error => {
            console.error('Error loading mood data:', error);
        });
}

function renderMoodHistory() {
    const moodHistoryElement = document.getElementById('mood-history');
    if (!moodHistoryElement) return;
    
    moodHistoryElement.innerHTML = userMoodData.moodHistory.map(entry => {
        // entry.emotion: "happy" / "sad" / ...
        const moodConfig = moods.find(m => m.value === entry.emotion);
        
        if (!entry.emotion) {
            return `
                <div class="mood-day">
                    <div class="mood-bar" style="height: 0px; background: #e0e0e0"></div>
                    <small>${entry.day}</small>
                </div>
            `;
        }
        
        return `
            <div class="mood-day">
                <div class="mood-bar" style="height: ${entry.level}px; background: ${moodConfig ? moodConfig.color : '#4CAF50'}"></div>
                <small>${entry.day}</small>
            </div>
        `;
    }).join('');
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
        </div>
        <div class="stat-item">
            <div class="stat-label">Most Frequent Mood</div>
            <div class="stat-value">${mostFrequentMoodConfig ? mostFrequentMoodConfig.emoji + ' ' + mostFrequentMoodConfig.label : 'No data'}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Current Streak</div>
            <div class="stat-value">${stats.current_streak || 0} days</div>
        </div>
    `;
}

function updateCurrentMoodDisplay() {
    const moodElement = document.getElementById('current-mood');
    if (!moodElement) return;

    if (userMoodData.currentMood) {
        const moodConfig = moods.find(m => m.value === userMoodData.currentMood);
        moodElement.textContent = moodConfig ? `${moodConfig.emoji} ${moodConfig.label}` : userMoodData.currentMood;
        moodElement.style.color = moodConfig ? moodConfig.color : '#6C63FF';
    } else {
        moodElement.textContent = "No mood set yet";
        moodElement.style.color = '#999';
    }
}

function saveMoodToServer(mood) {
    const notes = document.getElementById('mood-notes')?.value || '';
    
    fetch("/emotion/save-mood/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
            mood: mood,
            notes: notes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Mood saved successfully!');
            window.location.href = "/emotion/view/";
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error saving mood:', error);
        alert('Error saving mood. Please try again.');
    });
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