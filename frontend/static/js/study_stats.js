// Study Stats với data thật
document.addEventListener('DOMContentLoaded', function() {
    loadStudyStats();
});

function loadStudyStats() {
    console.log('Loading study stats...');
    
    fetch('/visualization/api/stats/')
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data);
            if (data.status === 'success') {
                console.log('Stats data:', data.data);
                updateStatsUI(data.data);
                renderWeeklyChart(data.data.weekly_data);
                renderRecentSessions(data.data.recent_sessions);
            } else {
                console.error('API returned error:', data);
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
    console.log('Weekly data for chart:', weeklyData); // Debug
    
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) {
        console.error('Weekly chart canvas not found!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    const labels = weeklyData.map(day => day.day);
    const data = weeklyData.map(day => Math.round(day.minutes)); // Lấy số phút
    
    console.log('Chart labels:', labels);
    console.log('Chart data:', data);
    
    // Destroy existing chart
    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Study Time (minutes)',
                data: data,
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
                        text: 'Minutes'
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
                            const minutes = context.parsed.y;
                            const hours = (minutes / 60).toFixed(1);
                            return `${minutes} minutes (${hours} hours)`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('Weekly chart rendered!');
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