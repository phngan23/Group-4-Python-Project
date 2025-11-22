// Subject Breakdown với data thật
console.log('Study Tracker App initialized');

let subjectChart = null; // Khai báo biến chart

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing subject breakdown...');
    loadSubjectBreakdown();
});

function loadSubjectBreakdown() {
    console.log('Loading subject breakdown...');
    
    fetch('/visualization/api/subjects/')
        .then(response => response.json())
        .then(data => {
            console.log('Subjects API response:', data);
            if (data.status === 'success') {
                console.log('Subjects data:', data.subjects);
                renderSubjectChart(data.subjects);
                renderSubjectList(data.subjects);
            } else {
                console.error('Subjects API error:', data);
                showSubjectError('Failed to load subject breakdown');
            }
        })
        .catch(error => {
            console.error('Error loading subject breakdown:', error);
            showSubjectError('Error loading subject breakdown');
        });
}

function renderSubjectChart(subjects) {
    console.log('Rendering subject chart with data:', subjects);
    
    const canvas = document.getElementById('subjectChart');
    if (!canvas) {
        console.error('Subject chart canvas not found!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    const labels = subjects.map(subject => subject.name);
    const data = subjects.map(subject => subject.total_minutes / 60); // Convert to hours
    const backgroundColors = subjects.map(subject => subject.color || '#6C63FF'); // Fallback color
    
    console.log('Chart labels:', labels);
    console.log('Chart data:', data);
    console.log('Chart colors:', backgroundColors);
    
    // Destroy existing chart if any - FIXED
    if (subjectChart) {
        console.log('Destroying existing chart...');
        subjectChart.destroy();
        subjectChart = null;
    }
    
    subjectChart = new Chart(ctx, {
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
    
    console.log('Subject chart rendered successfully!');
}

function renderSubjectList(subjects) {
    console.log('Rendering subject list with', subjects.length, 'subjects');
    
    const container = document.getElementById('subjects-list');
    if (!container) {
        console.error('Subjects list container not found!');
        return;
    }
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-subjects">
                <i class="fas fa-books"></i>
                <p>No study data available yet.</p>
            </div>
        `;
        console.log('No subjects to display');
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
    
    console.log('Subject list rendered successfully!');
}

function showSubjectError(message) {
    console.error('Showing error:', message);
    
    const container = document.getElementById('subjects-list');
    if (container) {
        container.innerHTML = `
            <div class="empty-subjects error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}