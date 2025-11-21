// Subject Breakdown với data thật
document.addEventListener('DOMContentLoaded', function() {
    loadSubjectBreakdown();
});

function loadSubjectBreakdown() {
    fetch('/studyhabit/api/subjects/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                renderSubjectChart(data.subjects);
                renderSubjectList(data.subjects);
            } else {
                showSubjectError('Failed to load subject breakdown');
            }
        })
        .catch(error => {
            console.error('Error loading subject breakdown:', error);
            showSubjectError('Error loading subject breakdown');
        });
}

function renderSubjectChart(subjects) {
    const ctx = document.getElementById('subjectChart').getContext('2d');
    
    const labels = subjects.map(subject => subject.name);
    const data = subjects.map(subject => subject.total_minutes / 60); // Convert to hours
    const backgroundColors = subjects.map(subject => subject.color || '#6C63FF');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const subject = subjects[context.dataIndex];
                            const hours = (subject.total_minutes / 60).toFixed(1);
                            const percentage = subject.percentage;
                            return `${subject.name}: ${hours}h (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderSubjectList(subjects) {
    const container = document.getElementById('subjects-list');
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-subjects">
                <i class="fas fa-books"></i>
                <p>No study data available yet.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subjects.map(subject => {
        const subjectClass = `subject-${subject.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        return `
            <div class="subject-item ${subjectClass}">
                <div class="subject-info">
                    <span class="subject-name">${subject.name}</span>
                    <span class="study-time">${subject.total_time}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${subject.percentage}%"></div>
                </div>
                <div class="subject-stats">
                    <span><i class="fas fa-play-circle"></i> ${subject.session_count} sessions</span>
                    <span><i class="fas fa-clock"></i> ${subject.avg_time} avg</span>
                </div>
            </div>
        `;
    }).join('');
}

function showSubjectError(message) {
    const container = document.getElementById('subjects-list');
    container.innerHTML = `
        <div class="empty-subjects error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}