// Achievements với data thật
document.addEventListener('DOMContentLoaded', function() {
    loadAchievements();
});

function loadAchievements() {
    fetch('/studyhabit/api/achievements/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateAchievementStats(data.stats);
                renderAchievements(data.achievements);
            } else {
                showAchievementError('Failed to load achievements');
            }
        })
        .catch(error => {
            console.error('Error loading achievements:', error);
            showAchievementError('Error loading achievements');
        });
}

function updateAchievementStats(stats) {
    document.getElementById('achievements-unlocked').textContent = stats.unlocked;
    document.getElementById('achievements-locked').textContent = stats.locked;
    document.getElementById('total-points').textContent = stats.total_points;
}

function renderAchievements(achievements) {
    const container = document.getElementById('achievements-grid');
    
    if (achievements.length === 0) {
        container.innerHTML = `
            <div class="no-achievements">
                <i class="fas fa-trophy"></i>
                <p>No achievements available.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = achievements.map(achievement => {
        const statusClass = achievement.is_unlocked ? 'unlocked' : 'locked';
        const progressBar = achievement.is_unlocked ? '' : `
            <div class="achievement-progress">
                <div class="progress-text">
                    <span>Progress</span>
                    <span>${achievement.progress}/${achievement.requirement}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${achievement.progress_percentage}%"></div>
                </div>
            </div>
        `;
        
        const lockedOverlay = achievement.is_unlocked ? '' : `
            <div class="locked-overlay">
                <i class="fas fa-lock"></i>
            </div>
        `;
        
        return `
            <div class="achievement-card ${statusClass}">
                ${lockedOverlay}
                <div class="achievement-header">
                    <div class="achievement-icon">
                        ${achievement.icon}
                    </div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                </div>
                ${progressBar}
                <div class="achievement-points">+${achievement.points}</div>
            </div>
        `;
    }).join('');
}

function showAchievementError(message) {
    const container = document.getElementById('achievements-grid');
    container.innerHTML = `
        <div class="no-achievements error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}