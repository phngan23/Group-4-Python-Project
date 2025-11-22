// Study Sessions với data thật
let currentTimeFilter = 'all';
let currentSubjectFilter = 'all';
let availableSubjects = [];

document.addEventListener('DOMContentLoaded', function() {
    loadStudySessions();
    setupEventListeners();
});

function setupEventListeners() {
    // Time filter
    document.getElementById('time-filter').addEventListener('change', function() {
        currentTimeFilter = this.value;
        loadStudySessions();
    });
    
    // Subject filter
    document.getElementById('subject-filter').addEventListener('change', function() {
        currentSubjectFilter = this.value;
        loadStudySessions();
    });
}

function loadStudySessions() {
    // SỬA URL Ở ĐÂY:
    const url = `/visualization/api/sessions/?filter=${currentTimeFilter}&subject=${currentSubjectFilter}`;
    
    console.log('Loading sessions from:', url);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Sessions API response:', data);
            if (data.status === 'success') {
                availableSubjects = data.subjects;
                renderSessions(data.sessions);
                updateSubjectFilterOptions();
            } else {
                console.error('Sessions API error:', data);
                showSessionsError('Failed to load study sessions');
            }
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
            showSessionsError('Error loading study sessions');
        });
}

function renderSessions(sessions) {
    const container = document.getElementById('sessions-container');
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <p>No study sessions found for the selected filters.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sessions.map(session => `
        <div class="session-card">
            <div class="session-header">
                <span class="subject-name">${session.subject}</span>
                <span class="session-date">${session.display_date}</span>
            </div>
            <div class="session-details">
                <span class="duration">${session.duration}</span>
                <span class="time-range">${session.start_time} - ${session.end_time}</span>
            </div>
            <!-- XÓA PHẦN NOTES VÌ MODEL KHÔNG CÓ -->
        </div>
    `).join('');
}

function updateSubjectFilterOptions() {
    const subjectFilter = document.getElementById('subject-filter');
    
    // Giữ option "All Subjects"
    const allOption = subjectFilter.querySelector('option[value="all"]');
    subjectFilter.innerHTML = '';
    subjectFilter.appendChild(allOption);
    
    // Thêm các môn học
    availableSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
    });
    
    // Set lại filter hiện tại
    subjectFilter.value = currentSubjectFilter;
}

function showSessionsError(message) {
    const container = document.getElementById('sessions-container');
    container.innerHTML = `
        <div class="empty-state error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}