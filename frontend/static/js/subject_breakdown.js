// subject_breakdown.js - BEAUTIFUL VERSION
console.log('Study Tracker - Subject Breakdown initialized');

let subjectChart = null;

const COLOR_PALETTE = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    '#F9E79F', '#A9DFBF', '#D2B4DE', '#AED6F1', '#F5CBA7'
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting subject breakdown...');
    loadSubjectBreakdown();
    injectBeautifulStyles();
});

const DEFAULT_COLORS = [
    '#6C63FF', // Tím (Purple)
    '#FFA726', // Cam (Orange)
    '#4CAF50', // Xanh lá (Green)
    '#26C6DA', // Xanh ngọc (Cyan)
    '#FF7043', // Đỏ cam (Deep Orange)
    '#7E57C2', // Tím đậm (Deep Purple)
    '#FFCA28', // Vàng (Amber)
    '#EC407A', // Hồng (Pink)
];

function loadSubjectBreakdown() {
    console.log('Loading subject breakdown data...');
    
    fetch('/visualization/api/subjects/')
        .then(response => response.json())
        .then(data => {
            console.log('API response:', data);
            
            if (data.status === 'success' && data.subjects) {
                // Calculate percentages and format data
                const totalMinutes = data.subjects.reduce((sum, subject) => sum + subject.total_minutes, 0);
                const processedSubjects = data.subjects.map((subject, index) => {
                    const percentage = totalMinutes > 0 ? ((subject.total_minutes / totalMinutes) * 100).toFixed(1) : 0;
                    return {
                        ...subject,
                        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
                        percentage: percentage,
                        total_time: formatBeautifulTime(subject.total_minutes),
                        avg_time: formatAverageTime(subject.total_minutes, subject.session_count)
                    };
                });
                
                renderSubjectChart(processedSubjects);
                renderBeautifulSubjectList(processedSubjects);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showBeautifulError();
        });
}

function renderSubjectChart(subjects) {
    const canvas = document.getElementById('subjectChart');
    if (!canvas) {
        console.error('Subject chart canvas not found!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    const labels = subjects.map(subject => subject.name);
    const data = subjects.map(subject => subject.total_minutes / 60); // Convert to hours
    const backgroundColors = subjects.map((subject, index) => {
        // Nếu subject.color tồn tại và có giá trị, sử dụng nó.
        if (subject.color) {
            return subject.color;
        }
        // Ngược lại, sử dụng màu từ mảng mặc định, xoay vòng theo index.
        return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    });
    console.log('Chart labels:', labels);
    console.log('Chart data:', data);
    console.log('Chart colors:', backgroundColors);
    
    if (subjectChart) {
        subjectChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const labels = subjects.map(subject => subject.name);
    const data = subjects.map(subject => (subject.total_minutes / 60).toFixed(1));
    const backgroundColors = subjects.map(subject => subject.color);
    
    subjectChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Arial, sans-serif'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const subject = subjects[context.dataIndex];
                            return `${subject.name}: ${subject.total_time} (${subject.percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderBeautifulSubjectList(subjects) {
    const container = document.getElementById('subjects-list');
    if (!container) return;
    
    // Sort by total minutes (descending)
    const sortedSubjects = [...subjects].sort((a, b) => b.total_minutes - a.total_minutes);
    
    container.innerHTML = sortedSubjects.map(subject => `
        <div class="beautiful-subject-card" style="border-left: 4px solid ${subject.color}">
            <div class="subject-main-info">
                <div class="subject-color-badge" style="background-color: ${subject.color}"></div>
                <div class="subject-text-info">
                    <div class="subject-name">${subject.name}</div>
                    <div class="subject-total-time">${subject.total_time}</div>
                </div>
                <div class="subject-percentage">${subject.percentage}%</div>
            </div>
            
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${subject.percentage}%; background-color: ${subject.color}"></div>
                </div>
            </div>
            
            <div class="subject-stats">
                <div class="stat-item">
                    <span class="stat-icon">📊</span>
                    <span class="stat-value">${subject.session_count || 0} sessions</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-value">${subject.avg_time}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function formatBeautifulTime(minutes) {
    if (minutes < 60) {
        return `${Math.round(minutes)}m`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (mins === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${mins}m`;
        }
    }
}

function formatAverageTime(totalMinutes, sessionCount) {
    if (!sessionCount || sessionCount === 0) return '0m';
    const avgMinutes = totalMinutes / sessionCount;
    return formatBeautifulTime(avgMinutes);
}

function injectBeautifulStyles() {
    const styles = `
        .beautiful-subject-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border-left: 4px solid #6C63FF;
        }
        
        .beautiful-subject-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        
        .subject-main-info {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .subject-color-badge {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .subject-text-info {
            flex: 1;
        }
        
        .subject-name {
            font-size: 18px;
            font-weight: 700;
            color: #2D3748;
            margin-bottom: 4px;
        }
        
        .subject-total-time {
            font-size: 14px;
            color: #718096;
            font-weight: 600;
        }
        
        .subject-percentage {
            font-size: 20px;
            font-weight: 800;
            color: #2D3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .progress-container {
            margin-bottom: 16px;
        }
        
        .progress-bar {
            height: 8px;
            background: #EDF2F7;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.5s ease-in-out;
        }
        
        .subject-stats {
            display: flex;
            gap: 20px;
        }
        
        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stat-icon {
            font-size: 14px;
        }
        
        .stat-value {
            font-size: 13px;
            color: #4A5568;
            font-weight: 600;
        }
        
        #subjects-list {
            max-width: 600px;
            margin: 0 auto;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

function showBeautifulError() {
    const container = document.getElementById('subjects-list');
    if (container) {
        container.innerHTML = `
            <div class="beautiful-subject-card" style="text-align: center; border-left: 4px solid #FF6B6B">
                <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
                <h3 style="color: #2D3748; margin-bottom: 8px;">No Data Available</h3>
                <p style="color: #718096;">Start studying to see your subject breakdown here.</p>
            </div>
        `;
    }
}