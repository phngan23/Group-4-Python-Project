// Study Stats với data thật
document.addEventListener('DOMContentLoaded', function() {
    loadStudyStats();
});

function loadStudyStats() {
    fetch('/visualization/api/stats/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateStatsUI(data.data);
                renderWeeklyChart(data.data.weekly_data);
                renderRecentSessions(data.data.recent_sessions);
            } else {
                showError('Failed to load study statistics');
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
            showError('Error loading study statistics');
        });
}

function updateStatsUI(stats) {
    // Update overview cards
    document.getElementById('total-study-time').textContent = stats.total_study_time;
    document.getElementById('current-streak').textContent = stats.current_streak;
    document.getElementById('subjects-count').textContent = stats.subjects_count;
    document.getElementById('avg-session').textContent = stats.avg_session;
}

// Weekly Chart
let weeklyChart = null;

function renderWeeklyChart(weeklyData) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    const labels = weeklyData.map(day => day.day);
    const data = weeklyData.map(day => Math.round(day.minutes / 60 * 10) / 10); // Convert to hours
    
    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Minutes',
                data: minutes,
                backgroundColor: '#6C63FF',
                borderColor: '#4A44C6',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hours = context.parsed.y;
                            const minutes = Math.round(hours * 60);
                            return `${hours.toFixed(1)} hours (${minutes} minutes)`;
                        }
                    }
                }
            }
        }
    });
}

// RECENT SESSIONS LIST
function renderRecentSessions(sessions) {
    const container = document.getElementById('sessions-list');
    container.innerHTML = "";
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-book-open"></i>
                <p>No study sessions recorded yet.</p>
            </div>
        `;
        return;
    }

    sessions.forEach(s => {
        const div = document.createElement("div");
        div.classList.add("session-item");

        div.innerHTML = `
            <div>
                <div class="session-subject">${s.subject}</div>
                <div class="session-date">${s.date} — ${s.time_range}</div>
            </div>
            <div class="session-duration">${s.duration}</div>
        `;

        container.appendChild(div);
    });
    
    /*
    container.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-subject">${session.subject}</div>
            <div class="session-duration">${session.duration}</div>
            <div class="session-date">${session.date}</div>
        </div>
    `).join('');*/
}

function showError(message) {
    const container = document.getElementById('sessions-list');
    container.innerHTML = `
        <div class="no-data error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}